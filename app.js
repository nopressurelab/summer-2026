"use strict";

const state = { articles: [], meta: null };
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
}

/* ---------- tiles ---------- */
function renderTiles() {
  const m = state.meta, total = m.total_articles;
  const top = m.top_sources[0];
  const tiles = [
    { value: total.toLocaleString(), label: t("tile_tracked"),
      sub: t("tile_tracked_sub", { langs: (m.languages || []).length, days: m.window_days || 90 }) },
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
  renderArticles(list);
}

/* ---------- articles ---------- */
function renderArticles(list) {
  $("countLine").textContent = t("count_line", {
    n: list.length.toLocaleString(), t: state.articles.length.toLocaleString(),
  });
  $("articles").innerHTML = list.length
    ? list.map(articleHtml).join("")
    : `<div class="empty">${esc(t("empty"))}</div>`;
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

/* ---------- climate-context module ---------- */
function renderContext() {
  const topics = ["heatwave", "excess_deaths", "wildfire"];
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
  initTheme();
  initUiLang();
  applyStaticI18n();
  $("updated").textContent = t("loading");

  $("tableToggle").addEventListener("click", () => {
    const w = $("tableWrap");
    w.hidden = !w.hidden;
    $("tableToggle").textContent = t(w.hidden ? "show_table" : "hide_table");
  });
  ["q", "fLang", "fTopic", "fSource", "fFlag", "sort"].forEach((id) =>
    $(id).addEventListener("input", applyFilters));

  try {
    const bust = "?v=" + Date.now();
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
  renderAll();
}

boot();
