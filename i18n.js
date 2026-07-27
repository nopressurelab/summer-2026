"use strict";
/* Interface localization for EN, ES, FR, DE, IT, PT.
   Content (article) language is separate from UI language: the UI can be in
   Portuguese while you filter to French articles. */

const LOCALES = ["en", "es", "fr", "de", "it", "pt"];
const LOCALE_NAMES = {
  en: "English", es: "Español", fr: "Français",
  de: "Deutsch", it: "Italiano", pt: "Português",
};

/* Localized names of the *content* languages (stored as English names in data). */
const CONTENT_LANG = {
  English:    { en: "English", es: "Inglés",   fr: "Anglais",  de: "Englisch",   it: "Inglese",   pt: "Inglês" },
  French:     { en: "French",  es: "Francés",  fr: "Français", de: "Französisch",it: "Francese",  pt: "Francês" },
  Spanish:    { en: "Spanish", es: "Español",  fr: "Espagnol", de: "Spanisch",   it: "Spagnolo",  pt: "Espanhol" },
  German:     { en: "German",  es: "Alemán",   fr: "Allemand", de: "Deutsch",    it: "Tedesco",   pt: "Alemão" },
  Italian:    { en: "Italian", es: "Italiano", fr: "Italien",  de: "Italienisch",it: "Italiano",  pt: "Italiano" },
  Portuguese: { en: "Portuguese", es: "Portugués", fr: "Portugais", de: "Portugiesisch", it: "Portoghese", pt: "Português" },
};

const TOPICS_I18N = {
  heatwave:      { en: "Heat wave",     es: "Ola de calor",       fr: "Canicule",          de: "Hitzewelle",     it: "Ondata di calore",   pt: "Onda de calor" },
  excess_deaths: { en: "Excess deaths", es: "Exceso de muertes",  fr: "Surmortalité",      de: "Übersterblichkeit", it: "Eccesso di morti", pt: "Excesso de mortes" },
  wildfire:      { en: "Wildfire",      es: "Incendio forestal",  fr: "Incendie",          de: "Waldbrand",      it: "Incendio",           pt: "Incêndio florestal" },
};

