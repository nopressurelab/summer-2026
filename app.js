"use strict";

const state = { articles: [], meta: null, filtered: [], page: 1, pageSize: 25 };
const PAGE_SIZES = [10, 25, 50];
const REPO = "nopressurelab/summer-2026";

function issueUrl(a) {
  const title = `[off-topic] ${a.title || a.url}`.slice(0, 120);
  const body = [
    "This article looks unrelated to the topic(s) it was tagged with.",
    "", `- Article: ${a.title || ""}`, `- URL: ${a.url}`,
    `- Language: ${a.language}`,
    `- Tagged topic(s): ${(a.topics || [a.topic]).join(", ")}`,
    `- Source: ${a.domain || ""}`, `- ID: ${a.id}`,
    "", "Why it's off-topic (optional):", "",
  ].join("\n");
  return `https://github.com/${REPO}/issues/new?labels=off-topic`
    + `&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }
function parseSeen(s) {
  if (!s || s.length < 8) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
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

/* ---------- i18n plumbing ---------- */
function initUiLang() {
  const sel = $("uiLang");
  sel.innerHTML = LOCALES.map((l) => `<option value="${l}">${esc(LOCALE_NAMES[l])}</option>`).join("");
  sel.value = getLocale();
  sel.addEventListener("change", () => { setLocale(sel.value); renderAll(); });
}

function applyStaticI18n() {
  document.documentElement.lang = getLocale();
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.innerHTML = t(el.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.getAttribute("data-i18n-ph")); });
  document.querySelectorAll("[data-i18n-opt]").forEach((el) => { el.textContent = t(el.getAttribute("data-i18n-opt")); });
  $("themeToggle").textContent = "◐ " + t("theme");
  $("tableToggle").textContent = t($("tableWrap").hidden ? "show_table" : "hide_table");
  $("uiLang").setAttribute("aria-label", t("ui_language"));
  fillPageSize();
}

/* ---------- tiles ---------- */
function renderTiles() {
  const m = state.meta, total = m.total_articles;
  const top = m.top_sources[0];
  const tiles = [
    { value: total.toLocaleString(), label: t("tile_tracked"),
      sub: (m.pruned === false && m.since)
        ? t("tile_tracked_sub_all", { langs: (m.languages || []).length, since: m.since })
        : t("tile_tracked_sub", { langs: (m.languages || []).length, days: m.window_days || 90 }) },
    { value: `${pct(m.total_omits_climate, total)}%`, label: t("tile_omit_climate"),
      sub: t("tile_omit_climate_sub", { n: m.total_omits_climate.toLocaleString(), t: total.toLocaleString() }) },
    { value: `${pct(m.total_omits_political, total)}%`, label: t("tile_omit_political"),
      sub: t("tile_omit_political_sub", { n: m.total_omits_political.toLocaleString() }) },
    { value: top ? top.domain : "—", label: t("tile_top_source"),
      sub: top ? t("tile_top_source_sub", { n: top.omits_climate }) : "" },
  ];
  $("tiles").innerHTML = tiles.map((x) => `
    <div class="tile">
      <div class="value">${esc(x.value)}</div>
      <div class="label">${esc(x.label)}</div>
      <div class="sub">${esc(x.sub)}</div>
    </div>`).join("");
}

/* ---------- chart ---------- */
function renderChart() {
  const byLang = state.meta.by_language;
  const langs = Object.keys(byLang).sort((a, b) => byLang[b].total - byLang[a].total);
  const rows = langs.map((lang) => {
    const d = byLang[lang];
    return { lang, d, cp: pct(d.omits_climate, d.total), pp: pct(d.omits_political, d.total) };
  });
  $("bars").innerHTML = rows.map(({ lang, d, cp, pp }) => `
    <div class="barrow">
      <div class="name">${esc(tContentLang(lang))} <span style="color:var(--muted)">(${d.total})</span></div>
      <div class="bargroup">
        ${barHtml("climate", cp, d.omits_climate)}
        ${barHtml("political", pp, d.omits_political)}
      </div>
    </div>`).join("");

  $("tableWrap").innerHTML = `
    <table class="data">
      <thead><tr><th>${esc(t("th_language"))}</th><th>${esc(t("th_articles"))}</th>
      <th>${esc(t("th_omit_climate"))}</th><th>${esc(t("th_omit_political"))}</th></tr></thead>
      <tbody>${rows.map(({ lang, d, cp, pp }) => `
        <tr><td>${esc(tContentLang(lang))}</td><td>${d.total}</td>
        <td>${d.omits_climate} (${cp}%)</td><td>${d.omits_political} (${pp}%)</td></tr>`).join("")}
      </tbody>
    </table>`;
}
function barHtml(kind, percent, count) {
  const inside = percent >= 18;
  const label = `${count} · ${percent}%`;
  return `
    <div class="bartrack">
      <div class="bar ${kind}" style="width:${percent}%;--w:${percent}%" role="img" aria-label="${esc(label)}">
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
  fillSel($("fLang"), langs, "all_languages", tContentLang);
  fillSel($("fTopic"), topics, "all_topics", tTopic);
  fillSel($("fSource"), sources, "all_sources", (x) => x);
}
function fillSel(sel, values, allKey, labelFn) {
  const cur = sel.value;
  sel.innerHTML = "";
  const o0 = document.createElement("option");
  o0.value = ""; o0.textContent = t(allKey);
  sel.appendChild(o0);
  for (const v of values) {
    const o = document.createElement("option");
    o.value = v; o.textContent = labelFn(v);
    sel.appendChild(o);
  }
  sel.value = cur;
}

