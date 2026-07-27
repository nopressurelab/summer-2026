"""Orchestrate the pipeline and write the static JSON the dashboard reads.

Two discovery sources, both feeding one accumulated dataset:

    # forward, current items from each source's own RSS feeds (no rate limit)
    python -m pipeline.build --source rss

    # retroactive: walk GDELT day-by-day from the oldest unprocessed day
    python -m pipeline.build --source gdelt --backfill --backfill-days 5

    # one-shot GDELT over a relative window (no state)
    python -m pipeline.build --source gdelt --timespan 3m

Each run MERGES into data/articles.json (dedupe by URL) and prunes anything
older than --window-days, so RSS grows coverage going forward while the backfill
fills history going backward.

Output (served at the site root by GitHub Pages):
    data/articles.json         - one record per article (excerpt only)
    data/meta.json             - counts + last_updated for the dashboard
    data/backfill_state.json   - which days GDELT has already processed
"""
import argparse
import hashlib
import json
import os
from datetime import datetime, timedelta, timezone

from . import fetch as fetch_mod
from . import fetch_rss as fetch_rss_mod
from . import extract as extract_mod
from . import classify as classify_mod

HERE = os.path.dirname(os.path.abspath(__file__))
KEYWORDS_DIR = os.path.join(HERE, "keywords")
SOURCES_DIR = os.path.join(HERE, "sources")
DATA_DIR = os.path.abspath(os.path.join(HERE, "..", "data"))
ARTICLES_PATH = os.path.join(DATA_DIR, "articles.json")
META_PATH = os.path.join(DATA_DIR, "meta.json")
STATE_PATH = os.path.join(DATA_DIR, "backfill_state.json")
# Full-text cache lives outside docs/ and is gitignored (can be large).
CACHE_PATH = os.path.join(HERE, ".cache", "texts.json")

OUTPUT_FIELDS = [
    "id", "url", "title", "domain", "source_country", "source_name", "language",
    "topic", "topics", "seendate", "socialimage", "text_available",
    "low_confidence", "mentions_climate", "mentions_political_responsibility",
    "omits_climate", "omits_political", "evidence", "fetched_at",
]


def _article_id(url):
    return hashlib.sha1(url.encode("utf-8")).hexdigest()[:12]


def _today():
    return datetime.now(timezone.utc).date()


# ---------- source loading ----------

def _load_source_files(langs):
    out = {}
    if not os.path.isdir(SOURCES_DIR):
        return out
    for code in langs:
        path = os.path.join(SOURCES_DIR, code + ".json")
        if not os.path.exists(path):
            continue
        try:
            with open(path, encoding="utf-8") as fh:
                out[code] = json.load(fh)
        except Exception:
            continue
    return out


def load_source_domains(langs):
    """lang-code -> [domain, ...] (for the GDELT allowlist)."""
    out = {}
    for code, cfg in _load_source_files(langs).items():
        domains = [s["domain"].strip() for s in cfg.get("sources", [])
                   if s.get("domain")]
        if domains:
            out[code] = domains
    return out


def load_source_configs(langs):
    """lang-code -> [{name, domain, feeds, country}, ...] (for RSS)."""
    out = {}
    for code, cfg in _load_source_files(langs).items():
        out[code] = cfg.get("sources", [])
    return out


# ---------- cache ----------