const STR = {
  en: {
    tagline: "Coverage of <strong>heat waves</strong>, <strong>excess deaths</strong> and <strong>wildfires</strong> in major English, French, Spanish, German, Italian and Portuguese outlets — flagged when it omits <strong>climate change</strong> or any <strong>government / policy accountability</strong>.",
    about_link: "About &amp; method", theme: "Theme", ui_language: "Interface language",
    loading: "Loading…", last_updated: "Last updated {date}",
    disclaimer: "<strong>How flags work &amp; their limits.</strong> Flags come from transparent keyword rules over each article's own text, not editorial judgement. “Omits” means none of a curated list of climate or accountability terms was found — expand <em>“Why flagged”</em> on any card to see the exact evidence. Keyword matching is blunt and this is a rolling window, not a complete archive. <a href=\"about.html\">Read the full method &amp; limitations →</a>",
    tile_tracked: "Articles tracked", tile_tracked_sub: "{langs} languages · rolling {days} days",
    tile_omit_climate: "Omit climate change", tile_omit_climate_sub: "{n} of {t} articles",
    tile_omit_political: "Omit gov / policy accountability", tile_omit_political_sub: "{n} articles",
    tile_top_source: "Top climate-silent source", tile_top_source_sub: "{n} climate-silent articles",
    chart_title: "Omissions by language", chart_hint: "Share of matched articles in each language that omit each kind of context.",
    legend_climate: "Omits climate change", legend_political: "Omits gov / policy accountability",
    show_table: "Show data table", hide_table: "Hide data table",
    th_language: "Language", th_articles: "Articles", th_omit_climate: "Omit climate", th_omit_political: "Omit accountability",
    search_placeholder: "Search headlines and excerpts…",
    all_languages: "All languages", all_topics: "All topics", all_sources: "All sources",
    flag_any: "Any coverage", flag_omits_climate: "Omits climate", flag_omits_political: "Omits accountability",
    flag_omits_both: "Omits both", flag_mentions_both: "Mentions both",
    sort_date: "Newest first", sort_source: "By source",
    count_line: "{n} of {t} articles shown", empty: "No articles match these filters.",
    badge_omit_climate: "omits climate", badge_omit_political: "omits accountability",
    badge_lowconf: "low-confidence (no full text)", why_flagged: "Why flagged",
    ev_topic: "Topic terms", ev_climate_found: "Climate terms found", ev_climate: "Climate terms",
    ev_political_found: "Accountability terms found", ev_political: "Accountability terms",
    ev_none: "none found → flagged as omission",
    footer: "Data from each source's RSS feeds and the free GDELT DOC 2.0 API. Rebuilt automatically once a day. Open source.",
  },
  es: {
    tagline: "Cobertura de <strong>olas de calor</strong>, <strong>exceso de muertes</strong> e <strong>incendios forestales</strong> en grandes medios en inglés, francés, español, alemán, italiano y portugués, marcada cuando omite el <strong>cambio climático</strong> o cualquier <strong>responsabilidad política</strong>.",
    about_link: "Acerca de &amp; método", theme: "Tema", ui_language: "Idioma de la interfaz",
    loading: "Cargando…", last_updated: "Actualizado el {date}",
    disclaimer: "<strong>Cómo funcionan las etiquetas y sus límites.</strong> Las etiquetas provienen de reglas transparentes de palabras clave sobre el propio texto del artículo, no de un juicio editorial. “Omite” significa que no se encontró ningún término de una lista de clima o de responsabilidad — abre <em>“Por qué se marcó”</em> en cualquier ficha para ver la evidencia exacta. La coincidencia por palabras clave es tosca y esto es una ventana móvil, no un archivo completo. <a href=\"about.html\">Lee el método y las limitaciones →</a>",
    tile_tracked: "Artículos rastreados", tile_tracked_sub: "{langs} idiomas · últimos {days} días",
    tile_omit_climate: "Omiten el cambio climático", tile_omit_climate_sub: "{n} de {t} artículos",
    tile_omit_political: "Omiten responsabilidad política", tile_omit_political_sub: "{n} artículos",
    tile_top_source: "Medio que más lo silencia", tile_top_source_sub: "{n} artículos sin clima",
    chart_title: "Omisiones por idioma", chart_hint: "Proporción de artículos en cada idioma que omiten cada tipo de contexto.",
    legend_climate: "Omite el cambio climático", legend_political: "Omite responsabilidad política",
    show_table: "Mostrar tabla", hide_table: "Ocultar tabla",
    th_language: "Idioma", th_articles: "Artículos", th_omit_climate: "Omiten clima", th_omit_political: "Omiten responsab.",
    search_placeholder: "Buscar titulares y extractos…",
    all_languages: "Todos los idiomas", all_topics: "Todos los temas", all_sources: "Todas las fuentes",
    flag_any: "Cualquier cobertura", flag_omits_climate: "Omiten clima", flag_omits_political: "Omiten responsabilidad",
    flag_omits_both: "Omiten ambos", flag_mentions_both: "Mencionan ambos",
    sort_date: "Más recientes", sort_source: "Por fuente",
    count_line: "{n} de {t} artículos mostrados", empty: "Ningún artículo coincide con estos filtros.",
    badge_omit_climate: "omite clima", badge_omit_political: "omite responsabilidad",
    badge_lowconf: "baja confianza (sin texto completo)", why_flagged: "Por qué se marcó",
    ev_topic: "Términos del tema", ev_climate_found: "Términos de clima encontrados", ev_climate: "Términos de clima",
    ev_political_found: "Términos de responsabilidad encontrados", ev_political: "Términos de responsabilidad",
    ev_none: "ninguno encontrado → marcado como omisión",
    footer: "Datos de los RSS de cada fuente y de la API gratuita GDELT DOC 2.0. Reconstruido automáticamente una vez al día. Código abierto.",
  },
  fr: {
    tagline: "Couverture des <strong>canicules</strong>, de la <strong>surmortalité</strong> et des <strong>incendies</strong> dans les grands médias anglais, français, espagnols, allemands, italiens et portugais — signalée lorsqu'elle omet le <strong>changement climatique</strong> ou toute <strong>responsabilité politique</strong>.",
    about_link: "À propos &amp; méthode", theme: "Thème", ui_language: "Langue de l'interface",
    loading: "Chargement…", last_updated: "Mis à jour le {date}",
    disclaimer: "<strong>Fonctionnement des marqueurs et leurs limites.</strong> Les marqueurs proviennent de règles transparentes par mots-clés sur le texte même de l'article, pas d'un jugement éditorial. « Omet » signifie qu'aucun terme d'une liste climat ou responsabilité n'a été trouvé — ouvrez <em>« Pourquoi signalé »</em> sur une fiche pour voir les preuves exactes. La recherche par mots-clés est grossière et ceci est une fenêtre glissante, pas une archive complète. <a href=\"about.html\">Lire la méthode et les limites →</a>",
    tile_tracked: "Articles suivis", tile_tracked_sub: "{langs} langues · {days} derniers jours",
    tile_omit_climate: "Omettent le climat", tile_omit_climate_sub: "{n} sur {t} articles",
    tile_omit_political: "Omettent la responsabilité politique", tile_omit_political_sub: "{n} articles",
    tile_top_source: "Média qui l'occulte le plus", tile_top_source_sub: "{n} articles sans climat",
    chart_title: "Omissions par langue", chart_hint: "Part des articles de chaque langue qui omettent chaque type de contexte.",
    legend_climate: "Omet le changement climatique", legend_political: "Omet la responsabilité politique",
    show_table: "Afficher le tableau", hide_table: "Masquer le tableau",
    th_language: "Langue", th_articles: "Articles", th_omit_climate: "Omettent climat", th_omit_political: "Omettent respons.",
    search_placeholder: "Rechercher titres et extraits…",
    all_languages: "Toutes les langues", all_topics: "Tous les sujets", all_sources: "Toutes les sources",
    flag_any: "Toute couverture", flag_omits_climate: "Omet le climat", flag_omits_political: "Omet la responsabilité",
    flag_omits_both: "Omet les deux", flag_mentions_both: "Mentionne les deux",
    sort_date: "Plus récents", sort_source: "Par source",
    count_line: "{n} sur {t} articles affichés", empty: "Aucun article ne correspond à ces filtres.",
    badge_omit_climate: "omet le climat", badge_omit_political: "omet la responsabilité",
    badge_lowconf: "faible confiance (pas de texte intégral)", why_flagged: "Pourquoi signalé",
    ev_topic: "Termes du sujet", ev_climate_found: "Termes climat trouvés", ev_climate: "Termes climat",
    ev_political_found: "Termes de responsabilité trouvés", ev_political: "Termes de responsabilité",
    ev_none: "aucun trouvé → signalé comme omission",
    footer: "Données issues des flux RSS de chaque source et de l'API gratuite GDELT DOC 2.0. Reconstruit automatiquement une fois par jour. Open source.",
  },
  de: {
    tagline: "Berichterstattung über <strong>Hitzewellen</strong>, <strong>Übersterblichkeit</strong> und <strong>Waldbrände</strong> in großen englischen, französischen, spanischen, deutschen, italienischen und portugiesischen Medien — markiert, wenn sie den <strong>Klimawandel</strong> oder jede <strong>politische Verantwortung</strong> auslässt.",
    about_link: "Über &amp; Methode", theme: "Design", ui_language: "Sprache der Oberfläche",
    loading: "Wird geladen…", last_updated: "Aktualisiert am {date}",
    disclaimer: "<strong>Wie die Markierungen funktionieren und ihre Grenzen.</strong> Die Markierungen stammen aus transparenten Schlagwortregeln über den Artikeltext selbst, nicht aus einem redaktionellen Urteil. „Lässt aus“ bedeutet, dass kein Begriff aus einer Klima- oder Verantwortungsliste gefunden wurde — öffnen Sie <em>„Warum markiert“</em> auf einer Karte, um die genauen Belege zu sehen. Der Schlagwortabgleich ist grob und dies ist ein gleitendes Fenster, kein vollständiges Archiv. <a href=\"about.html\">Methode und Grenzen lesen →</a>",
    tile_tracked: "Erfasste Artikel", tile_tracked_sub: "{langs} Sprachen · letzte {days} Tage",
    tile_omit_climate: "Lassen Klimawandel aus", tile_omit_climate_sub: "{n} von {t} Artikeln",
    tile_omit_political: "Lassen politische Verantwortung aus", tile_omit_political_sub: "{n} Artikel",
    tile_top_source: "Quelle mit dem meisten Klima-Schweigen", tile_top_source_sub: "{n} Artikel ohne Klima",
    chart_title: "Auslassungen nach Sprache", chart_hint: "Anteil der Artikel je Sprache, die den jeweiligen Kontext auslassen.",
    legend_climate: "Lässt Klimawandel aus", legend_political: "Lässt politische Verantwortung aus",
    show_table: "Tabelle anzeigen", hide_table: "Tabelle ausblenden",
    th_language: "Sprache", th_articles: "Artikel", th_omit_climate: "Ohne Klima", th_omit_political: "Ohne Verantwortung",
    search_placeholder: "Schlagzeilen und Auszüge durchsuchen…",
    all_languages: "Alle Sprachen", all_topics: "Alle Themen", all_sources: "Alle Quellen",
    flag_any: "Beliebige Berichterstattung", flag_omits_climate: "Ohne Klima", flag_omits_political: "Ohne Verantwortung",
    flag_omits_both: "Beides ausgelassen", flag_mentions_both: "Beides erwähnt",
    sort_date: "Neueste zuerst", sort_source: "Nach Quelle",
    count_line: "{n} von {t} Artikeln angezeigt", empty: "Keine Artikel entsprechen diesen Filtern.",
    badge_omit_climate: "ohne Klima", badge_omit_political: "ohne Verantwortung",
    badge_lowconf: "geringe Sicherheit (kein Volltext)", why_flagged: "Warum markiert",
    ev_topic: "Themenbegriffe", ev_climate_found: "Klimabegriffe gefunden", ev_climate: "Klimabegriffe",
    ev_political_found: "Verantwortungsbegriffe gefunden", ev_political: "Verantwortungsbegriffe",
    ev_none: "keine gefunden → als Auslassung markiert",
    footer: "Daten aus den RSS-Feeds jeder Quelle und der kostenlosen GDELT DOC 2.0 API. Einmal täglich automatisch neu erstellt. Open Source.",
  },
  it: {
    tagline: "Copertura di <strong>ondate di calore</strong>, <strong>eccesso di morti</strong> e <strong>incendi</strong> nei grandi media inglesi, francesi, spagnoli, tedeschi, italiani e portoghesi — segnalata quando omette il <strong>cambiamento climatico</strong> o qualsiasi <strong>responsabilità politica</strong>.",
    about_link: "Informazioni &amp; metodo", theme: "Tema", ui_language: "Lingua dell'interfaccia",
    loading: "Caricamento…", last_updated: "Aggiornato il {date}",
    disclaimer: "<strong>Come funzionano i contrassegni e i loro limiti.</strong> I contrassegni derivano da regole trasparenti per parole chiave sul testo stesso dell'articolo, non da un giudizio editoriale. “Omette” significa che non è stato trovato alcun termine da un elenco su clima o responsabilità — apri <em>“Perché segnalato”</em> su una scheda per vedere le prove esatte. La corrispondenza per parole chiave è grezza e questa è una finestra mobile, non un archivio completo. <a href=\"about.html\">Leggi il metodo e i limiti →</a>",
    tile_tracked: "Articoli monitorati", tile_tracked_sub: "{langs} lingue · ultimi {days} giorni",
    tile_omit_climate: "Omettono il clima", tile_omit_climate_sub: "{n} su {t} articoli",
    tile_omit_political: "Omettono la responsabilità politica", tile_omit_political_sub: "{n} articoli",
    tile_top_source: "Testata che più lo tace", tile_top_source_sub: "{n} articoli senza clima",
    chart_title: "Omissioni per lingua", chart_hint: "Quota di articoli in ciascuna lingua che omettono ogni tipo di contesto.",
    legend_climate: "Omette il cambiamento climatico", legend_political: "Omette la responsabilità politica",
    show_table: "Mostra tabella", hide_table: "Nascondi tabella",
    th_language: "Lingua", th_articles: "Articoli", th_omit_climate: "Omettono clima", th_omit_political: "Omettono respons.",
    search_placeholder: "Cerca nei titoli e negli estratti…",
    all_languages: "Tutte le lingue", all_topics: "Tutti i temi", all_sources: "Tutte le fonti",
    flag_any: "Qualsiasi copertura", flag_omits_climate: "Omette il clima", flag_omits_political: "Omette la responsabilità",
    flag_omits_both: "Omette entrambi", flag_mentions_both: "Menziona entrambi",
    sort_date: "Più recenti", sort_source: "Per fonte",
    count_line: "{n} di {t} articoli mostrati", empty: "Nessun articolo corrisponde a questi filtri.",
    badge_omit_climate: "omette il clima", badge_omit_political: "omette la responsabilità",
    badge_lowconf: "bassa affidabilità (senza testo completo)", why_flagged: "Perché segnalato",
    ev_topic: "Termini del tema", ev_climate_found: "Termini clima trovati", ev_climate: "Termini clima",
    ev_political_found: "Termini di responsabilità trovati", ev_political: "Termini di responsabilità",
    ev_none: "nessuno trovato → segnalato come omissione",
    footer: "Dati dai feed RSS di ciascuna fonte e dalla API gratuita GDELT DOC 2.0. Ricostruito automaticamente una volta al giorno. Open source.",
  },
  pt: {
    tagline: "Cobertura de <strong>ondas de calor</strong>, <strong>excesso de mortes</strong> e <strong>incêndios</strong> em grandes meios em inglês, francês, espanhol, alemão, italiano e português — sinalizada quando omite as <strong>alterações climáticas</strong> ou qualquer <strong>responsabilidade política</strong>.",
    about_link: "Sobre &amp; método", theme: "Tema", ui_language: "Idioma da interface",
    loading: "A carregar…", last_updated: "Atualizado em {date}",
    disclaimer: "<strong>Como funcionam os sinalizadores e os seus limites.</strong> Os sinalizadores vêm de regras transparentes por palavras-chave sobre o próprio texto do artigo, não de um juízo editorial. “Omite” significa que não foi encontrado nenhum termo de uma lista de clima ou de responsabilidade — abra <em>“Porquê sinalizado”</em> num cartão para ver as evidências exatas. A correspondência por palavras-chave é grosseira e isto é uma janela móvel, não um arquivo completo. <a href=\"about.html\">Ler o método e as limitações →</a>",
    tile_tracked: "Artigos monitorizados", tile_tracked_sub: "{langs} idiomas · últimos {days} dias",
    tile_omit_climate: "Omitem as alterações climáticas", tile_omit_climate_sub: "{n} de {t} artigos",
    tile_omit_political: "Omitem responsabilidade política", tile_omit_political_sub: "{n} artigos",
    tile_top_source: "Meio que mais silencia o clima", tile_top_source_sub: "{n} artigos sem clima",
    chart_title: "Omissões por idioma", chart_hint: "Proporção de artigos em cada idioma que omitem cada tipo de contexto.",
    legend_climate: "Omite as alterações climáticas", legend_political: "Omite responsabilidade política",
    show_table: "Mostrar tabela", hide_table: "Ocultar tabela",
    th_language: "Idioma", th_articles: "Artigos", th_omit_climate: "Omitem clima", th_omit_political: "Omitem respons.",
    search_placeholder: "Pesquisar títulos e excertos…",
    all_languages: "Todos os idiomas", all_topics: "Todos os temas", all_sources: "Todas as fontes",
    flag_any: "Qualquer cobertura", flag_omits_climate: "Omite clima", flag_omits_political: "Omite responsabilidade",
    flag_omits_both: "Omite ambos", flag_mentions_both: "Menciona ambos",
    sort_date: "Mais recentes", sort_source: "Por fonte",
    count_line: "{n} de {t} artigos mostrados", empty: "Nenhum artigo corresponde a estes filtros.",
    badge_omit_climate: "omite clima", badge_omit_political: "omite responsabilidade",
    badge_lowconf: "baixa confiança (sem texto completo)", why_flagged: "Porquê sinalizado",
    ev_topic: "Termos do tema", ev_climate_found: "Termos de clima encontrados", ev_climate: "Termos de clima",
    ev_political_found: "Termos de responsabilidade encontrados", ev_political: "Termos de responsabilidade",
    ev_none: "nenhum encontrado → sinalizado como omissão",
    footer: "Dados dos feeds RSS de cada fonte e da API gratuita GDELT DOC 2.0. Reconstruído automaticamente uma vez por dia. Código aberto.",
  },
};

