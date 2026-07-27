# Climate-Silent Coverage

A dashboard tracking how major **English, French, Spanish, German and Italian**
newspapers cover **heat waves, excess deaths and wildfires** — and flagging the
articles that **omit any mention of climate change** or of **government / policy
accountability**.

The intent is media-watch transparency: to make visible where extreme-climate
reporting drops the climate and political-responsibility context. Every flag is
derived from transparent keyword rules and shown **with its evidence**, so
readers can verify each call themselves.

- **Live dashboard:** enable GitHub Pages (see below) → `https://<user>.github.io/<repo>/`
- **Data sources:** each newspaper's own **RSS feeds** (primary, no rate limit) plus the free [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) for **retroactive backfill** (no API key)
- **Cost:** $0 — static site on GitHub Pages, refreshed by a scheduled GitHub Action

## How it works

```
GitHub Action (daily)                          GitHub Pages (static)
────────────────────                           ─────────────────────
pipeline/fetch.py     GDELT discovery  ┐
pipeline/extract.py   full-text fetch  ├─► docs/data/articles.json ─► docs/index.html
pipeline/classify.py  keyword flags    │   docs/data/meta.json        docs/app.js
pipeline/build.py     writes JSON      ┘   (committed by the Action)   (client-side search)
```

Data flows one direction. The browser only ever reads the pre-built JSON and does
all search/filtering client-side — no live API calls from the page.

### Pipeline stages

1. **Discovery — `fetch.py`.** For each language × topic (heat wave / excess
   deaths / wildfire) it queries GDELT with that language's phrases plus a
   `sourcelang:` filter. GDELT rate-limits hard, so requests are spaced out
   (`--pause`) with exponential backoff on HTTP 429.
2. **Full text — `extract.py`.** Downloads and extracts each article's readable
   body. Uses [`trafilatura`](https://trafilatura.readthedocs.io/) when installed
   (as in CI) and otherwise a dependency-free stdlib fallback. A gitignored
   URL→text cache (`pipeline/.cache/`) avoids re-downloading between local runs.
3. **Classification — `classify.py`.** Whole-word, accent-aware keyword matching
   sets two flags and records the evidence:
   - `omits_climate` — no climate term found (e.g. *climate change*, *réchauffement
     climatique*, *cambio climático*, *Klimawandel*, *cambiamento climatico*).
   - `omits_political` — no government/policy-accountability term found.
4. **Build — `build.py`.** Writes `docs/data/articles.json` (one record per
   article, excerpt only) and `docs/data/meta.json` (counts + `last_updated`).

## Run it locally

No dependencies are strictly required — the pipeline runs on stock Python 3.

```bash
# quick sample (one language, one topic)
python3 -m pipeline.build --languages en --topics wildfire --limit 20 --timespan 1w

# full run
python3 -m pipeline.build            # all 5 languages, all topics, last 3 months

# preview the dashboard
cd docs && python3 -m http.server    # → http://localhost:8000
```

For higher-quality extraction locally, `pip install -r requirements.txt` first.

### Useful flags
| flag | meaning |
|---|---|
| `--languages en,fr` | subset of `en,fr,es,de,it` |
| `--topics wildfire` | subset of `heatwave,excess_deaths,wildfire` |
| `--limit N` | cap articles processed (dev only) |
| `--timespan 3m` | GDELT window (`3m`, `1w`, `7d`, …) |
| `--pause 7` | seconds between GDELT calls (raise if you hit 429s) |
| `--no-extract` | classify on titles only (fast, low-confidence) |

## Tuning the keyword lists

Each language has one file under `pipeline/keywords/` (e.g. `fr.json`) with four
lists: `topics`, `climate`, `political`. Add or refine terms there — the query,
classification, and evidence all read from these files. After editing, re-run the
pipeline and spot-check a handful of flagged articles against the source.

## Deploy on GitHub

1. Create the repo and push this code.
2. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main`, Folder:
   `/docs`. Save.
3. **Settings → Actions → General →** Workflow permissions: *Read and write*.
4. Run the workflow once: **Actions → “Update dashboard data” → Run workflow**.
   It fetches, classifies, and commits `docs/data/*.json`; the commit redeploys
   Pages. After that it runs automatically every day.

## Limitations (read before drawing conclusions)

- **Keyword rules are blunt.** "Omits" means *none of the listed terms appeared* —
  it can miss synonyms, paraphrase, or implicit framing, and the
  accountability dimension is especially approximate. The evidence panel exists so
  you can check each call; treat aggregates as indicative, not authoritative.
- **Paywalls / fetch failures** leave an article without full text; these are
  marked **low-confidence** and classified from the headline only.
- **Rolling window.** GDELT serves roughly the last three months, so this is a
  live snapshot, not a historical archive.
- **Publisher ≠ event location.** `source_country` is where the outlet is based,
  not where the heat wave or fire happened.
- **Upgrade path.** The classifier is deliberately isolated in `classify.py`; it
  can be swapped for an LLM-based classifier later without touching fetch, build,
  or the frontend.