function applyFilters() {
  const f = {
    q: $("q").value.trim().toLowerCase(),
    lang: $("fLang").value, topic: $("fTopic").value, source: $("fSource").value,
    flag: $("fFlag").value, sort: $("sort").value,
  };
  let list = state.articles.filter((a) => {
    if (f.lang && a.language !== f.lang) return false;
    if (f.topic && !(a.topics || [a.topic]).includes(f.topic)) return false;
    if (f.source && a.domain !== f.source) return false;
    if (f.flag === "omits_climate" && !a.omits_climate) return false;
    if (f.flag === "omits_political" && !a.omits_political) return false;
    if (f.flag === "omits_both" && !(a.omits_climate && a.omits_political)) return false;
    if (f.flag === "mentions_both" && !(a.mentions_climate && a.mentions_political_responsibility)) return false;
    if (f.q) {
      const hay = (a.title + " " + ((a.evidence && a.evidence.excerpt) || "")).toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  });
  if (f.sort === "source") {
    list.sort((a, b) => (a.domain || "").localeCompare(b.domain || "") || (b.seendate || "").localeCompare(a.seendate || ""));
  } else {
    list.sort((a, b) => (b.seendate || "").localeCompare(a.seendate || ""));
  }
  state.filtered = list;
  state.page = 1;            // new filter/sort resets to the first page
  renderPage();
}

/* ---------- articles + pagination ---------- */
function fillPageSize() {
  const sel = $("pageSize");
  if (!sel) return;
  sel.innerHTML = PAGE_SIZES.map((n) => `<option value="${n}">${esc(t("per_page", { n }))}</option>`).join("");
  sel.value = String(state.pageSize);
}
function initPager() {
  const saved = parseInt(localStorage.getItem("pagesize"), 10);
  if (PAGE_SIZES.includes(saved)) state.pageSize = saved;
  fillPageSize();
  $("pageSize").addEventListener("change", (e) => {
    state.pageSize = parseInt(e.target.value, 10) || 25;
    localStorage.setItem("pagesize", state.pageSize);
    state.page = 1;
    renderPage();
  });
}
function renderPage() {
  const list = state.filtered;
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  state.page = Math.min(Math.max(1, state.page), pages);
  const start = (state.page - 1) * state.pageSize;
  const slice = list.slice(start, start + state.pageSize);

  $("countLine").textContent = t("count_line", {
    n: total.toLocaleString(), t: state.articles.length.toLocaleString(),
  });
  $("articles").innerHTML = slice.length
    ? slice.map(articleHtml).join("")
    : `<div class="empty">${esc(t("empty"))}</div>`;
  renderPager(pages);
}
function renderPager(pages) {
  const el = $("pager");
  if (pages <= 1) { el.innerHTML = ""; return; }
  el.innerHTML = `
    <button class="pg-btn" id="pgPrev" type="button"${state.page <= 1 ? " disabled" : ""}>‹ ${esc(t("pager_prev"))}</button>
    <span class="pg-info">${esc(t("pager_page", { p: state.page, n: pages }))}</span>
    <button class="pg-btn" id="pgNext" type="button"${state.page >= pages ? " disabled" : ""}>${esc(t("pager_next"))} ›</button>`;
  $("pgPrev").onclick = () => { if (state.page > 1) { state.page--; renderPage(); scrollToArticles(); } };
  $("pgNext").onclick = () => { if (state.page < pages) { state.page++; renderPage(); scrollToArticles(); } };
}
function scrollToArticles() {
  const y = $("articles").getBoundingClientRect().top + window.scrollY - 12;
  window.scrollTo({ top: y, behavior: "smooth" });
}

function articleHtml(a) {
  const date = parseSeen(a.seendate) || "";
  const ev = a.evidence || {};
  const badges = [];
  if (a.omits_climate) badges.push(`<span class="badge omit-climate">⚠ ${esc(t("badge_omit_climate"))}</span>`);
  if (a.omits_political) badges.push(`<span class="badge omit-political">⚠ ${esc(t("badge_omit_political"))}</span>`);
  if (a.low_confidence) badges.push(`<span class="badge lowconf">${esc(t("badge_lowconf"))}</span>`);
  badges.push(`<span class="badge lang">${esc(tContentLang(a.language))}</span>`);
  for (const tp of (a.topics || [a.topic])) badges.push(`<span class="badge topic">${esc(tTopic(tp))}</span>`);

  return `
  <article class="article">
    <h3><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title || a.url)}</a></h3>
    <div class="meta">
      <span>${esc(a.source_name || a.domain || "")}</span>
      ${a.source_country ? `<span class="dot">·</span><span>${esc(a.source_country)}</span>` : ""}
      ${date ? `<span class="dot">·</span><span>${esc(date)}</span>` : ""}
    </div>
    <div class="badges">${badges.join("")}</div>
    ${a.omits_climate ? `<a class="ctx-jump" href="#ctx-${esc(a.topic)}">${esc(t("ctx_link"))}</a>` : ""}
    <details class="why">
      <summary>${esc(t("why_flagged"))}</summary>
      <div class="evidence">
        ${ev.excerpt ? `<div class="excerpt">“${esc(ev.excerpt)}”</div>` : ""}
        <div class="terms"><b>${esc(t("ev_topic"))}:</b> ${termList(ev.topic_terms)}</div>
        <div class="terms">${evLine("climate", ev.climate_terms)}</div>
        <div class="terms">${evLine("political", ev.political_terms)}</div>
      </div>
    </details>
    <a class="report-issue" href="${issueUrl(a)}" target="_blank" rel="noopener noreferrer">⚑ ${esc(t("report_issue"))}</a>
  </article>`;
}
function termList(terms) {
  return terms && terms.length ? terms.map(esc).join(", ") : "—";
}
function evLine(which, terms) {
  const foundKey = which === "climate" ? "ev_climate_found" : "ev_political_found";
  const noneKey = which === "climate" ? "ev_climate" : "ev_political";
  if (terms && terms.length) return `<b>${esc(t(foundKey))}:</b> ${terms.map(esc).join(", ")}`;
  return `<b>${esc(t(noneKey))}:</b> <span class="absent">${esc(t("ev_none"))}</span>`;
}

/* ---------- warming stripes + "what average means" ---------- */
function _mix(c1, c2, t) {
  const l = (a, b) => Math.round(a + (b - a) * t);
  const h = (n) => n.toString(16).padStart(2, "0");
  return `#${h(l(c1[0], c2[0]))}${h(l(c1[1], c2[1]))}${h(l(c1[2], c2[2]))}`;
}
function divergeColor(tn) {
  const blue = [42, 120, 214], mid = [233, 230, 223], red = [208, 59, 59];
  return tn < 0.5 ? _mix(blue, mid, tn * 2) : _mix(mid, red, (tn - 0.5) * 2);
}
function stripesHtml(series, keyY, keyA, span) {
  const vals = series.map((d) => d[keyA]);
  const min = Math.min(...vals), max = Math.max(...vals);
  return series.map((d) => {
    const tn = (d[keyA] - min) / ((max - min) || 1);
    const range = span > 1 ? `${d[keyY]}–${d[keyY] + span - 1}` : `${d[keyY]}`;
    const sign = d[keyA] >= 0 ? "+" : "";
    return `<span class="stripe" style="background:${divergeColor(tn)}" title="${range}: ${sign}${d[keyA].toFixed(2)}°C"></span>`;
  }).join("");
}
function renderWarming() {
  const s = state.warming || WARMING;   // live data/warming.json wins
  const span = s.span || 1;
  const first = s.series[0].y;
  const lastd = s.series[s.series.length - 1];
  const y1 = span > 1 ? lastd.y + span - 1 : lastd.y;
  const lastLabel = span > 1 ? `${lastd.y}–${y1}` : `${lastd.y}`;
  const srcs = (s.sources || []).map((x) =>
    `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a>`).join(" · ");
  $("ctxWarming").innerHTML = `
    <div class="warming">
      <div class="warming-hero">
        <div class="warming-num">+${s.hero_c}<span class="warming-unit">°C</span></div>
        <div class="warming-sub">${esc(t("warming_hero_sub", { year: s.hero_year || "" }))}</div>
      </div>
      <div class="warming-body">
        <h3>${esc(t("warming_title"))}</h3>
        <p>${esc(t("warming_lead", { c: s.hero_c }))}</p>
        <div class="stripes" role="img" aria-label="${esc(t("warming_title"))}">${stripesHtml(s.series, "y", "a", span)}</div>
        <div class="stripe-labels"><span>${first}</span><span>${lastLabel}</span></div>
        <div class="warming-cap">${esc(t("warming_caption", { y0: first, y1: y1 }))} · ${esc(t("ctx_sources"))}: ${srcs}</div>
        <div class="avg-note">
          <strong>${esc(t("warming_avg_title"))}</strong>
          <span>${esc(t("warming_avg"))}</span>
        </div>
      </div>
    </div>`;
}

/* ---------- what drives climate change (fossil carbon, not natural cycles) ---------- */
function renderCause() {
  const srcs = (CONTEXT_SOURCES.cause || []).map((x) =>
    `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a>`).join(" · ");
  $("ctxCause").innerHTML = `
    <div class="cause">
      <div class="cause-stat"><div class="cause-num">+50%</div><div class="cause-sub">CO₂</div></div>
      <div class="cause-body">
        <h3>${esc(t("cause_title"))}</h3>
        <p>${esc(t("cause_body"))}</p>
        <div class="warming-cap">${esc(t("cause_co2_label"))} · ${esc(t("ctx_sources"))}: ${srcs}</div>
      </div>
    </div>`;
}

/* ---------- local "how has it changed where you live?" lookup ---------- */
function renderLocal() {
  const saved = state.localCity || localStorage.getItem("localcity") || "";
  $("ctxLocal").innerHTML = `
    <div class="local-box">
      <label class="local-q" for="cityInput">${esc(t("local_title"))}</label>
      <div class="local-input">
        <input type="text" id="cityInput" placeholder="${esc(t("local_prompt"))}" value="${esc(saved)}">
        <button id="cityBtn" type="button">${esc(t("local_button"))}</button>
      </div>
      <div id="localResult"></div>
    </div>`;
  $("cityBtn").addEventListener("click", runLocal);
  $("cityInput").addEventListener("keydown", (e) => { if (e.key === "Enter") runLocal(); });
  if (state.localResult) renderLocalResult(state.localResult);
}
async function runLocal() {
  const q = $("cityInput").value.trim();
  if (!q) return;
  const box = $("localResult");
  box.innerHTML = `<div class="local-loading">${esc(t("local_loading"))}</div>`;
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=${getLocale()}`).then((r) => r.json());
    if (!geo.results || !geo.results.length) {
      box.innerHTML = `<div class="local-err">${esc(t("local_notfound"))}</div>`; return;
    }
    const g = geo.results[0];
    const lastYear = new Date().getUTCFullYear() - 1;
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${g.latitude}&longitude=${g.longitude}&start_date=1960-01-01&end_date=${lastYear}-12-31&daily=temperature_2m_mean&timezone=auto`;
    const arch = await fetch(url).then((r) => r.json());
    const res = computeLocal(g, arch);
    if (!res) { box.innerHTML = `<div class="local-err">${esc(t("local_error"))}</div>`; return; }
    state.localCity = q; state.localResult = res; localStorage.setItem("localcity", q);
    renderLocalResult(res);
  } catch (e) {
    box.innerHTML = `<div class="local-err">${esc(t("local_error"))}</div>`;
  }
}
function _mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
function computeLocal(g, arch) {
  const times = arch && arch.daily && arch.daily.time;
  const temps = arch && arch.daily && arch.daily.temperature_2m_mean;
  if (!times || !temps) return null;
  const byYear = {};
  for (let i = 0; i < times.length; i++) {
    const v = temps[i]; if (v == null) continue;
    const y = +times[i].slice(0, 4);
    (byYear[y] = byYear[y] || []).push(v);
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
  const annual = years.map((y) => ({ y, m: _mean(byYear[y]) }));
  if (annual.length < 20) return null;
  const base = _mean(annual.slice(0, Math.min(30, Math.floor(annual.length / 2))).map((d) => d.m));
  const recent = _mean(annual.slice(-10).map((d) => d.m));
  const anoms = annual.map((d) => ({ y: d.y, a: d.m - base }));
  const name = [g.name, g.admin1, g.country].filter(Boolean).join(", ");
  return { name, y0: annual[0].y, y1: annual[annual.length - 1].y,
    delta: Math.round((recent - base) * 10) / 10, anoms };
}
function renderLocalResult(res) {
  const d = (res.delta >= 0 ? "+" : "") + res.delta.toFixed(1);
  $("localResult").innerHTML = `
    <div class="local-head">${esc(t("local_result", { city: res.name, d: d, y0: res.y0 }))}</div>
    <div class="stripes" role="img" aria-label="${esc(res.name)}">${stripesHtml(res.anoms, "y", "a", 1)}</div>
    <div class="stripe-labels"><span>${res.y0}</span><span>${res.y1}</span></div>
    <div class="warming-cap">${esc(t("local_caption", { y0: res.y0, y1: res.y1 }))} · ${esc(t("ctx_sources"))}: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo (ERA5)</a></div>`;
}
function renderStats() {
  $("ctxStats").innerHTML = KEYSTATS.map((st) => {
    const srcs = st.sources.map((x) =>
      `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a>`).join(" · ");
    return `<div class="stat-card">
      <div class="stat-value">${esc(st.value)}</div>
      <div class="stat-label">${esc(t(st.labelKey))}</div>
      <div class="ctx-src">${esc(t("ctx_sources"))}: ${srcs}</div>
    </div>`;
  }).join("");
}

/* ---------- climate-context module ---------- */
function renderContext() {
  renderWarming();
  renderCause();
  renderLocal();
  renderStats();
  const topics = ["heatwave", "excess_deaths", "wildfire", "floods"];
  $("ctxGrid").innerHTML = topics.map((tp) => {
    const srcs = (CONTEXT_SOURCES[tp] || []).map((s) =>
      `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join(" · ");
    return `<div class="ctx-item" id="ctx-${tp}">
      <h3>${esc(tTopic(tp))}</h3>
      <p>${esc(t("ctx_" + tp))}</p>
      <div class="ctx-src">${esc(t("ctx_sources"))}: ${srcs}</div>
    </div>`;
  }).join("");
}

/* ---------- omission trend over time ---------- */
function weekStartISO(seen) {
  const d = new Date(Date.UTC(+seen.slice(0, 4), +seen.slice(4, 6) - 1, +seen.slice(6, 8)));
  const monOffset = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - monOffset);
  return d.toISOString().slice(0, 10);
}
function renderTrend() {
  const buckets = {};
  for (const a of state.articles) {
    const s = a.seendate || "";
    if (s.length < 8) continue;
    const k = weekStartISO(s);
    const b = buckets[k] || (buckets[k] = { total: 0, oc: 0, op: 0 });
    b.total += 1; b.oc += a.omits_climate ? 1 : 0; b.op += a.omits_political ? 1 : 0;
  }
  const keys = Object.keys(buckets).sort();
  const el = $("trend");
  if (keys.length < 2) { el.innerHTML = `<div class="empty">${esc(t("trend_nodata"))}</div>`; return; }
  const pts = keys.map((k) => ({
    k, cp: pct(buckets[k].oc, buckets[k].total),
    pp: pct(buckets[k].op, buckets[k].total), n: buckets[k].total,
  }));
  el.innerHTML = trendSvg(pts);
}
function trendSvg(pts) {
  const W = 720, H = 210, L = 34, R = 12, T = 10, B = 30;
  const pw = W - L - R, ph = H - T - B;
  const x = (i) => L + (pts.length === 1 ? pw / 2 : (i / (pts.length - 1)) * pw);
  const y = (v) => T + ((100 - v) / 100) * ph;
  const grid = [0, 25, 50, 75, 100].map((v) =>
    `<line x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}" stroke="var(--grid)" stroke-width="1"/>
     <text x="${L - 6}" y="${y(v) + 3}" text-anchor="end" font-size="10" fill="var(--muted)">${v}%</text>`).join("");
  const line = (key, color) => {
    const d = pts.map((p, i) => `${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
    const dots = pts.map((p, i) => {
      const dt = new Date(p.k).toLocaleDateString(getLocale(), { day: "numeric", month: "short" });
      const which = key === "cp" ? t("legend_climate") : t("legend_political");
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(p[key]).toFixed(1)}" r="3.5" fill="${color}"><title>${esc(dt)} — ${p[key]}% ${esc(which)} (n=${p.n})</title></circle>`;
    }).join("");
    return `<polyline points="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>${dots}`;
  };
  const nlab = Math.min(pts.length, 6);
  const xlabels = pts.map((p, i) => {
    const step = Math.max(1, Math.round((pts.length - 1) / (nlab - 1 || 1)));
    if (i % step !== 0 && i !== pts.length - 1) return "";
    const dt = new Date(p.k).toLocaleDateString(getLocale(), { day: "numeric", month: "short" });
    return `<text x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--muted)">${esc(dt)}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(t("trend_title"))}">
    ${grid}${line("cp", "var(--series-climate)")}${line("pp", "var(--series-political)")}${xlabels}
  </svg>`;
}

/* ---------- render orchestration ---------- */
function renderAll() {
  applyStaticI18n();
  if (!state.meta) return;
  const u = state.meta.last_updated;
  $("updated").textContent = u
    ? t("last_updated", { date: u.replace("T", " ").replace("Z", " UTC") }) : "";
  renderTiles();
  renderContext();
  renderChart();
  renderTrend();
  populateFilters();
  applyFilters();
}

/* ---------- boot ---------- */
async function boot() {
  try { await loadI18n(); } catch (e) { /* fall back to built-in defaults */ }
  initTheme();
  initUiLang();
  initPager();
  applyStaticI18n();
  $("updated").textContent = t("loading");

  $("tableToggle").addEventListener("click", () => {
    const w = $("tableWrap");
    w.hidden = !w.hidden;
    $("tableToggle").textContent = t(w.hidden ? "show_table" : "hide_table");
  });
  ["q", "fLang", "fTopic", "fSource", "fFlag", "sort"].forEach((id) =>
    $(id).addEventListener("input", applyFilters));

  const bust = "?v=" + Date.now();
  try {
    const [articles, meta] = await Promise.all([
      fetch("data/articles.json" + bust, { cache: "no-store" }).then((r) => r.json()),
      fetch("data/meta.json" + bust, { cache: "no-store" }).then((r) => r.json()),
    ]);
    state.articles = articles;
    state.meta = meta;
  } catch (e) {
    $("updated").textContent = "Could not load data. Run the pipeline to generate data/*.json.";
    return;
  }
  // Live global-warming series (optional; falls back to the table in strings.json).
  state.warming = await fetch("data/warming.json" + bust, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);
  renderAll();
}

boot();
