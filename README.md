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
GitHub Action (daily)                                 GitHub Pages (static)
────────────────────                                  ─────────────────────
fetch_rss.py  RSS feeds (forward)  ┐
fetch.py      GDELT (backfill)     ├─ extract.py ─► classify.py ─► build.py
                                   │   full text     keyword flags   merge+prune
                                   ┘                                     │
                                                       docs/data/articles.json ─► index.html
                                                       docs/data/meta.json         app.js
                                                       (committed by the Action)   (client-side search)
```

Data flows one direction. The browser only ever reads the pre-built JSON and does
all search/filtering client-side — no live API calls from the page.

### Two discovery sources, one accumulated dataset

- **RSS (forward)** — `fetch_rss.py` reads each source's own feeds (listed in
  `pipeline/sources/<lang>.json`), keeps items matching that language's topic
  keywords, and adds them. No central rate limit. A feed only shows *recent*
  items, so this grows coverage day by day.
- **GDELT backfill (backward)** — `fetch.py` walks GDELT one day at a time, from
  the oldest day in the window that hasn't been processed yet toward the present,
  restricted to the same source domains. Progress is stored in
  `docs/data/backfill_state.json`, and each run does a bounded number of days
  (GDELT rate-limits hard — exponential backoff on HTTP 429).

Both write through the same stages and **accumulate**: `build.py` merges fresh
results into `docs/data/articles.json` (dedupe by URL) and prunes anything older
than `--window-days` (default 90). Over time RSS fills forward while the backfill
fills the history backward.

### Shared stages
- **Full text — `extract.py`.** Downloads and extracts each article's readable
  body ([`trafilatura`](https://trafilatura.readthedocs.io/) in CI, stdlib
  fallback locally). A gitignored URL→text cache (`pipeline/.cache/`) avoids
  re-downloading between local runs.
- **Classification — `classify.py`.** Whole-word, accent-aware keyword matching
  over title + body + RSS summary sets two flags with evidence:
  `omits_climate` (no climate term — *climate change*, *réchauffement climatique*,
  *cambio climático*, *Klimawandel*, *cambiamento climatico*) and `omits_political`
  (no government/policy-accountability term).

## Run it locally

No dependencies are strictly required — the pipeline runs on stock Python 3.

```bash
# forward: ingest all source RSS feeds (fast, no rate limit)
python3 -m pipeline.build --source rss

# retroactive: backfill 5 more days of history from GDELT
python3 -m pipeline.build --source gdelt --backfill --backfill-days 5

# preview the dashboard
cd docs && python3 -m http.server    # → http://localhost:8000
```

For higher-quality extraction locally, `pip install -r requirements.txt` first.

### Useful flags
| flag | meaning |
|---|---|
| `--source rss\|gdelt` | discovery method (default `rss`) |
| `--backfill` | GDELT: process oldest unprocessed days first (stateful) |
| `--backfill-days N` | days to process per backfill run (default 5) |
| `--window-days N` | rolling window; older articles are pruned (default 90) |
| `--languages en,fr` | subset of `en,fr,es,de,it` |
| `--topics wildfire` | subset of `heatwave,excess_deaths,wildfire` |
| `--no-accumulate` | overwrite the dataset instead of merging |
| `--no-extract` | classify on titles/summaries only (fast, low-confidence) |
| `--no-sources` | GDELT: ignore the allowlist and sweep every outlet |
| `--pause S` | seconds between requests (raise for GDELT if you hit 429s) |

## Editing the sources and keyword lists

Two JSON knobs per language, both hot-reloaded on the next run:

- **`pipeline/sources/<lang>.json`** — the newspapers. Each entry is
  `{ "name", "domain", "feeds": [rss urls] }`. Add an outlet by appending an
  entry; add coverage to an existing one by adding feed URLs. `domain` doubles as
  the GDELT backfill allowlist, so a source with `feeds: []` still gets backfilled.
- **`pipeline/keywords/<lang>.json`** — the `topics`, `climate`, and `political`
  term lists that drive matching, flags, and evidence.

After editing, re-run and spot-check a few flagged articles against the source.

## Deploy on GitHub

1. Create the repo and push this code.
2. **Settings → Pages →** Source: *Deploy from a branch*, Branch: `main`, Folder:
   `/docs`. Save.
3. **Settings → Actions → General →** Workflow permissions: *Read and write*.
4. Run the workflow once: **Actions → “Update dashboard data” → Run workflow**.
   It ingests RSS, backfills a few days from GDELT, classifies, and commits
   `docs/data/*.json`; the commit redeploys Pages. After that it runs
   automatically **once a day** (`cron: "17 5 * * *"`, 05:17 UTC).

> **On GitHub's cron:** scheduled runs fire only from the **default branch**,
> timing is best-effort (can be delayed a few minutes), and GitHub disables the
> schedule after **60 days with no repo activity** — the daily data commit keeps
> it alive. The backfill catches history up over the first ~2–3 weeks (5 days per
> run by default; raise `backfill_days` via *Run workflow* to go faster).

## Limitations (read before drawing conclusions)

- **Keyword rules are blunt.** "Omits" means *none of the listed terms appeared* —
  it can miss synonyms, paraphrase, or implicit framing, and the
  accountability dimension is especially approximate. The evidence panel exists so
  you can check each call; treat aggregates as indicative, not authoritative.
- **Paywalls / fetch failures** leave an article without full text; these are
  marked **low-confidence** and classified from the headline + RSS summary only.
- **Rolling window.** The dataset keeps the last `--window-days` (90) and prunes
  older items; GDELT itself only serves ~3 months, which bounds how far the
  backfill can reach.
- **Publisher ≠ event location.** `source_country` is where the outlet is based,
  not where the heat wave or fire happened.
- **Upgrade path.** The classifier is deliberately isolated in `classify.py`; it
  can be swapped for an LLM-based classifier later without touching fetch, build,
  or the frontend.
