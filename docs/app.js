"use strict";

const state = { articles: [], meta: null };
const $ = (id) => document.getElementById(id);

const TOPIC_LABELS = {
  heatwave: "Heat wave",
  excess_deaths: "Excess deaths",
  wildfire: "Wildfire",
};
const topicLabel = (t) => TOPIC_LABELS[t] || t;

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

function parseSeen(s) {
  // GDELT format: YYYYMMDDTHHMMSSZ
  if (!s || s.length < 8) return null;
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return iso;
}

/* ---------- theme ---------- */
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  $("themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const isDark = cur ? cur === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
}

/* ---------- render: tiles ---------- */
function renderTiles() {
  const m = state.meta;
  const total = m.total_articles;
  const tiles = [
    { value: total.toLocaleString(), label: "Articles tracked",
      sub: `${(m.languages || []).length} languages · rolling ${m.timespan}` },
    { value: `${pct(m.total_omits_climate, total)}%`, label: "Omit climate change",
      sub: `${m.total_omits_climate.toLocaleString()} of ${total.toLocaleString()} articles` },
    { value: `${pct(m.total_omits_political, total)}%`, label: "Omit gov / policy accountability",
      sub: `${m.total_omits_political.toLocaleString()} articles` },
    { value: (m.top_sources[0] ? m.top_sources[0].domain : "—"), label: "Top climate-silent source",
      sub: m.top_sources[0] ? `${m.top_sources[0].omits_climate} climate-silent articles` : "" },
  ];
  $("tiles").innerHTML = tiles.map((t) => `
    <div class="tile">
      <div class="value">${esc(t.value)}</div>
      <div class="label">${esc(t.label)}</div>
      <div class="sub">${esc(t.sub)}</div>
    </div>`).join("");
}

/* ---------- render: chart ---------- */
function renderChart() {
  const byLang = state.meta.by_language;
  const langs = Object.keys(byLang).sort((a, b) => byLang[b].total - byLang[a].total);
  const rows = langs.map((lang) => {
    const d = byLang[lang];
    const cp = pct(d.omits_climate, d.total);
    const pp = pct(d.omits_political, d.total);
    return { lang, d, cp, pp };
  });

  $("bars").innerHTML = rows.map(({ lang, d, cp, pp }) => `
    <div class="barrow">
      <div class="name">${esc(lang)} <span style="color:var(--muted)">(${d.total})</span></div>
      <div class="bargroup">
        ${barHtml("climate", cp, d.omits_climate)}
        ${barHtml("political", pp, d.omits_political)}
      </div>
    </div>`).join("");

  // accessible data table
  $("tableWrap").innerHTML = `
    <table class="data">
      <thead><tr><th>Language</th><th>Articles</th><th>Omit climate</th><th>Omit accountability</th></tr></thead>
      <tbody>${rows.map(({ lang, d, cp, pp }) => `
        <tr><td>${esc(lang)}</td><td>${d.total}</td>
        <td>${d.omits_climate} (${cp}%)</td><td>${d.omits_political} (${pp}%)</td></tr>`).join("")}
      </tbody>
    </table>`;
}

function barHtml(kind, percent, count) {
  const inside = percent >= 18;
  const label = `${count} · ${percent}%`;
  return `
    <div class="bartrack">
      <div class="bar ${kind}" style="width:${percent}%;--w:${percent}%"
           role="img" aria-label="${esc(label)} ${kind === "climate" ? "omit climate" : "omit accountability"}">
        ${inside ? `<span class="blabel">${esc(label)}</span>` : ""}
      </div>
      ${inside ? "" : `<span class="blabel outside" style="--w:${percent}%">${esc(label)}</span>`}
    </div>`;
}

/* ---------- filters ---------- */
function populateFilters() {
  const langs = [...new Set(state.articles.map((a) => a.language))].sort();
  const topics = [...new Set(state.articles.flatMap((a) => a.topics || [a.topic]))].sort();
  const sources = [...new Set(state.articles.map((a) => a.domain).filter(Boolean))].sort();
  fill($("fLang"), langs);
  fill($("fTopic"), topics, topicLabel);
  fill($("fSource"), sources);
}
function fill(sel, values, labelFn) {
  const first = sel.querySelector("option");
  sel.innerHTML = "";
  sel.appendChild(first);
  for (const v of values) {
    const o = document.createElement("option");
    o.value = v; o.textContent = labelFn ? labelFn(v) : v;
    sel.appendChild(o);
  }
}

function currentFilters() {
  return {
    q: $("q").value.trim().toLowerCase(),
    lang: $("fLang").value,
    topic: $("fTopic").value,
    source: $("fSource").value,
    flag: $("fFlag").value,
    sort: $("sort").value,
  };
}