function detectLocale() {
  const saved = localStorage.getItem("uilang");
  if (saved && LOCALES.includes(saved)) return saved;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return LOCALES.includes(nav) ? nav : "en";
}

let CURRENT = detectLocale();
function getLocale() { return CURRENT; }
function setLocale(loc) {
  if (LOCALES.includes(loc)) { CURRENT = loc; localStorage.setItem("uilang", loc); }
}

function t(key, params) {
  const table = STR[CURRENT] || STR.en;
  let s = (key in table ? table[key] : (STR.en[key] != null ? STR.en[key] : key));
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

/* ---------- About page strings (merged into STR) ---------- */
const ABOUT = {
  en: {
    about_title: "About &amp; method", back: "← Back to the dashboard",
    about_intro: "This dashboard tracks how major newspapers in six languages cover heat waves, excess deaths and wildfires — and highlights the articles that report on these events without ever mentioning climate change or any government or policy responsibility. The aim is media-watch transparency, not accusation: every flag is shown with its evidence so you can judge it yourself.",
    h_how: "How it works",
    p_how: "Once a day an automated job collects recent articles from each source's own RSS feeds and, going backwards in time, from the free GDELT news index. It downloads each article, checks its text against curated keyword lists, and rebuilds the data this page reads. Nothing is generated in your browser — the page just displays a pre-built dataset.",
    h_flags: "How articles are flagged",
    p_flags: "An article is kept if its text matches a heat-wave, excess-death or wildfire term in its language. It is then marked <em>omits climate change</em> if none of that language's climate terms appear (e.g. “climate change”, “global warming”), and <em>omits accountability</em> if no government or policy term appears. These are simple, transparent word matches: the exact terms found — or missing — are listed under “Why flagged” on every card.",
    h_limits: "Limitations",
    lim1: "Keyword rules are blunt: they can miss synonyms, paraphrase or implicit framing, especially for accountability. Treat totals as indicative, not authoritative.",
    lim2: "Paywalled or unreadable articles are classified from the headline and feed summary only, and marked low-confidence.",
    lim3: "The dataset is a rolling window of roughly the last three months, not a complete archive.",
    lim4: "The source country is where the outlet is based, not where the event happened.",
  },
  es: {
    about_title: "Acerca de &amp; método", back: "← Volver al panel",
    about_intro: "Este panel rastrea cómo los grandes periódicos en seis idiomas cubren las olas de calor, el exceso de muertes y los incendios forestales, y destaca los artículos que informan sobre estos hechos sin mencionar nunca el cambio climático ni ninguna responsabilidad política o de gobierno. El objetivo es la transparencia de observación de medios, no la acusación: cada etiqueta se muestra con su evidencia para que tú mismo la juzgues.",
    h_how: "Cómo funciona",
    p_how: "Una vez al día, un proceso automatizado recopila artículos recientes de los RSS de cada fuente y, hacia atrás en el tiempo, del índice gratuito de noticias GDELT. Descarga cada artículo, compara su texto con listas de palabras clave y reconstruye los datos que lee esta página. Nada se genera en tu navegador: la página solo muestra un conjunto de datos ya preparado.",
    h_flags: "Cómo se marcan los artículos",
    p_flags: "Un artículo se conserva si su texto coincide con un término de ola de calor, exceso de muertes o incendio en su idioma. Luego se marca <em>omite el cambio climático</em> si no aparece ningún término climático de ese idioma (p. ej. «cambio climático», «calentamiento global»), y <em>omite responsabilidad</em> si no aparece ningún término de gobierno o política. Son coincidencias de palabras simples y transparentes: los términos exactos encontrados —o ausentes— se enumeran en «Por qué se marcó» en cada ficha.",
    h_limits: "Limitaciones",
    lim1: "Las reglas por palabras clave son toscas: pueden pasar por alto sinónimos, paráfrasis o encuadres implícitos, sobre todo en la responsabilidad. Toma los totales como indicativos, no como definitivos.",
    lim2: "Los artículos de pago o ilegibles se clasifican solo por el titular y el resumen del feed, y se marcan como de baja confianza.",
    lim3: "El conjunto de datos es una ventana móvil de aproximadamente los últimos tres meses, no un archivo completo.",
    lim4: "El país de la fuente es donde se ubica el medio, no donde ocurrió el hecho.",
  },
  fr: {
    about_title: "À propos &amp; méthode", back: "← Retour au tableau de bord",
    about_intro: "Ce tableau de bord suit la manière dont les grands journaux de six langues couvrent les canicules, la surmortalité et les incendies — et met en évidence les articles qui traitent ces événements sans jamais mentionner le changement climatique ni aucune responsabilité politique ou gouvernementale. L'objectif est la transparence d'observation des médias, pas l'accusation : chaque marqueur est présenté avec ses preuves pour que vous jugiez vous-même.",
    h_how: "Fonctionnement",
    p_how: "Une fois par jour, un traitement automatisé collecte les articles récents depuis les flux RSS de chaque source et, en remontant dans le temps, depuis l'index d'actualités gratuit GDELT. Il télécharge chaque article, compare son texte à des listes de mots-clés et reconstruit les données que lit cette page. Rien n'est généré dans votre navigateur : la page affiche seulement un jeu de données pré-calculé.",
    h_flags: "Comment les articles sont signalés",
    p_flags: "Un article est conservé si son texte correspond à un terme de canicule, de surmortalité ou d'incendie dans sa langue. Il est ensuite marqué <em>omet le changement climatique</em> si aucun terme climatique de cette langue n'apparaît (p. ex. « changement climatique », « réchauffement climatique »), et <em>omet la responsabilité</em> si aucun terme de gouvernement ou de politique n'apparaît. Ce sont de simples correspondances de mots, transparentes : les termes exacts trouvés — ou absents — sont listés sous « Pourquoi signalé » sur chaque fiche.",
    h_limits: "Limites",
    lim1: "Les règles par mots-clés sont grossières : elles peuvent manquer synonymes, paraphrases ou cadrages implicites, surtout pour la responsabilité. Considérez les totaux comme indicatifs, non définitifs.",
    lim2: "Les articles payants ou illisibles sont classés à partir du titre et du résumé du flux seulement, et marqués faible confiance.",
    lim3: "Le jeu de données est une fenêtre glissante d'environ trois mois, pas une archive complète.",
    lim4: "Le pays de la source est celui du média, pas celui où l'événement s'est produit.",
  },
  de: {
    about_title: "Über &amp; Methode", back: "← Zurück zum Dashboard",
    about_intro: "Dieses Dashboard verfolgt, wie große Zeitungen in sechs Sprachen über Hitzewellen, Übersterblichkeit und Waldbrände berichten — und hebt die Artikel hervor, die über diese Ereignisse berichten, ohne den Klimawandel oder eine politische bzw. staatliche Verantwortung zu erwähnen. Ziel ist Medienbeobachtungs-Transparenz, keine Anklage: Jede Markierung wird mit ihren Belegen gezeigt, damit Sie selbst urteilen können.",
    h_how: "Funktionsweise",
    p_how: "Einmal täglich sammelt ein automatisierter Job aktuelle Artikel aus den RSS-Feeds jeder Quelle und, rückwärts in der Zeit, aus dem kostenlosen GDELT-Nachrichtenindex. Er lädt jeden Artikel herunter, gleicht seinen Text mit kuratierten Schlagwortlisten ab und baut die Daten neu auf, die diese Seite liest. Nichts wird in Ihrem Browser erzeugt — die Seite zeigt nur einen vorbereiteten Datensatz.",
    h_flags: "Wie Artikel markiert werden",
    p_flags: "Ein Artikel wird behalten, wenn sein Text einen Hitzewellen-, Übersterblichkeits- oder Waldbrand-Begriff in seiner Sprache trifft. Er wird dann als <em>lässt Klimawandel aus</em> markiert, wenn kein Klimabegriff dieser Sprache vorkommt (z. B. „Klimawandel“, „globale Erwärmung“), und als <em>lässt Verantwortung aus</em>, wenn kein Regierungs- oder Politikbegriff vorkommt. Das sind einfache, transparente Wortabgleiche: Die genau gefundenen — oder fehlenden — Begriffe stehen unter „Warum markiert“ auf jeder Karte.",
    h_limits: "Grenzen",
    lim1: "Schlagwortregeln sind grob: Sie können Synonyme, Umschreibungen oder implizite Rahmung übersehen, besonders bei Verantwortung. Werten Sie Summen als Hinweis, nicht als endgültig.",
    lim2: "Artikel hinter Bezahlschranken oder unlesbare Artikel werden nur aus Überschrift und Feed-Zusammenfassung klassifiziert und als geringe Sicherheit markiert.",
    lim3: "Der Datensatz ist ein gleitendes Fenster von etwa drei Monaten, kein vollständiges Archiv.",
    lim4: "Das Quellland ist der Sitz des Mediums, nicht der Ort des Ereignisses.",
  },
  it: {
    about_title: "Informazioni &amp; metodo", back: "← Torna al cruscotto",
    about_intro: "Questo cruscotto monitora come i grandi giornali in sei lingue trattano ondate di calore, eccesso di morti e incendi — ed evidenzia gli articoli che riferiscono di questi eventi senza mai menzionare il cambiamento climatico né alcuna responsabilità politica o di governo. L'obiettivo è la trasparenza dell'osservazione dei media, non l'accusa: ogni contrassegno è mostrato con le sue prove così puoi giudicare tu stesso.",
    h_how: "Come funziona",
    p_how: "Una volta al giorno un processo automatico raccoglie gli articoli recenti dai feed RSS di ciascuna fonte e, andando indietro nel tempo, dall'indice di notizie gratuito GDELT. Scarica ogni articolo, confronta il testo con elenchi di parole chiave e ricostruisce i dati letti da questa pagina. Nulla è generato nel tuo browser: la pagina mostra solo un set di dati già pronto.",
    h_flags: "Come vengono contrassegnati gli articoli",
    p_flags: "Un articolo viene conservato se il suo testo corrisponde a un termine di ondata di calore, eccesso di morti o incendio nella sua lingua. Viene poi contrassegnato <em>omette il cambiamento climatico</em> se non compare alcun termine climatico di quella lingua (es. «cambiamento climatico», «riscaldamento globale») e <em>omette la responsabilità</em> se non compare alcun termine di governo o politica. Sono semplici corrispondenze di parole, trasparenti: i termini esatti trovati — o mancanti — sono elencati sotto «Perché segnalato» su ogni scheda.",
    h_limits: "Limiti",
    lim1: "Le regole per parole chiave sono grezze: possono mancare sinonimi, parafrasi o inquadrature implicite, soprattutto per la responsabilità. Considera i totali come indicativi, non definitivi.",
    lim2: "Gli articoli a pagamento o illeggibili sono classificati solo dal titolo e dal riassunto del feed e contrassegnati a bassa affidabilità.",
    lim3: "Il set di dati è una finestra mobile di circa tre mesi, non un archivio completo.",
    lim4: "Il paese della fonte è dove ha sede la testata, non dove è avvenuto l'evento.",
  },
  pt: {
    about_title: "Sobre &amp; método", back: "← Voltar ao painel",
    about_intro: "Este painel acompanha como os grandes jornais em seis idiomas cobrem ondas de calor, excesso de mortes e incêndios — e destaca os artigos que noticiam estes acontecimentos sem nunca mencionar as alterações climáticas nem qualquer responsabilidade política ou do governo. O objetivo é a transparência de observação dos media, não a acusação: cada sinalizador é mostrado com as suas evidências para que julgue por si.",
    h_how: "Como funciona",
    p_how: "Uma vez por dia, um processo automatizado recolhe artigos recentes dos feeds RSS de cada fonte e, recuando no tempo, do índice de notícias gratuito GDELT. Descarrega cada artigo, compara o seu texto com listas de palavras-chave e reconstrói os dados que esta página lê. Nada é gerado no seu navegador — a página apenas mostra um conjunto de dados já preparado.",
    h_flags: "Como os artigos são sinalizados",
    p_flags: "Um artigo é mantido se o seu texto corresponder a um termo de onda de calor, excesso de mortes ou incêndio no seu idioma. É depois marcado <em>omite as alterações climáticas</em> se não aparecer nenhum termo climático desse idioma (p. ex. «alterações climáticas», «aquecimento global»), e <em>omite responsabilidade</em> se não aparecer nenhum termo de governo ou política. São correspondências de palavras simples e transparentes: os termos exatos encontrados — ou em falta — são listados em «Porquê sinalizado» em cada cartão.",
    h_limits: "Limitações",
    lim1: "As regras por palavras-chave são grosseiras: podem falhar sinónimos, paráfrases ou enquadramentos implícitos, sobretudo na responsabilidade. Trate os totais como indicativos, não definitivos.",
    lim2: "Artigos pagos ou ilegíveis são classificados apenas pelo título e resumo do feed e marcados como baixa confiança.",
    lim3: "O conjunto de dados é uma janela móvel de cerca de três meses, não um arquivo completo.",
    lim4: "O país da fonte é onde o meio está sediado, não onde ocorreu o evento.",
  },
};
for (const _l of LOCALES) Object.assign(STR[_l], ABOUT[_l] || {});

/* ---------- Climate-context module ("flip the narrative") + trend chart ---------- */
/* Primary sources per topic (URLs are the same across locales). */
const CONTEXT_SOURCES = {
  heatwave: [
    { label: "World Weather Attribution", url: "https://www.worldweatherattribution.org/" },
    { label: "IPCC AR6 WG1", url: "https://www.ipcc.ch/report/ar6/wg1/" },
  ],
  wildfire: [
    { label: "IPCC AR6", url: "https://www.ipcc.ch/report/ar6/wg1/" },
    { label: "UNEP — Spreading like Wildfire", url: "https://www.unep.org/resources/report/spreading-wildfire-rising-threat-extraordinary-landscape-fires" },
    { label: "WMO", url: "https://wmo.int/" },
  ],
  excess_deaths: [
    { label: "Lancet Countdown", url: "https://www.lancetcountdown.org/" },
    { label: "World Weather Attribution", url: "https://www.worldweatherattribution.org/" },
  ],
};

const CTX = {
  en: {
    ctx_title: "The context these articles leave out",
    ctx_intro: "The science these events are connected to — the framing the flagged coverage omits.",
    ctx_sources: "Sources", ctx_link: "The science this leaves out →",
    ctx_heatwave: "Human-caused climate change has made heatwaves more frequent, longer and more intense across almost every region. Rapid attribution studies find that many recent extreme-heat events would have been virtually impossible without global warming.",
    ctx_wildfire: "A hotter, drier atmosphere driven by climate change lengthens fire seasons and intensifies the extreme fire-weather conditions that feed the largest blazes.",
    ctx_excess_deaths: "Heat is one of the deadliest weather hazards, and heat-related mortality rises as the planet warms. Attribution research links a growing share of summer heat deaths to human-caused warming.",
    trend_title: "Climate-omission rate over time", trend_hint: "Weekly share of matched articles that omit each kind of context.",
    trend_nodata: "Not enough dated articles yet — the trend fills in as the daily backfill runs.",
  },
  es: {
    ctx_title: "El contexto que estos artículos omiten",
    ctx_intro: "La ciencia con la que estos fenómenos están conectados: el marco que la cobertura señalada omite.",
    ctx_sources: "Fuentes", ctx_link: "La ciencia que esto omite →",
    ctx_heatwave: "El cambio climático de origen humano ha hecho que las olas de calor sean más frecuentes, largas e intensas en casi todas las regiones. Estudios de atribución rápida concluyen que muchos episodios recientes de calor extremo habrían sido prácticamente imposibles sin el calentamiento global.",
    ctx_wildfire: "Una atmósfera más cálida y seca por el cambio climático alarga las temporadas de incendios e intensifica las condiciones meteorológicas extremas que alimentan los grandes fuegos.",
    ctx_excess_deaths: "El calor es uno de los riesgos meteorológicos más mortales y la mortalidad por calor aumenta a medida que el planeta se calienta. La investigación de atribución vincula una parte creciente de las muertes estivales por calor con el calentamiento de origen humano.",
    trend_title: "Tasa de omisión del clima en el tiempo", trend_hint: "Proporción semanal de artículos que omiten cada tipo de contexto.",
    trend_nodata: "Aún no hay suficientes artículos con fecha; la tendencia se completará a medida que se ejecute el llenado diario.",
  },
  fr: {
    ctx_title: "Le contexte que ces articles passent sous silence",
    ctx_intro: "La science à laquelle ces événements sont liés — le cadrage que la couverture signalée omet.",
    ctx_sources: "Sources", ctx_link: "La science que cela omet →",
    ctx_heatwave: "Le changement climatique d'origine humaine a rendu les canicules plus fréquentes, plus longues et plus intenses dans presque toutes les régions. Les études d'attribution rapide montrent que de nombreux épisodes récents de chaleur extrême auraient été quasiment impossibles sans le réchauffement.",
    ctx_wildfire: "Une atmosphère plus chaude et plus sèche, sous l'effet du changement climatique, allonge les saisons des incendies et intensifie les conditions météo extrêmes qui alimentent les plus grands feux.",
    ctx_excess_deaths: "La chaleur est l'un des aléas météorologiques les plus meurtriers, et la mortalité liée à la chaleur augmente avec le réchauffement. Les recherches d'attribution relient une part croissante des décès estivaux dus à la chaleur au réchauffement d'origine humaine.",
    trend_title: "Taux d'omission du climat dans le temps", trend_hint: "Part hebdomadaire des articles qui omettent chaque type de contexte.",
    trend_nodata: "Pas encore assez d'articles datés — la tendance se remplira au fil du remplissage quotidien.",
  },
  de: {
    ctx_title: "Der Kontext, den diese Artikel weglassen",
    ctx_intro: "Die Wissenschaft, mit der diese Ereignisse verbunden sind — der Rahmen, den die markierte Berichterstattung auslässt.",
    ctx_sources: "Quellen", ctx_link: "Die ausgelassene Wissenschaft →",
    ctx_heatwave: "Der menschengemachte Klimawandel hat Hitzewellen in fast allen Regionen häufiger, länger und intensiver gemacht. Schnelle Attributionsstudien zeigen, dass viele jüngste Extremhitze-Ereignisse ohne die globale Erwärmung praktisch unmöglich gewesen wären.",
    ctx_wildfire: "Eine durch den Klimawandel heißere und trockenere Atmosphäre verlängert die Brandsaisons und verstärkt die extremen Feuerwetterlagen, die die größten Brände befeuern.",
    ctx_excess_deaths: "Hitze zählt zu den tödlichsten Wettergefahren, und die hitzebedingte Sterblichkeit steigt mit der Erderwärmung. Attributionsforschung führt einen wachsenden Anteil der sommerlichen Hitzetoten auf die menschengemachte Erwärmung zurück.",
    trend_title: "Klima-Auslassungsrate im Zeitverlauf", trend_hint: "Wöchentlicher Anteil der Artikel, die den jeweiligen Kontext auslassen.",
    trend_nodata: "Noch nicht genügend datierte Artikel — der Trend füllt sich mit dem täglichen Backfill.",
  },
  it: {
    ctx_title: "Il contesto che questi articoli omettono",
    ctx_intro: "La scienza a cui questi eventi sono collegati: l'inquadramento che la copertura segnalata omette.",
    ctx_sources: "Fonti", ctx_link: "La scienza qui omessa →",
    ctx_heatwave: "Il cambiamento climatico di origine umana ha reso le ondate di calore più frequenti, lunghe e intense in quasi tutte le regioni. Studi di attribuzione rapida rilevano che molti recenti eventi di caldo estremo sarebbero stati praticamente impossibili senza il riscaldamento globale.",
    ctx_wildfire: "Un'atmosfera più calda e secca a causa del cambiamento climatico allunga le stagioni degli incendi e intensifica le condizioni meteo estreme che alimentano i roghi più grandi.",
    ctx_excess_deaths: "Il caldo è uno dei rischi meteorologici più letali e la mortalità legata al caldo aumenta con il riscaldamento del pianeta. La ricerca di attribuzione collega una quota crescente delle morti estive per il caldo al riscaldamento di origine umana.",
    trend_title: "Tasso di omissione del clima nel tempo", trend_hint: "Quota settimanale di articoli che omettono ciascun tipo di contesto.",
    trend_nodata: "Non ci sono ancora abbastanza articoli datati — la tendenza si riempirà con il backfill quotidiano.",
  },
  pt: {
    ctx_title: "O contexto que estes artigos omitem",
    ctx_intro: "A ciência a que estes eventos estão ligados — o enquadramento que a cobertura sinalizada omite.",
    ctx_sources: "Fontes", ctx_link: "A ciência que isto omite →",
    ctx_heatwave: "As alterações climáticas de origem humana tornaram as ondas de calor mais frequentes, longas e intensas em quase todas as regiões. Estudos de atribuição rápida concluem que muitos episódios recentes de calor extremo teriam sido praticamente impossíveis sem o aquecimento global.",
    ctx_wildfire: "Uma atmosfera mais quente e seca devido às alterações climáticas prolonga as épocas de incêndios e intensifica as condições meteorológicas extremas que alimentam os maiores fogos.",
    ctx_excess_deaths: "O calor é um dos riscos meteorológicos mais mortais e a mortalidade relacionada com o calor aumenta à medida que o planeta aquece. A investigação de atribuição associa uma parte crescente das mortes estivais por calor ao aquecimento de origem humana.",
    trend_title: "Taxa de omissão do clima ao longo do tempo", trend_hint: "Proporção semanal de artigos que omitem cada tipo de contexto.",
    trend_nodata: "Ainda não há artigos datados suficientes — a tendência preenche-se à medida que o preenchimento diário decorre.",
  },
};
for (const _l of LOCALES) Object.assign(STR[_l], CTX[_l] || {});

/* ---------- Global-warming element inside the context module ---------- */
/* 5-year mean global surface-temperature anomaly vs the 1850–1900 pre-industrial
   baseline (°C), rounded. Consistent with NASA GISS / Berkeley Earth / Copernicus;
   the hero figure is the ~1.5 °C reached in 2024 (WMO / Copernicus). */
const WARMING = {
  hero_c: 1.5,
  series: [
    { y: 1950, a: 0.25 }, { y: 1955, a: 0.25 }, { y: 1960, a: 0.20 },
    { y: 1965, a: 0.25 }, { y: 1970, a: 0.20 }, { y: 1975, a: 0.25 },
    { y: 1980, a: 0.40 }, { y: 1985, a: 0.45 }, { y: 1990, a: 0.55 },
    { y: 1995, a: 0.60 }, { y: 2000, a: 0.75 }, { y: 2005, a: 0.85 },
    { y: 2010, a: 0.95 }, { y: 2015, a: 1.15 }, { y: 2020, a: 1.35 },
  ],
  sources: [
    { label: "WMO", url: "https://wmo.int/" },
    { label: "Copernicus C3S", url: "https://climate.copernicus.eu/" },
    { label: "NASA GISS", url: "https://data.giss.nasa.gov/gistemp/" },
  ],
};

const WARM = {
  en: {
    warming_title: "Global temperatures are rising",
    warming_hero_sub: "2024 vs. the pre-industrial era",
    warming_lead: "About {c} °C of warming above pre-industrial levels — and the ten warmest years on record have all occurred in the last decade. This is the driver the flagged coverage leaves out.",
    warming_caption: "Each stripe = a 5-year average of global temperature, 1950–2024.",
  },
  es: {
    warming_title: "Las temperaturas globales están subiendo",
    warming_hero_sub: "2024 frente a la era preindustrial",
    warming_lead: "Cerca de {c} °C de calentamiento sobre los niveles preindustriales, y los diez años más cálidos registrados son los diez últimos. Este es el motor que la cobertura señalada omite.",
    warming_caption: "Cada franja = promedio de 5 años de la temperatura global, 1950–2024.",
  },
  fr: {
    warming_title: "Les températures mondiales augmentent",
    warming_hero_sub: "2024 par rapport à l'ère préindustrielle",
    warming_lead: "Environ {c} °C de réchauffement au-dessus des niveaux préindustriels — et les dix années les plus chaudes jamais enregistrées sont les dix dernières. C'est le moteur que la couverture signalée passe sous silence.",
    warming_caption: "Chaque bande = moyenne sur 5 ans de la température mondiale, 1950–2024.",
  },
  de: {
    warming_title: "Die globalen Temperaturen steigen",
    warming_hero_sub: "2024 gegenüber der vorindustriellen Zeit",
    warming_lead: "Rund {c} °C Erwärmung über dem vorindustriellen Niveau — und die zehn wärmsten je gemessenen Jahre sind die letzten zehn. Das ist der Treiber, den die markierte Berichterstattung weglässt.",
    warming_caption: "Jeder Streifen = 5-Jahres-Mittel der globalen Temperatur, 1950–2024.",
  },
  it: {
    warming_title: "Le temperature globali stanno aumentando",
    warming_hero_sub: "2024 rispetto all'era preindustriale",
    warming_lead: "Circa {c} °C di riscaldamento sopra i livelli preindustriali — e i dieci anni più caldi mai registrati sono gli ultimi dieci. È il motore che la copertura segnalata omette.",
    warming_caption: "Ogni striscia = media quinquennale della temperatura globale, 1950–2024.",
  },
  pt: {
    warming_title: "As temperaturas globais estão a subir",
    warming_hero_sub: "2024 face à era pré-industrial",
    warming_lead: "Cerca de {c} °C de aquecimento acima dos níveis pré-industriais — e os dez anos mais quentes registados são os últimos dez. Este é o motor que a cobertura sinalizada omite.",
    warming_caption: "Cada faixa = média de 5 anos da temperatura global, 1950–2024.",
  },
};
for (const _l of LOCALES) Object.assign(STR[_l], WARM[_l] || {});

/* ---------- "what average means" explainer + key stats (fires, heat records) ---------- */
const KEYSTATS = [
  { key: "fire", value: "≈2×", labelKey: "fire_stat_label",
    sources: [
      { label: "Nature Ecology & Evolution (2024)", url: "https://doi.org/10.1038/s41559-024-02452-2" },
      { label: "Copernicus EFFIS", url: "https://forest-fire.emergency.copernicus.eu/" },
    ] },
  { key: "heat", value: "10 / 10", labelKey: "heat_stat_label",
    sources: [
      { label: "WMO", url: "https://wmo.int/" },
      { label: "Copernicus C3S", url: "https://climate.copernicus.eu/" },
    ] },
];

const WARM2 = {
  en: {
    warming_avg_title: "What “average” really means",
    warming_avg: "This is a global, year-round average — not how much hotter a single afternoon feels. Nudging that average up by ~1.5 °C shifts the entire range of weather, turning once-in-a-lifetime heat into a regular event. For scale: the last ice age was only about 5 °C colder on average, yet it buried much of the northern hemisphere under ice.",
    fire_stat_label: "The frequency and intensity of Earth's most extreme wildfires roughly doubled over the past 20 years — bigger, hotter, more destructive blazes.",
    heat_stat_label: "The ten warmest years ever recorded are the last ten.",
  },
  es: {
    warming_avg_title: "Qué significa realmente «media»",
    warming_avg: "Es una media global y de todo el año, no cuánto más calor hace una tarde concreta. Subir esa media ~1,5 °C desplaza todo el rango del clima y convierte un calor irrepetible en algo habitual. Para hacerse una idea: la última glaciación fue solo unos 5 °C más fría de media, y cubrió de hielo gran parte del hemisferio norte.",
    fire_stat_label: "La frecuencia e intensidad de los incendios más extremos del planeta se ha duplicado en los últimos 20 años: fuegos más grandes, más calientes y más destructivos.",
    heat_stat_label: "Los diez años más cálidos jamás registrados son los diez últimos.",
  },
  fr: {
    warming_avg_title: "Ce que « moyenne » veut vraiment dire",
    warming_avg: "C'est une moyenne mondiale et annuelle — pas la chaleur ressentie un après-midi. Relever cette moyenne d'environ 1,5 °C décale toute la gamme du climat et transforme une chaleur exceptionnelle en événement banal. Pour l'échelle : la dernière période glaciaire n'était que d'environ 5 °C plus froide en moyenne, et elle recouvrait de glace une grande partie de l'hémisphère nord.",
    fire_stat_label: "La fréquence et l'intensité des incendies les plus extrêmes de la planète ont environ doublé en 20 ans — des feux plus grands, plus chauds, plus destructeurs.",
    heat_stat_label: "Les dix années les plus chaudes jamais mesurées sont les dix dernières.",
  },
  de: {
    warming_avg_title: "Was „Durchschnitt“ wirklich bedeutet",
    warming_avg: "Das ist ein globaler Jahresdurchschnitt — nicht, wie viel heißer sich ein einzelner Nachmittag anfühlt. Diesen Durchschnitt um ~1,5 °C anzuheben verschiebt die gesamte Bandbreite des Wetters und macht aus einer Jahrhundert-Hitze ein Alltagsereignis. Zur Einordnung: Die letzte Eiszeit war im Mittel nur etwa 5 °C kälter — und begrub weite Teile der Nordhalbkugel unter Eis.",
    fire_stat_label: "Häufigkeit und Intensität der extremsten Waldbrände der Erde haben sich in 20 Jahren etwa verdoppelt — größere, heißere, zerstörerischere Brände.",
    heat_stat_label: "Die zehn wärmsten je gemessenen Jahre sind die letzten zehn.",
  },
  it: {
    warming_avg_title: "Cosa significa davvero «media»",
    warming_avg: "È una media globale e su tutto l'anno, non quanto fa più caldo un singolo pomeriggio. Alzare quella media di ~1,5 °C sposta l'intera gamma del clima e trasforma un caldo irripetibile in un evento abituale. Per avere un'idea: l'ultima era glaciale era in media solo circa 5 °C più fredda, eppure ricoprì di ghiaccio gran parte dell'emisfero nord.",
    fire_stat_label: "La frequenza e l'intensità degli incendi più estremi del pianeta sono all'incirca raddoppiate negli ultimi 20 anni: roghi più grandi, più caldi e più distruttivi.",
    heat_stat_label: "I dieci anni più caldi mai registrati sono gli ultimi dieci.",
  },
  pt: {
    warming_avg_title: "O que «média» significa realmente",
    warming_avg: "É uma média global e de todo o ano — não o calor que se sente numa tarde. Subir essa média ~1,5 °C desloca toda a gama do clima e transforma um calor irrepetível num evento habitual. Para ter noção: a última era glacial foi em média apenas cerca de 5 °C mais fria, e cobriu de gelo grande parte do hemisfério norte.",
    fire_stat_label: "A frequência e a intensidade dos incêndios mais extremos do planeta cerca de duplicaram nos últimos 20 anos — fogos maiores, mais quentes e mais destrutivos.",
    heat_stat_label: "Os dez anos mais quentes alguma vez registados são os últimos dez.",
  },
};
for (const _l of LOCALES) Object.assign(STR[_l], WARM2[_l] || {});
