"""Orchestrate the pipeline and write the static JSON the dashboard reads.

    python -m pipeline.build [--languages en,fr] [--topics wildfire]
                             [--limit N] [--timespan 3m] [--no-extract]

Output:
    docs/data/articles.json  - one record per article (excerpt only, no full text)
    docs/data/meta.json      - counts + last_updated for the summary tiles
"""
import argparse
import hashlib
import json
import os
from datetime import datetime, timezone

from . import fetch as fetch_mod
from . import extract as extract_mod
from . import classify as classify_mod

HERE = os.path.dirname(os.path.abspath(__file__))
KEYWORDS_DIR = os.path.join(HERE, "keywords")
SOURCES_DIR = os.path.join(HERE, "sources")
DATA_DIR = os.path.abspath(os.path.join(HERE, "..", "docs", "data"))
ARTICLES_PATH = os.path.join(DATA_DIR, "articles.json")
META_PATH = os.path.join(DATA_DIR, "meta.json")
# Full-text cache lives outside docs/ and is gitignored (can be large). It lets
# local re-runs skip re-downloading; CI starts fresh and re-downloads.
CACHE_PATH = os.path.join(HERE, ".cache", "texts.json")

OUTPUT_FIELDS = [
    "id", "url", "title", "domain", "source_country", "language",
    "topic", "topics", "seendate", "socialimage", "text_available",
    "low_confidence", "mentions_climate", "mentions_political_responsibility",
    "omits_climate", "omits_political", "evidence",
]


def _article_id(url):
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def load_sources(langs):
    """Return lang-code -> [domain, ...] for every sources/<code>.json present."""
    out = {}
    if not os.path.isdir(SOURCES_DIR):
        return out
    for code in langs:
        path = os.path.join(SOURCES_DIR, code + ".json")
        if not os.path.exists(path):
            continue
        try:
            with open(path, encoding="utf-8") as fh:
                cfg = json.load(fh)
        except Exception:
            continue
        domains = [s["domain"].strip() for s in cfg.get("sources", [])
                   if s.get("domain")]
        if domains:
            out[code] = domains
    return out


def load_cache():
    """Load the URL->full-text cache from the last local run (if any)."""
    if not os.path.exists(CACHE_PATH):
        return {}
    try:
        with open(CACHE_PATH, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return {}


def save_cache(cache, current_urls):
    """Persist only the URLs seen this run, to bound cache growth."""
    pruned = {u: cache[u] for u in current_urls if cache.get(u)}
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as fh:
        json.dump(pruned, fh, ensure_ascii=False)


def to_output(row):
    row["id"] = _article_id(row["url"])
    row["topic"] = row.get("topics", [row.get("topic")])[0]
    return {k: row.get(k) for k in OUTPUT_FIELDS}


def build_meta(articles, langs, timespan):
    by_language = {}
    by_topic = {}
    source_counts = {}
    for a in articles:
        lang = a["language"]
        L = by_language.setdefault(
            lang, {"total": 0, "omits_climate": 0, "omits_political": 0})
        L["total"] += 1
        L["omits_climate"] += int(a["omits_climate"])
        L["omits_political"] += int(a["omits_political"])
        for t in a.get("topics") or [a.get("topic")]:
            T = by_topic.setdefault(
                t, {"total": 0, "omits_climate": 0, "omits_political": 0})
            T["total"] += 1
            T["omits_climate"] += int(a["omits_climate"])
            T["omits_political"] += int(a["omits_political"])
        dom = a.get("domain") or "(unknown)"
        S = source_counts.setdefault(
            dom, {"total": 0, "omits_climate": 0, "omits_political": 0})
        S["total"] += 1
        S["omits_climate"] += int(a["omits_climate"])
        S["omits_political"] += int(a["omits_political"])

    top_sources = sorted(
        ({"domain": d, **v} for d, v in source_counts.items()),
        key=lambda s: (s["omits_climate"], s["total"]), reverse=True)[:25]

    return {
        "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "timespan": timespan,
        "languages": langs,
        "total_articles": len(articles),
        "total_omits_climate": sum(a["omits_climate"] for a in articles),
        "total_omits_political": sum(a["omits_political"] for a in articles),
        "by_language": by_language,
        "by_topic": by_topic,
        "top_sources": top_sources,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--languages", default="en,fr,es,de,it",
                    help="comma-separated lang codes to include")
    ap.add_argument("--topics", default="",
                    help="comma-separated topics to include (default: all)")
    ap.add_argument("--limit", type=int, default=0,
                    help="cap total articles processed (0 = no cap)")
    ap.add_argument("--timespan", default="3m",
                    help="GDELT timespan, e.g. 3m, 7d")
    ap.add_argument("--maxrecords", type=int, default=250)
    ap.add_argument("--pause", type=float, default=5.0,
                    help="seconds between GDELT requests (rate-limit friendly)")
    ap.add_argument("--no-extract", action="store_true",
                    help="skip full-text fetch; classify on titles only")
    ap.add_argument("--no-sources", action="store_true",
                    help="ignore the sources/ allowlist; sweep every outlet")
    args = ap.parse_args()

    langs = [c.strip() for c in args.languages.split(",") if c.strip()]
    only_topics = {t.strip() for t in args.topics.split(",") if t.strip()}

    keyword_sets = classify_mod.load_keyword_sets(KEYWORDS_DIR, langs)
    if only_topics:
        for cfg in keyword_sets.values():
            cfg["topics"] = {t: v for t, v in cfg["topics"].items()
                             if t in only_topics}

    sources_by_code = {} if args.no_sources else load_sources(list(keyword_sets))
    print("Languages: %s" % ", ".join(keyword_sets))
    if sources_by_code:
        print("Source allowlist: " + ", ".join(
            "%s=%d" % (c, len(d)) for c, d in sources_by_code.items()))
    else:
        print("Source allowlist: none (sweeping all outlets)")
    by_url = fetch_mod.fetch_all(
        keyword_sets, sources_by_code=sources_by_code,
        maxrecords=args.maxrecords, timespan=args.timespan, pause=args.pause)
    print("Discovered %d unique articles" % len(by_url))

    rows = list(by_url.values())
    if args.limit:
        rows = rows[:args.limit]

    if args.no_extract:
        for r in rows:
            r["text"] = ""
            r["text_available"] = False
    else:
        cache = load_cache()
        n = extract_mod.extract_many(rows, cache)
        print("Downloaded %d new article bodies" % n)
        save_cache(cache, [r["url"] for r in rows])

    matchers = classify_mod.build_matchers(keyword_sets)
    rows_by_url = {r["url"]: r for r in rows}
    classified = classify_mod.classify_all(rows_by_url, matchers)

    articles = [to_output(r) for r in classified]
    articles.sort(key=lambda a: a.get("seendate", ""), reverse=True)

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(ARTICLES_PATH, "w", encoding="utf-8") as fh:
        json.dump(articles, fh, ensure_ascii=False, indent=1)
    meta = build_meta(articles, list(keyword_sets), args.timespan)
    with open(META_PATH, "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=1)

    print("Wrote %d articles -> %s" % (len(articles), ARTICLES_PATH))
    print("  omits_climate=%d  omits_political=%d"
          % (meta["total_omits_climate"], meta["total_omits_political"]))


if __name__ == "__main__":
    main()
