"""Discovery via the GDELT DOC 2.0 API (free, no API key).

Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/

GDELT rate-limits aggressively (HTTP 429), so we space requests out and back
off on 429. Returns a list of raw article dicts (deduped by URL) that the rest
of the pipeline enriches.
"""
import json
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.gdeltproject.org/api/v2/doc/doc"
USER_AGENT = "climate-silent-coverage-dashboard/1.0 (+github pages media-watch)"

# Max terms per topic to put into a single GDELT query (keeps the query short
# and precise; the full keyword lists are still used later for classification).
MAX_QUERY_TERMS = 6
# How many allowlisted domains to OR into a single GDELT query (keeps the query
# length sane; more domains than this are fetched across several queries).
CHUNK_DOMAINS = 10


def _quote_term(term):
    return '"%s"' % term if " " in term else term


def _chunk(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i + n]


def build_query(topic_terms, sourcelang, domains=None):
    terms = topic_terms[:MAX_QUERY_TERMS]
    ors = " OR ".join(_quote_term(t) for t in terms)
    query = "(%s) sourcelang:%s" % (ors, sourcelang)
    if domains:
        query += " (%s)" % " OR ".join("domain:%s" % d for d in domains)
    return query


def _request(query, maxrecords, timespan):
    params = {
        "query": query,
        "mode": "ArtList",
        "format": "json",
        "maxrecords": str(maxrecords),
        "timespan": timespan,
        "sort": "datedesc",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        raw = resp.read().decode("utf-8", "replace")
    if not raw.strip():
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # GDELT occasionally returns an HTML error page; treat as empty.
        return []
    return data.get("articles", []) or []


def fetch_topic(topic, topic_terms, sourcelang, language, maxrecords,
                timespan, pause, retries, domains=None):
    query = build_query(topic_terms, sourcelang, domains)
    attempt = 0
    while True:
        try:
            articles = _request(query, maxrecords, timespan)
            break
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < retries:
                backoff = pause * (2 ** attempt)
                print("  429 rate-limited, backing off %.1fs" % backoff)
                time.sleep(backoff)
                attempt += 1
                continue
            print("  HTTP error %s for %s/%s" % (exc.code, language, topic))
            return []
        except Exception as exc:  # network hiccup, timeout, etc.
            if attempt < retries:
                time.sleep(pause * (2 ** attempt))
                attempt += 1
                continue
            print("  error for %s/%s: %s" % (language, topic, exc))
            return []

    out = []
    for a in articles:
        url = a.get("url")
        if not url:
            continue
        out.append({
            "url": url,
            "title": a.get("title", "").strip(),
            "domain": a.get("domain", ""),
            "source_country": a.get("sourcecountry", ""),
            "language": language,
            "topic": topic,
            "seendate": a.get("seendate", ""),
            "socialimage": a.get("socialimage", ""),
        })
    return out


def fetch_all(keyword_sets, maxrecords=250, timespan="3m", pause=5.0, retries=3):
    """Query every language x topic. `keyword_sets` maps lang-code -> config dict.

    Returns a dict keyed by URL (dedup); if the same URL appears under multiple
    topics we keep the first and record the extra topics in `topics`.
    """
    by_url = {}
    for code, cfg in keyword_sets.items():
        language = cfg["language"]
        sourcelang = cfg["sourcelang"]
        for topic, terms in cfg["topics"].items():
            print("Fetching %s / %s ..." % (language, topic))
            rows = fetch_topic(topic, terms, sourcelang, language,
                               maxrecords, timespan, pause, retries)
            print("  got %d" % len(rows))
            for row in rows:
                existing = by_url.get(row["url"])
                if existing:
                    if row["topic"] not in existing["topics"]:
                        existing["topics"].append(row["topic"])
                else:
                    row["topics"] = [row["topic"]]
                    by_url[row["url"]] = row
            time.sleep(pause)  # be polite between queries
    return by_url
