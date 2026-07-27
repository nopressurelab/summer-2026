"""Discovery via each source's own RSS/Atom feeds (no central rate limit).

This reads the `feeds` listed for each source in pipeline/sources/<lang>.json,
keeps only items whose title/summary match that language's topic keywords, and
returns rows in the same shape as fetch.py so the rest of the pipeline is
unchanged.

Because a feed only exposes recent items, build.py accumulates results across
runs (merge + dedupe + prune) to grow the rolling window over time.

Dependency-free: RSS 2.0 and Atom are both parsed with xml.etree.
"""
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree as ET

from .textmatch import TermSet, normalize

USER_AGENT = ("Mozilla/5.0 (compatible; climate-silent-coverage/1.0; "
              "+https://github.com media-watch dashboard)")


def _localname(tag):
    return tag.rsplit("}", 1)[-1].lower() if "}" in tag else tag.lower()


def _first_child_text(el, names):
    for child in el:
        if _localname(child.tag) in names and child.text:
            return child.text.strip()
    return ""


def _extract_link(item):
    # RSS: <link>url</link>. Atom: <link href="url" rel="alternate"/>.
    href = ""
    for child in item:
        if _localname(child.tag) != "link":
            continue
        if child.text and child.text.strip():
            return child.text.strip()
        rel = child.get("rel", "alternate")
        if rel == "alternate" and child.get("href"):
            return child.get("href").strip()
        if not href and child.get("href"):
            href = child.get("href").strip()
    return href


def _to_seendate(raw):
    """Normalize a pubDate/updated string to GDELT-style YYYYMMDDTHHMMSSZ."""
    if not raw:
        return ""
    raw = raw.strip()
    dt = None
    try:
        dt = parsedate_to_datetime(raw)  # RFC 822 (RSS)
    except (TypeError, ValueError, IndexError):
        dt = None
    if dt is None:
        try:
            dt = _parse_iso(raw)  # ISO 8601 (Atom)
        except ValueError:
            return ""
    if dt is None:
        return ""
    try:
        from datetime import timezone
        if dt.tzinfo is not None:
            dt = dt.astimezone(timezone.utc)
    except Exception:
        pass
    return dt.strftime("%Y%m%dT%H%M%SZ")


def _parse_iso(raw):
    from datetime import datetime
    txt = raw.replace("Z", "+00:00")
    return datetime.fromisoformat(txt)


def parse_feed(xml_bytes):
    """Return a list of {title, link, published, summary} from RSS or Atom."""
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return []
    items = []
    for el in root.iter():
        if _localname(el.tag) in ("item", "entry"):
            items.append({
                "title": _first_child_text(el, {"title"}),
                "link": _extract_link(el),
                "published": _first_child_text(
                    el, {"pubdate", "published", "updated", "date"}),
                "summary": _first_child_text(
                    el, {"description", "summary", "content"}),
            })
    return items


def fetch_feed(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _domain(url):
    net = urllib.parse.urlparse(url).netloc.lower()
    return net[4:] if net.startswith("www.") else net


def _build_topic_matchers(cfg):
    return {t: TermSet(terms) for t, terms in cfg["topics"].items()}


def fetch_all_rss(keyword_sets, source_configs_by_code, pause=1.0,
                  timeout=25, max_age_days=548):
    """Read every source feed and keep topic-matching items.

    `source_configs_by_code` maps lang-code -> [{name, domain, feeds}, ...].
    Items with a publish date older than `max_age_days` (default ~18 months)
    are dropped: RSS should carry recent items, so a very old date signals an
    evergreen/mis-dated entry rather than real coverage. Items with no parseable
    date are kept. Returns a dict keyed by URL (same shape as fetch.fetch_all).
    """
    cutoff = None
    if max_age_days:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=max_age_days)).strftime("%Y%m%d")
    by_url = {}
    for code, cfg in keyword_sets.items():
        language = cfg["language"]
        topic_matchers = _build_topic_matchers(cfg)
        sources = source_configs_by_code.get(code, [])
        for source in sources:
            feeds = source.get("feeds") or []
            for feed_url in feeds:
                kept = _ingest_feed(feed_url, source, language, topic_matchers,
                                    by_url, timeout, cutoff)
                print("  %-40s +%d  (%s)" % (
                    feed_url[:40], kept, source.get("name", "")))
                time.sleep(pause)
    return by_url


def _ingest_feed(feed_url, source, language, topic_matchers, by_url, timeout,
                 cutoff=None):
    try:
        xml_bytes = fetch_feed(feed_url, timeout)
    except (urllib.error.URLError, urllib.error.HTTPError, Exception) as exc:
        print("  ! feed failed: %s (%s)" % (feed_url[:50], exc))
        return 0
    kept = 0
    for item in parse_feed(xml_bytes):
        url = item.get("link")
        title = item.get("title", "")
        if not url or not title:
            continue
        seendate = _to_seendate(item.get("published", ""))
        if cutoff and seendate and seendate[:8] < cutoff:
            continue  # evergreen / mis-dated old item
        haystack = normalize(title + " . " + item.get("summary", ""))
        topics = [t for t, ts in topic_matchers.items() if ts.any(haystack)]
        if not topics:
            continue  # not about heat / wildfire / excess deaths / floods
        existing = by_url.get(url)
        if existing:
            for t in topics:
                if t not in existing["topics"]:
                    existing["topics"].append(t)
            continue
        by_url[url] = {
            "url": url,
            "title": title,
            "domain": source.get("domain") or _domain(url),
            "source_country": source.get("country", ""),
            "source_name": source.get("name", ""),
            "language": language,
            "topic": topics[0],
            "topics": topics,
            "seendate": seendate,
            "socialimage": "",
            "rss_summary": item.get("summary", ""),
        }
        kept += 1
    return kept
