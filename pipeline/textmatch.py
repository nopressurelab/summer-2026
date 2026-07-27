"""Whole-word / phrase matching over normalized text.

Kept dependency-free so the whole pipeline runs on a stock Python 3.
Matching is case-insensitive (casefold) and whitespace-normalized, and uses
Unicode-aware word boundaries so short terms like "droite" or "rechts" do not
match inside longer words.
"""
import re
import unicodedata

_WS = re.compile(r"\s+")


def normalize(text):
    """Lowercase, unicode-normalize (NFC) and collapse whitespace."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", text)
    text = _WS.sub(" ", text)
    return text.casefold()


def _term_pattern(term):
    # (?<!\w) / (?!\w) give us whole-word matching that also works when the
    # term itself starts/ends with punctuation (e.g. "co2-emissionen").
    return re.compile(r"(?<!\w)" + re.escape(term.casefold()) + r"(?!\w)")


class TermSet:
    """A named collection of terms compiled once and matched many times."""

    def __init__(self, terms):
        self.terms = list(terms or [])
        self._patterns = [(t, _term_pattern(t)) for t in self.terms]

    def found(self, normalized_text):
        """Return the list of terms present in the already-normalized text."""
        hits = []
        for term, pat in self._patterns:
            if pat.search(normalized_text):
                hits.append(term)
        return hits

    def any(self, normalized_text):
        for _term, pat in self._patterns:
            if pat.search(normalized_text):
                return True
        return False
