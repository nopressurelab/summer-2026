"""Fetch an article URL and extract readable body text.

Uses `trafilatura` when it is installed (best-in-class extraction, used in CI),
and otherwise falls back to a dependency-free stdlib HTML-to-text extractor so
the pipeline still runs locally without any pip install.

A URL->text cache (seeded from the previous articles.json) means each run only
downloads URLs it has not seen before.
"""
import urllib.request
from html.parser import HTMLParser

USER_AGENT = ("Mozilla/5.0 (compatible; climate-silent-coverage/1.0; "
              "+https://github.com media-watch dashboard)")

try:
    import trafilatura  # type: ignore
    _HAS_TRAFILATURA = True
except Exception:
    _HAS_TRAFILATURA = False

_SKIP_TAGS = {"script", "style", "noscript", "template", "svg", "head"}

# Consent walls / JS-required / error interstitials sometimes come back instead
# of the article. Treating them as real text would fabricate "omission" flags
# from articles we never actually read, so we reject them (-> low-confidence,
# classified from title + RSS summary instead).
_NON_ARTICLE_MARKERS = (
    "a required part of this site couldn't load",
    "a required part of this site couldn’t load",
    "please enable javascript", "enable javascript to",
    "javascript is disabled", "javascript est désactivé",
    "veuillez activer javascript", "aktivieren sie javascript",
    "por favor, activa javascript", "abilita javascript",
    "subscribe to continue reading", "subscribe to read",
    "this content is not available in your region",
)


def _looks_like_non_article(text):
    head = text[:600].casefold()
    return any(m in head for m in _NON_ARTICLE_MARKERS)


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self._skip_depth = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in _SKIP_TAGS:
            self._skip_depth += 1

    def handle_endtag(self, tag):
        if tag in _SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data):
        if self._skip_depth == 0:
            text = data.strip()
            if text:
                self.parts.append(text)

    def text(self):
        return " ".join(self.parts)


def _download(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    charset = resp.headers.get_content_charset() if hasattr(resp, "headers") else None
    return raw.decode(charset or "utf-8", "replace")


def _stdlib_extract(html):
    parser = _TextExtractor()
    try:
        parser.feed(html)
    except Exception:
        pass
    return parser.text()


def extract(url, timeout=20):
    """Return (text, ok). `ok` is False when nothing usable was retrieved."""
    try:
        if _HAS_TRAFILATURA:
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(
                    downloaded, include_comments=False, include_tables=False)
                if text and len(text) > 200 and not _looks_like_non_article(text):
                    return text, True
            # Fall through to stdlib on trafilatura miss.
        html = _download(url, timeout)
        text = _stdlib_extract(html)
        ok = len(text) > 200 and not _looks_like_non_article(text)
        return (text if ok else "", ok)
    except Exception as exc:
        return ("", False)


def extract_many(rows, cache, timeout=20, log_every=25):
    """Populate each row with `text` and `text_available`, using `cache`.

    `cache` maps url -> text from a previous run. Rows already in cache are not
    re-downloaded. Returns the number of new downloads performed.
    """
    downloads = 0
    for i, row in enumerate(rows):
        url = row["url"]
        if url in cache:
            row["text"] = cache[url]
            row["text_available"] = bool(cache[url])
            continue
        text, ok = extract(url)
        row["text"] = text
        row["text_available"] = ok
        cache[url] = text if ok else ""
        downloads += 1
        if downloads % log_every == 0:
            print("  extracted %d new articles..." % downloads)
    return downloads
