"""Keyword-rule classification with saved evidence.

For each article we record which climate / political / topic terms appear, and
derive two neutral flags:
  omits_climate    - topic article that never mentions climate change
  omits_political  - topic article that never mentions government / policy
                     accountability

The evidence (terms found, plus an excerpt) is stored so the dashboard can show
*why* an article was flagged, and readers can verify it themselves.
"""
import json
import os

from .textmatch import TermSet, normalize

EXCERPT_LEN = 320


def load_keyword_sets(keywords_dir, langs=None):
    sets = {}
    for name in sorted(os.listdir(keywords_dir)):
        if not name.endswith(".json"):
            continue
        code = name[:-5]
        if langs and code not in langs:
            continue
        with open(os.path.join(keywords_dir, name), encoding="utf-8") as fh:
            sets[code] = json.load(fh)
    return sets


def build_matchers(keyword_sets):
    matchers = {}
    for code, cfg in keyword_sets.items():
        topic_sets = {t: TermSet(terms) for t, terms in cfg["topics"].items()}
        all_topic_terms = [t for terms in cfg["topics"].values() for t in terms]
        matchers[code] = {
            "language": cfg["language"],
            "topics": topic_sets,
            "topic_all": TermSet(all_topic_terms),
            "climate": TermSet(cfg.get("climate", [])),
            "political": TermSet(cfg.get("political", [])),
        }
    return matchers


def _excerpt(text, title, topic_terms):
    source = text or title or ""
    if not source:
        return ""
    lowered = source.casefold()
    # Center the excerpt on the first topic term when we can find one.
    idx = -1
    for term in topic_terms:
        found = lowered.find(term.casefold())
        if found != -1:
            idx = found
            break
    if idx == -1:
        snippet = source[:EXCERPT_LEN]
    else:
        start = max(0, idx - 80)
        snippet = source[start:start + EXCERPT_LEN]
        if start > 0:
            snippet = "…" + snippet
    snippet = " ".join(snippet.split())
    if len(source) > len(snippet):
        snippet = snippet.rstrip() + "…"
    return snippet


def classify_row(row, matcher_for_lang):
    m = matcher_for_lang
    title = row.get("title", "")
    text = row.get("text", "")
    combined = normalize(title + " . " + text)

    topic_terms = []
    for tset in m["topics"].values():
        topic_terms.extend(tset.found(combined))
    topic_terms = sorted(set(topic_terms))

    climate_terms = m["climate"].found(combined)
    political_terms = m["political"].found(combined)

    mentions_climate = bool(climate_terms)
    mentions_political = bool(political_terms)

    row["mentions_climate"] = mentions_climate
    row["mentions_political_responsibility"] = mentions_political
    row["omits_climate"] = not mentions_climate
    row["omits_political"] = not mentions_political
    row["low_confidence"] = not row.get("text_available", False)
    row["evidence"] = {
        "topic_terms": topic_terms,
        "climate_terms": climate_terms,
        "political_terms": political_terms,
        "excerpt": _excerpt(text, title, topic_terms),
    }
    return row


def classify_all(rows_by_url, matchers):
    """Classify in place; drop rows whose language has no matcher."""
    out = []
    for row in rows_by_url.values():
        code = _lang_code(row["language"])
        matcher = matchers.get(code)
        if not matcher:
            continue
        classify_row(row, matcher)
        out.append(row)
    return out


_LANG_TO_CODE = {
    "English": "en", "French": "fr", "Spanish": "es",
    "German": "de", "Italian": "it",
}


def _lang_code(language):
    return _LANG_TO_CODE.get(language, language.lower()[:2])
