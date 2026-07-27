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


class GdeltBlocked(Exception):
    """Raised when GDELT keeps returning 429 — typically because the caller's IP
    (e.g. a GitHub Actions / datacenter runner) is being rate-limited or blocked.
    Lets the backfill abort early instead of grinding for the whole job timeout."""

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


def _request(query, maxrecords, timespan=None, start=None, end=None):
    params = {
        "query": query,
        "mode": "ArtList",
        "format": "json",
        "maxrecords": str(maxrecords),
        "sort": "datedesc",
    }
    # A date window (start/end, GDELT format YYYYMMDDHHMMSS) takes precedence
    # over a relative timespan; used by the retroactive backfill.
    if start and end:
        params["startdatetime"] = start
        params["enddatetime"] = end
    else:
        params["timespan"] = timespan or "3m"
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
                timespan, pause, retries, domains=None, start=None, end=None):
    query = build_query(topic_terms, sourcelang, domains)
    attempt = 0
    while True:
        try:
            articles = _request(query, maxrecords, timespan, start, end)
            break
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                if attempt < retries:
                    backoff = pause * (2 ** attempt)
                    print("  429 rate-limited, backing off %.1fs" % backoff)
                    time.sleep(backoff)
                    attempt += 1
                    continue
                raise GdeltBlocked("429 after %d retries (%s/%s)"
                                   % (retries, language, topic))
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


def fetch_all(keyword_sets, sources_by_code=None, maxrecords=250,
              timespan="3m", pause=5.0, retries=3, start=None, end=None,
              max_blocked=5):
    """Query every language x topic. `keyword_sets` maps lang-code -> config dict.

    `sources_by_code` optionally maps lang-code -> list of allowlisted domains;
    when present for a language, results are restricted to those outlets (fetched
    across several queries if the list is long). When absent/empty, that language
    is swept across every outlet GDELT indexes.

    Returns a dict keyed by URL (dedup); if the same URL appears under multiple
    topics we keep the first and record the extra topics in `topics`.
    """
    sources_by_code = sources_by_code or {}
    by_url = {}
    blocked = 0
    for code, cfg in keyword_sets.items():
        language = cfg["language"]
        sourcelang = cfg["sourcelang"]
        domains = sources_by_code.get(code) or None
        # One "batch" is None (broad sweep) or a chunk of allowlisted domains.
        batches = list(_chunk(domains, CHUNK_DOMAINS)) if domains else [None]
        for topic, terms in cfg["topics"].items():
            scope = ("%d sources" % len(domains)) if domains else "all sources"
            print("Fetching %s / %s (%s) ..." % (language, topic, scope))
            got = 0
            for batch in batches:
                try:
                    rows = fetch_topic(topic, terms, sourcelang, language,
                                       maxrecords, timespan, pause, retries,
                                       domains=batch, start=start, end=end)
                except GdeltBlocked:
                    blocked += 1
                    if blocked >= max_blocked:
                        print("  GDELT rate-limited %d times in a row — likely "
                              "blocking this IP. Aborting run early." % blocked)
                        raise
                    time.sleep(pause)
                    continue
                blocked = 0  # a success clears the streak
                got += len(rows)
                for row in rows:
                    existing = by_url.get(row["url"])
                    if existing:
                        if row["topic"] not in existing["topics"]:
                            existing["topics"].append(row["topic"])
                    else:
                        row["topics"] = [row["topic"]]
                        by_url[row["url"]] = row
                time.sleep(pause)  # be polite between queries
            print("  got %d" % got)
    return by_url