function applyFilters() {
  const f = currentFilters();
  let list = state.articles.filter((a) => {
    if (f.lang && a.language !== f.lang) return false;
    if (f.topic && !(a.topics || [a.topic]).includes(f.topic)) return false;
    if (f.source && a.domain !== f.source) return false;
    if (f.flag === "omits_climate" && !a.omits_climate) return false;
    if (f.flag === "omits_political" && !a.omits_political) return false;
    if (f.flag === "omits_both" && !(a.omits_climate && a.omits_political)) return false;
    if (f.flag === "mentions_both" && !(a.mentions_climate && a.mentions_political_responsibility)) return false;
    if (f.q) {
      const hay = (a.title + " " + (a.evidence && a.evidence.excerpt || "")).toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
  if (f.sort === "source") {
    list.sort((a, b) => (a.domain || "").localeCompare(b.domain || "") ||
      (b.seendate || "").localeCompare(a.seendate || ""));
  } else {
    list.sort((a, b) => (b.seendate || "").localeCompare(a.seendate || ""));
  }
  renderArticles(list);
}

/* ---------- render: articles ---------- */
function renderArticles(list) {
  $("countLine").textContent =
    `${list.length.toLocaleString()} of ${state.articles.length.toLocaleString()} articles shown`;
  if (!list.length) {
    $("articles").innerHTML = `<div class="empty">No articles match these filters.</div>`;
    return;
  }
  $("articles").innerHTML = list.map(articleHtml).join("");
}

function articleHtml(a) {
  const date = parseSeen(a.seendate) || "";
  const ev = a.evidence || {};
  const badges = [];
  if (a.omits_climate) badges.push(`<span class="badge omit-climate">⚠ omits climate</span>`);
  if (a.omits_political) badges.push(`<span class="badge omit-political">⚠ omits accountability</span>`);
  if (a.low_confidence) badges.push(`<span class="badge lowconf">low-confidence (no full text)</span>`);
  badges.push(`<span class="badge lang">${esc(a.language)}</span>`);
  for (const t of (a.topics || [a.topic])) badges.push(`<span class="badge topic">${esc(topicLabel(t))}</span>`);

  return `
  <article class="article">
    <h3><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title || a.url)}</a></h3>
    <div class="meta">
      <span>${esc(a.domain || "")}</span>
      ${a.source_country ? `<span class="dot">·</span><span>${esc(a.source_country)}</span>` : ""}
      ${date ? `<span class="dot">·</span><span>${esc(date)}</span>` : ""}
    </div>
    <div class="badges">${badges.join("")}</div>
    <details class="why">
      <summary>Why flagged</summary>
      <div class="evidence">
        ${ev.excerpt ? `<div class="excerpt">“${esc(ev.excerpt)}”</div>` : ""}
        <div class="terms">${termsLine("Topic terms", ev.topic_terms)}</div>
        <div class="terms">${evLine("Climate terms", ev.climate_terms, a.omits_climate)}</div>
        <div class="terms">${evLine("Accountability terms", ev.political_terms, a.omits_political)}</div>
      </div>
    </details>
  </article>`;
}

function termsLine(label, terms) {
  if (!terms || !terms.length) return `<b>${esc(label)}:</b> —`;
  return `<b>${esc(label)}:</b> ${terms.map((t) => esc(t)).join(", ")}`;
}
function evLine(label, terms, omitted) {
  if (terms && terms.length) return `<b>${esc(label)} found:</b> ${terms.map(esc).join(", ")}`;
  return `<b>${esc(label)}:</b> <span class="absent">none found → flagged as omission</span>`;
}

/* ---------- boot ---------- */
async function boot() {
  initTheme();
  $("tableToggle").addEventListener("click", () => {
    const w = $("tableWrap");
    w.hidden = !w.hidden;
    $("tableToggle").textContent = w.hidden ? "Show data table" : "Hide data table";
  });
  ["q", "fLang", "fTopic", "fSource", "fFlag", "sort"].forEach((id) =>
    $(id).addEventListener("input", applyFilters));

  try {
    const [articles, meta] = await Promise.all([
      fetch("data/articles.json").then((r) => r.json()),
      fetch("data/meta.json").then((r) => r.json()),
    ]);
    state.articles = articles;
    state.meta = meta;
  } catch (e) {
    $("updated").textContent = "Could not load data. Run the pipeline to generate docs/data/*.json.";
    return;
  }

  $("updated").textContent = state.meta.last_updated
    ? `Last updated ${state.meta.last_updated.replace("T", " ").replace("Z", " UTC")}`
    : "";
  renderTiles();
  renderChart();
  populateFilters();
  applyFilters();
}

boot();
