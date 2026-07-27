"use strict";
/* Thin i18n loader. ALL editable strings & reference tables live in
   strings.json (edit that file, not this one). Call loadI18n() once before
   rendering; it populates the tables below.

   Content (article) language is separate from UI language: the UI can be in
   Portuguese while you filter to French articles. */

let LOCALES = ["en"];
let LOCALE_NAMES = {};
let CONTENT_LANG = {};
let TOPICS_I18N = {};
let STR = { en: {} };
let CONTEXT_SOURCES = {};
let KEYSTATS = [];
let WARMING = { hero_c: 0, hero_year: "", span: 1, series: [], sources: [] };
let CURRENT = "en";

async function loadI18n(url) {
  const src = (url || "strings.json") + "?v=" + Date.now();
  const d = await fetch(src, { cache: "no-store" }).then((r) => r.json());
  LOCALES = d.locales || LOCALES;
  LOCALE_NAMES = d.locale_names || {};
  CONTENT_LANG = d.content_lang || {};
  TOPICS_I18N = d.topics || {};
  STR = d.ui || { en: {} };
  CONTEXT_SOURCES = d.context_sources || {};
  KEYSTATS = d.keystats || [];
  WARMING = d.warming || WARMING;
  CURRENT = detectLocale();
  return d;
}

function detectLocale() {
  const saved = localStorage.getItem("uilang");
  if (saved && LOCALES.includes(saved)) return saved;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return LOCALES.includes(nav) ? nav : (LOCALES[0] || "en");
}
function getLocale() { return CURRENT; }
function setLocale(loc) {
  if (LOCALES.includes(loc)) { CURRENT = loc; localStorage.setItem("uilang", loc); }
}
function t(key, params) {
  const table = STR[CURRENT] || STR.en || {};
  let s = (key in table) ? table[key]
    : (STR.en && STR.en[key] != null ? STR.en[key] : key);
  if (params) for (const k in params) s = s.split("{" + k + "}").join(params[k]);
  return s;
}
function tContentLang(name) {
  const row = CONTENT_LANG[name];
  return row ? (row[CURRENT] || row.en || name) : name;
}
function tTopic(topic) {
  const row = TOPICS_I18N[topic];
  return row ? (row[CURRENT] || row.en || topic) : topic;
}