def load_cache():
    if not os.path.exists(CACHE_PATH):
        return {}
    try:
        with open(CACHE_PATH, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return {}


def save_cache(cache, current_urls):
    pruned = {u: cache[u] for u in current_urls if cache.get(u)}
    os.makedirs(os.path.dirname(CACHE_PATH), exist_ok=True)
    with open(CACHE_PATH, "w", encoding="utf-8") as fh:
        json.dump(pruned, fh, ensure_ascii=False)


# ---------- backfill state ----------

def load_state():
    if not os.path.exists(STATE_PATH):
        return {"processed_days": []}
    try:
        with open(STATE_PATH, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return {"processed_days": []}


def save_state(state):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as fh:
        json.dump(state, fh, ensure_ascii=False, indent=1)


def next_backfill_days(state, window_days, days_per_run):
    """Oldest-first list of unprocessed days within the rolling window."""
    today = _today()
    start = today - timedelta(days=window_days)
    done = set(state.get("processed_days", []))
    days = []
    d = start
    while d <= today:
        iso = d.isoformat()
        if iso not in done:
            days.append(iso)
        d += timedelta(days=1)
    return days[:days_per_run]


# ---------- discovery ----------

def discover(args, keyword_sets):
    if args.source == "rss":
        configs = load_source_configs(list(keyword_sets))
        print("Source: RSS feeds")
        return fetch_rss_mod.fetch_all_rss(
            keyword_sets, configs, pause=args.pause, timeout=25)

    domains = {} if args.no_sources else load_source_domains(list(keyword_sets))
    if domains:
        print("GDELT allowlist: " + ", ".join(
            "%s=%d" % (c, len(d)) for c, d in domains.items()))

    if not args.backfill:
        print("Source: GDELT one-shot, timespan=%s" % args.timespan)
        return fetch_mod.fetch_all(
            keyword_sets, sources_by_code=domains, maxrecords=args.maxrecords,
            timespan=args.timespan, pause=args.pause)

    # Retroactive backfill: process the oldest unprocessed days first.
    state = load_state()
    days = next_backfill_days(state, args.window_days, args.backfill_days)
    if not days:
        print("Backfill: nothing to do — history is caught up.")
        return {}
    print("Backfill: processing %d day(s): %s .. %s"
          % (len(days), days[0], days[-1]))
    by_url = {}
    for day in days:
        start = day.replace("-", "") + "000000"
        end = day.replace("-", "") + "235959"
        print("  --- %s ---" % day)
        day_rows = fetch_mod.fetch_all(
            keyword_sets, sources_by_code=domains, maxrecords=args.maxrecords,
            pause=args.pause, start=start, end=end)
        by_url.update({u: r for u, r in day_rows.items() if u not in by_url})
    # Record progress + prune old days out of the window.
    win_start = (_today() - timedelta(days=args.window_days)).isoformat()
    processed = set(state.get("processed_days", [])) | set(days)
    state["processed_days"] = sorted(d for d in processed if d >= win_start)
    state["window_days"] = args.window_days
    save_state(state)
    return by_url


# ---------- processing ----------

def process_rows(rows, keyword_sets, no_extract):
    if no_extract:
        for r in rows:
            r.setdefault("text", "")
            r["text_available"] = False
    else:
        cache = load_cache()
        n = extract_mod.extract_many(rows, cache)
        print("Downloaded %d new article bodies" % n)
        save_cache(cache, [r["url"] for r in rows])

    matchers = classify_mod.build_matchers(keyword_sets)
    classified = classify_mod.classify_all({r["url"]: r for r in rows}, matchers)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    for r in classified:
        r.setdefault("fetched_at", stamp)
    return [to_output(r) for r in classified]


def to_output(row):
    row["id"] = _article_id(row["url"])
    row["topic"] = row.get("topics", [row.get("topic")])[0]
    return {k: row.get(k) for k in OUTPUT_FIELDS}


# ---------- accumulation ----------

def load_existing_articles():
    if not os.path.exists(ARTICLES_PATH):
        return []
    try:
        with open(ARTICLES_PATH, encoding="utf-8") as fh:
            return json.load(fh)
    except Exception:
        return []


def merge_and_prune(existing, fresh, window_days):
    by_id = {a["id"]: a for a in existing}
    for a in fresh:
        by_id[a["id"]] = a  # newest wins
    cutoff = (_today() - timedelta(days=window_days)).strftime("%Y%m%d")
    kept = []
    for a in by_id.values():
        seen = (a.get("seendate") or "")[:8]
        if seen and seen < cutoff:
            continue  # older than the rolling window
        kept.append(a)
    kept.sort(key=lambda a: a.get("seendate", ""), reverse=True)
    return kept


# ---------- meta ----------

def build_meta(articles, langs, window_days, source):
    by_language, by_topic, source_counts = {}, {}, {}
    for a in articles:
        L = by_language.setdefault(a["language"],
                                   {"total": 0, "omits_climate": 0, "omits_political": 0})
        L["total"] += 1
        L["omits_climate"] += int(a["omits_climate"])
        L["omits_political"] += int(a["omits_political"])
        for t in a.get("topics") or [a.get("topic")]:
            T = by_topic.setdefault(t, {"total": 0, "omits_climate": 0, "omits_political": 0})
            T["total"] += 1
            T["omits_climate"] += int(a["omits_climate"])
            T["omits_political"] += int(a["omits_political"])
        dom = a.get("domain") or "(unknown)"
        S = source_counts.setdefault(dom, {"total": 0, "omits_climate": 0, "omits_political": 0})
        S["total"] += 1
        S["omits_climate"] += int(a["omits_climate"])
        S["omits_political"] += int(a["omits_political"])

    top_sources = sorted(
        ({"domain": d, **v} for d, v in source_counts.items()),
        key=lambda s: (s["omits_climate"], s["total"]), reverse=True)[:25]

    return {
        "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "window_days": window_days,
        "last_source": source,
        "languages": langs,
        "total_articles": len(articles),
        "total_omits_climate": sum(a["omits_climate"] for a in articles),
        "total_omits_political": sum(a["omits_political"] for a in articles),
        "by_language": by_language,
        "by_topic": by_topic,
        "top_sources": top_sources,
    }


# ---------- main ----------

def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", choices=["rss", "gdelt"], default="rss",
                    help="discovery method (default: rss)")
    ap.add_argument("--languages", default="en,fr,es,de,it,pt")
    ap.add_argument("--topics", default="", help="subset of topics (default: all)")
    ap.add_argument("--limit", type=int, default=0, help="cap articles processed")
    ap.add_argument("--window-days", type=int, default=90,
                    help="rolling window; older articles are pruned")
    ap.add_argument("--timespan", default="3m", help="GDELT one-shot timespan")
    ap.add_argument("--backfill", action="store_true",
                    help="GDELT: walk oldest unprocessed days first (stateful)")
    ap.add_argument("--backfill-days", type=int, default=5,
                    help="days to process per backfill run")
    ap.add_argument("--maxrecords", type=int, default=250)
    ap.add_argument("--pause", type=float, default=3.0,
                    help="seconds between network requests")
    ap.add_argument("--no-extract", action="store_true",
                    help="skip full-text fetch; classify on titles/summaries only")
    ap.add_argument("--no-sources", action="store_true",
                    help="GDELT: ignore allowlist; sweep every outlet")
    ap.add_argument("--no-accumulate", action="store_true",
                    help="overwrite the dataset instead of merging with prior runs")
    args = ap.parse_args()

    langs = [c.strip() for c in args.languages.split(",") if c.strip()]
    only_topics = {t.strip() for t in args.topics.split(",") if t.strip()}

    keyword_sets = classify_mod.load_keyword_sets(KEYWORDS_DIR, langs)
    if only_topics:
        for cfg in keyword_sets.values():
            cfg["topics"] = {t: v for t, v in cfg["topics"].items() if t in only_topics}
    print("Languages: %s" % ", ".join(keyword_sets))

    by_url = discover(args, keyword_sets)
    print("Discovered %d unique articles" % len(by_url))

    rows = list(by_url.values())
    if args.limit:
        rows = rows[:args.limit]
    fresh = process_rows(rows, keyword_sets, args.no_extract)

    existing = [] if args.no_accumulate else load_existing_articles()
    articles = merge_and_prune(existing, fresh, args.window_days)

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(ARTICLES_PATH, "w", encoding="utf-8") as fh:
        json.dump(articles, fh, ensure_ascii=False, indent=1)
    meta = build_meta(articles, list(keyword_sets), args.window_days, args.source)
    with open(META_PATH, "w", encoding="utf-8") as fh:
        json.dump(meta, fh, ensure_ascii=False, indent=1)

    print("Fresh this run: %d | total after merge: %d -> %s"
          % (len(fresh), len(articles), ARTICLES_PATH))
    print("  omits_climate=%d  omits_political=%d"
          % (meta["total_omits_climate"], meta["total_omits_political"]))


if __name__ == "__main__":
    main()
