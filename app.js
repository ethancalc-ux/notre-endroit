/* ======================================================================
   NOTRE PETIT ENDROIT — app.js
   ======================================================================
   Ce fichier fait tourner le site : navigation entre pages, animations,
   lecture des données de data.js. Tu ne devrais jamais avoir besoin d'y
   toucher pour ajouter du contenu — vois plutôt js/data.js pour ça.

   Structure de ce fichier :
   1. Utilitaires
   2. Stockage local (favoris, cases cochées, films vus…)
   3. Navigation / routeur (une seule page HTML, plusieurs "vues")
   4. Composants transverses (modale, lightbox, recherche, météo…)
   5. Rendu de chaque page
   6. Démarrage du site
   ====================================================================== */

const D = window.SITE_DATA; // raccourci vers le contenu éditable

/* ======================================================================
   1. UTILITAIRES
   ====================================================================== */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function formatDateLong(iso) {
  try {
    return new Date(iso + (iso.length <= 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* Renvoie une valeur "stable" pour la journée en cours (0 à max-1),
   pour que la citation du jour soit la même toute la journée. */
function indexOfDay(max) {
  const start = new Date(2026, 0, 1).getTime();
  const days = Math.floor((Date.now() - start) / 86400000);
  return ((days % max) + max) % max;
}

/* ======================================================================
   2. STOCKAGE LOCAL — mémorise favoris / cases cochées / films vus
   directement dans le navigateur, sans backend. Propre à chaque appareil.
   ====================================================================== */
const Store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  toggleInSet(key, id) {
    const set = new Set(Store.get(key, []));
    set.has(id) ? set.delete(id) : set.add(id);
    Store.set(key, Array.from(set));
    return set.has(id);
  },
  has(key, id) { return Store.get(key, []).includes(id); },
};

/* ======================================================================
   3. NAVIGATION / ROUTEUR
   ====================================================================== */
const ROUTES = [
  { path: 'accueil',        label: 'Accueil',                emoji: '🏡', render: renderAccueil },
  { path: 'ouvrir-quand',   label: 'À ouvrir quand…',         emoji: '🤍', render: renderOuvrirQuandListe },
  { path: 'videos',         label: 'Mes vidéos',              emoji: '🎬', render: renderVideos },
  { path: 'vlog',           label: 'Mon vlog',                emoji: '📹', render: renderVlog },
  { path: 'souvenirs',      label: 'Nos souvenirs',           emoji: '📸', render: renderSouvenirs },
  { path: 'projets',        label: 'Nos projets',             emoji: '🌱', render: renderProjets },
  { path: 'lille',          label: 'Notre Lille',             emoji: '🗺️', render: renderLille },
  { path: 'appartement',    label: 'Appartement',             emoji: '🔑', render: renderAppartement },
  { path: 'tenue-sport',    label: 'Ma tenue de sport',       emoji: '👟', render: renderTenueSport },
  { path: 'playlist',       label: 'Playlist',                emoji: '🎧', render: renderPlaylist },
  { path: 'films',          label: 'Films & séries',          emoji: '🎞️', render: renderFilms },
  { path: 'lettres',        label: 'Mes lettres',             emoji: '💌', render: () => renderBibliotheque('lettres') },
  { path: 'poemes',         label: 'Poèmes',                  emoji: '🖋️', render: () => renderBibliotheque('poemes') },
  { path: 'photos',         label: 'Photos',                  emoji: '🖼️', render: renderPhotos },
  { path: 'mot-du-jour',    label: 'Le mot du jour',          emoji: '✨', render: renderMotDuJour },
  { path: 'aujourdhui',     label: "Aujourd'hui",             emoji: '📔', render: renderAujourdhui },
  { path: 'sourire',        label: 'Le coin sourire',         emoji: '😊', render: renderCoinSourire },
  { path: 'puissance4',     label: 'Puissance 4',             emoji: '🔴', render: renderPuissance4 },
  { path: 'reves',          label: 'Nos rêves',               emoji: '☁️', render: renderReves },
  { path: 'surprises',      label: 'Petites surprises',       emoji: '🎁', render: renderSurprises },
];

function currentRoute() {
  const hash = location.hash.replace('#/', '') || 'accueil';
  const [base, sub] = hash.split('/');
  return { base, sub };
}

function navigateTo(path) { location.hash = `#/${path}`; }

function renderRoute() {
  const { base, sub } = currentRoute();
  const route = ROUTES.find(r => r.path === base) || ROUTES[0];
  const app = $('#app');

  // Si la page qu'on quitte a laissé une fonction de nettoyage (ex : le
  // Puissance 4 qui écoute Firebase en direct), on l'appelle avant de
  // la remplacer, pour ne pas laisser tourner une connexion pour rien.
  app.firstElementChild?._cleanup?.();

  app.classList.remove('fade-rise');
  void app.offsetWidth; // relance l'animation à chaque navigation

  app.innerHTML = '';
  const pageEl = route.render(sub);
  app.appendChild(pageEl);
  app.classList.add('fade-rise');

  // Met à jour le lien actif dans le menu
  $$('.nav-list a').forEach(a => a.classList.toggle('active', a.dataset.path === base));
  document.title = `${route.label} · ${D.reglages.titreSite}`;
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  closeDrawer();
}

/* ======================================================================
   4. COMPOSANTS TRANSVERSES
   ====================================================================== */

/* --- Modale générique (texte, surprises, blocs media) ------------------*/
function openModal({ glyph = '', bodyHtml = '', closeLabel = 'Fermer' }) {
  const scrim = $('#modal-scrim');
  $('#modal-glyph').textContent = glyph;
  $('#modal-body').innerHTML = bodyHtml;
  $('#modal-close').textContent = closeLabel;
  scrim.classList.add('open');
}
function closeModal() { $('#modal-scrim').classList.remove('open'); }

/* --- Rendu d'un bloc de contenu multimédia (utilisé par "à ouvrir
   quand…" et "surprises") --------------------------------------------- */
function renderBlock(block) {
  switch (block.type) {
    case 'texte':   return `<p>${escapeHtml(block.valeur)}</p>`;
    case 'image':   return `<img src="${block.src}" alt="" style="border-radius:16px;margin-bottom:12px;" loading="lazy">`;
    case 'gif':     return `<img src="${block.src}" alt="" style="border-radius:16px;margin-bottom:12px;" loading="lazy">`;
    case 'video':   return `<video src="${block.src}" controls style="width:100%;border-radius:16px;margin-bottom:12px;"></video>`;
    case 'youtube': return `<iframe class="embed-frame" src="${block.src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    case 'audio':   return `<audio src="${block.src}" controls style="width:100%;margin-bottom:12px;"></audio>`;
    case 'spotify': return `<iframe class="embed-frame audio" src="${block.src}" allow="encrypted-media" loading="lazy"></iframe>`;
    case 'drive':   return `<iframe class="embed-frame" src="${block.src}" allow="autoplay" loading="lazy"></iframe>`;
    default: return '';
  }
}

/* --- Lightbox photo ------------------------------------------------------*/
function openLightbox(src) {
  const lb = $('#lightbox');
  $('#lightbox-img').src = src;
  lb.classList.add('open');
}
function closeLightbox() { $('#lightbox').classList.remove('open'); $('#lightbox-img').src = ''; }

/* --- Recherche globale ---------------------------------------------------*/
function buildSearchIndex() {
  const index = [];
  ROUTES.forEach(r => index.push({ label: r.label, path: r.path }));
  D.ouvrirQuand.forEach(o => index.push({ label: o.titre, path: `ouvrir-quand/${o.id}` }));
  D.lettres.forEach(l => index.push({ label: `Lettre — ${l.titre}`, path: `lettres/${l.id}` }));
  D.poemes.forEach(p => index.push({ label: `Poème — ${p.titre}`, path: `poemes/${p.id}` }));
  D.lieuxLille.forEach(p => index.push({ label: `Lille — ${p.nom}`, path: `lille` }));
  D.vlog.forEach(v => index.push({ label: `Vlog — ${v.titre}`, path: `vlog` }));
  return index;
}
function runSearch(query) {
  const q = query.trim().toLowerCase();
  const box = $('#search-results');
  if (!q) { box.innerHTML = `<div class="muted">Cherche une page, une lettre, un lieu…</div>`; return; }
  const results = buildSearchIndex().filter(i => i.label.toLowerCase().includes(q)).slice(0, 20);
  box.innerHTML = results.length
    ? results.map(r => `<a href="#/${r.path}">${escapeHtml(r.label)}</a>`).join('')
    : `<div class="muted">Rien trouvé, mais ce n'est pas grave 🤍</div>`;
}

/* --- Menu latéral ----------------------------------------------------- */
function toggleDrawer() {
  const open = !$('#nav-drawer').classList.contains('open');
  $('#nav-drawer').classList.toggle('open', open);
  $('#nav-scrim').classList.toggle('open', open);
  $('#nav-toggle').setAttribute('aria-expanded', String(open));
}
function closeDrawer() {
  $('#nav-drawer').classList.remove('open');
  $('#nav-scrim').classList.remove('open');
  $('#nav-toggle')?.setAttribute('aria-expanded', 'false');
}

/* --- Thème clair / sombre ------------------------------------------------*/
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  Store.set('theme', theme);
}
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

/* --- Météo (Open-Meteo, gratuit, sans clé) --------------------------- */
const WEATHER_CODES = {
  0: ['☀️', 'ciel dégagé'], 1: ['🌤️', 'plutôt clair'], 2: ['⛅', 'partiellement nuageux'],
  3: ['☁️', 'couvert'], 45: ['🌫️', 'brumeux'], 48: ['🌫️', 'brumeux'],
  51: ['🌦️', 'bruine légère'], 61: ['🌧️', 'pluie légère'], 63: ['🌧️', 'pluie'],
  65: ['🌧️', 'forte pluie'], 71: ['🌨️', 'neige légère'], 73: ['🌨️', 'neige'],
  75: ['❄️', 'forte neige'], 80: ['🌦️', 'averses'], 95: ['⛈️', 'orage'],
};
async function loadWeather(container) {
  try {
    const { meteoLat, meteoLon, meteoVille } = D.reglages;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${meteoLat}&longitude=${meteoLon}&current=temperature_2m,weather_code`;
    const res = await fetch(url);
    const data = await res.json();
    const code = data.current.weather_code;
    const [icon, desc] = WEATHER_CODES[code] || ['🌥️', 'temps changeant'];
    container.innerHTML = `
      <div class="weather-icon">${icon}</div>
      <div>
        <div class="weather-temp">${Math.round(data.current.temperature_2m)}°C</div>
        <div style="color:var(--ink-soft);font-size:.85rem;">${desc} à ${meteoVille}</div>
      </div>`;
  } catch {
    container.innerHTML = `<div style="color:var(--ink-soft);font-size:.9rem;">Météo indisponible pour le moment.</div>`;
  }
}

/* --- Compteur ----------------------------------------------------------- */
let counterTimer = null;
function mountCounter(container, compteurId) {
  clearInterval(counterTimer);
  const conf = D.compteurs.find(c => c.id === compteurId) || D.compteurs[0];
  const target = new Date(conf.date).getTime();

  function tick() {
    const diff = target - Date.now();
    const abs = Math.abs(diff);
    const j = Math.floor(abs / 86400000);
    const h = Math.floor((abs % 86400000) / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    container.querySelector('.counter-caption').textContent =
      (diff >= 0 ? conf.label : `depuis : ${conf.label.replace(/^avant\s*/i, '')}`);
    container.querySelector('.counter').innerHTML = `
      <div class="counter-unit"><div class="num">${j}</div><div class="label">jours</div></div>
      <div class="counter-unit"><div class="num">${h}</div><div class="label">heures</div></div>
      <div class="counter-unit"><div class="num">${m}</div><div class="label">min</div></div>
      <div class="counter-unit"><div class="num">${s}</div><div class="label">sec</div></div>`;
  }
  tick();
  counterTimer = setInterval(tick, 1000);
}

/* ======================================================================
   5. RENDU DES PAGES
   ====================================================================== */

/* --- Page d'accueil ------------------------------------------------------*/
function renderAccueil() {
  const page = el(`<div class="page home-hero">
    <span class="page-header eyebrow" style="display:block;">Bienvenue</span>
    <h1>${escapeHtml(D.reglages.titreSite)} <span style="color:var(--gold);">♥</span></h1>
    <p class="subtitle">Un endroit rien qu'à toi. Rien à écrire, rien à répondre — juste à te poser.</p>
    ${D.reglages.photoCouverture ? `<div class="hero-photo-wrap"><img class="hero-photo" src="${D.reglages.photoCouverture}" alt="Nous deux" loading="lazy"></div>` : ''}

    <div class="hug-wrap">
      <div class="hug-halo"></div>
      <button class="btn btn-primary btn-hug" id="btn-hug">J'ai besoin d'un câlin 🤍</button>
    </div>

    <div class="section" style="max-width:520px;margin:0 auto;">
      <div class="counter-select" id="counter-select"></div>
      <div class="counter" aria-live="polite"></div>
      <p class="counter-caption" style="text-align:center;color:var(--ink-soft);font-size:.85rem;"></p>
    </div>

    <div class="section">
      <div class="section-title" style="justify-content:center;"><h2 style="font-size:1rem;color:var(--ink-soft);font-family:var(--font-body);font-weight:600;letter-spacing:.04em;text-transform:uppercase;">Explorer</h2></div>
      <div class="widget-grid" id="widget-grid"></div>
    </div>

    <div class="section quote-block" style="max-width:520px;margin:0 auto;">
      <p id="quote-of-day"></p>
    </div>

    <div class="section card weather-card" style="max-width:520px;margin:0 auto;text-align:left;" id="weather-box">
      <div style="color:var(--ink-soft);">Chargement de la météo…</div>
    </div>
    <p class="weather-note" style="max-width:520px;margin:0 auto;">Peu importe la météo dehors, j'espère qu'il fera toujours un peu plus beau dans ton cœur.</p>
  </div>`);

  // Citation du jour (manuelle si définie, sinon automatique)
  const quote = D.citationManuelle || D.citations[indexOfDay(D.citations.length)];
  page.querySelector('#quote-of-day').textContent = `« ${quote} »`;

  // Bouton câlin → phrase aléatoire dans une modale
  page.querySelector('#btn-hug').addEventListener('click', () => {
    openModal({ glyph: '🤍', bodyHtml: `<p class="modal-text">${escapeHtml(pick(D.phrasesCalin))}</p>` });
  });

  // Sélecteur de compteur
  const select = page.querySelector('#counter-select');
  select.innerHTML = D.compteurs.map((c, i) =>
    `<button class="chip ${i === 0 ? 'active' : ''}" data-id="${c.id}">${escapeHtml(c.label)}</button>`
  ).join('');
  select.addEventListener('click', e => {
    const btn = e.target.closest('.chip'); if (!btn) return;
    $$('.chip', select).forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    mountCounter(page, btn.dataset.id);
  });
  mountCounter(page, D.compteurs[0]?.id);

  // Météo
  loadWeather(page.querySelector('#weather-box'));

  // Grille de widgets — navigation principale, pensée pour le mobile :
  // on tape une tuile, on arrive directement sur la page, sans avoir
  // à ouvrir le menu ☰. On y ajoute aussi deux tuiles "pour rire" qui
  // n'ouvrent pas une page mais une petite fenêtre.
  const pageTiles = ROUTES
    .filter(r => r.path !== 'accueil')
    .map(r => `<a class="widget-tile" href="#/${r.path}"><span class="widget-icon">${r.emoji}</span><span class="widget-label">${escapeHtml(r.label)}</span></a>`);
  const funTiles = [
    `<button class="widget-tile" id="widget-envie" type="button"><span class="widget-icon">💬</span><span class="widget-label">Une envie</span></button>`,
    `<button class="widget-tile" id="widget-meteo" type="button"><span class="widget-icon">🌤️</span><span class="widget-label">Météo</span></button>`,
    `<button class="widget-tile" id="widget-toilettes" type="button"><span class="widget-icon">🚽</span><span class="widget-label">Compteur toilettes</span></button>`,
  ];
  page.querySelector('#widget-grid').innerHTML = [...pageTiles, ...funTiles].join('');
  page.querySelector('#widget-envie').addEventListener('click', openEnvieWidget);
  page.querySelector('#widget-meteo').addEventListener('click', openWeatherWidget);
  page.querySelector('#widget-toilettes').addEventListener('click', openToiletCounter);

  return page;
}

/* --- "Une envie" : message rapide envoyé par WhatsApp / SMS / email ------
   iOS et Android n'utilisent pas exactement le même format pour les liens
   "sms:" (Android veut un "?" avant "body=", iOS veut un "&"). On détecte
   la plateforme pour éviter que le message n'apparaisse pas prérempli. */
function isIOS() { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

function openEnvieWidget() {
  const { telephoneContact, emailContact } = D.reglages;
  const presets = D.envies;

  function paint(currentMessage = '') {
    openModal({
      glyph: '💬',
      bodyHtml: `
        <h3 style="margin-bottom:14px;">Une envie, là maintenant ?</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px;">
          ${presets.map((p, i) => `<button class="chip" data-preset="${i}">${p.emoji} ${escapeHtml(p.label)}</button>`).join('')}
        </div>
        <input type="text" id="envie-text" value="${escapeHtml(currentMessage)}" placeholder="Ou écris ton propre message…"
          style="width:100%;padding:12px 14px;border-radius:14px;border:1px solid var(--border-soft);background:var(--surface);color:var(--ink);font-family:var(--font-body);font-size:0.92rem;margin-bottom:14px;">
        <div class="form-actions" style="justify-content:center;">
          <button class="btn btn-primary btn-sm" id="envie-whatsapp">📱 WhatsApp</button>
          <button class="btn btn-ghost btn-sm" id="envie-sms">✉️ SMS</button>
          <button class="btn btn-ghost btn-sm" id="envie-email">📧 Email</button>
        </div>`,
    });

    $$('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
      paint(presets[btn.dataset.preset].message);
    }));

    function getMessage() {
      return $('#envie-text').value.trim();
    }
    $('#envie-whatsapp').addEventListener('click', () => {
      const msg = getMessage(); if (!msg) return;
      window.open(`https://wa.me/${telephoneContact.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    });
    $('#envie-sms').addEventListener('click', () => {
      const msg = getMessage(); if (!msg) return;
      const sep = isIOS() ? '&' : '?';
      window.location.href = `sms:${telephoneContact.replace(/[^\d+]/g, '')}${sep}body=${encodeURIComponent(msg)}`;
    });
    $('#envie-email').addEventListener('click', () => {
      const msg = getMessage(); if (!msg) return;
      window.location.href = `mailto:${emailContact}?subject=${encodeURIComponent('Une petite envie 💬')}&body=${encodeURIComponent(msg)}`;
    });
  }
  paint();
}

/* --- Petit widget météo, en fenêtre (réutilise loadWeather) ------------- */
function openWeatherWidget() {
  openModal({ glyph: '🌤️', bodyHtml: `<h3 style="margin-bottom:14px;">Le temps dehors</h3><div class="weather-card" id="weather-modal-box" style="justify-content:center;text-align:left;">Chargement…</div>` });
  loadWeather($('#weather-modal-box'));
}

/* --- Le compteur toilettes, juste pour rire 😄 ---------------------------
   Chaque appareil garde son propre total (pas de synchronisation entre
   vos deux téléphones, ce serait un peu trop d'ingénierie pour une blague). */
function openToiletCounter() {
  const key = 'compteur-toilettes';
  let counts = Store.get(key, { lorvencia: 0, ethan: 0 });

  function paint() {
    openModal({
      glyph: '🚽',
      bodyHtml: `
        <h3 style="margin-bottom:16px;">Le compteur (pour rire)</h3>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:16px;">
          <div class="counter-unit"><div class="num">${counts.lorvencia}</div><div class="label">Lorvencia</div></div>
          <div class="counter-unit"><div class="num">${counts.ethan}</div><div class="label">Ethan</div></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" id="tc-lorvencia">+1 Lorvencia</button>
          <button class="btn btn-primary btn-sm" id="tc-ethan">+1 Ethan</button>
        </div>
        <button class="btn btn-ghost btn-sm" id="tc-reset" style="margin-top:14px;">Réinitialiser</button>
        <p style="font-size:.75rem;color:var(--ink-soft);margin-top:12px;">Compteur propre à cet appareil : chacun garde le sien de son côté.</p>`,
    });
    $('#tc-lorvencia').addEventListener('click', () => { counts.lorvencia++; Store.set(key, counts); paint(); });
    $('#tc-ethan').addEventListener('click', () => { counts.ethan++; Store.set(key, counts); paint(); });
    $('#tc-reset').addEventListener('click', () => { counts = { lorvencia: 0, ethan: 0 }; Store.set(key, counts); paint(); });
  }
  paint();
}

/* --- À ouvrir quand… (liste) ---------------------------------------------*/
function renderOuvrirQuandListe() {
  const page = el(`<div class="page">
    <div class="page-header">
      <span class="eyebrow">Pour les moments qui comptent</span>
      <h1>À ouvrir quand…</h1>
      <p>Choisis ce que tu ressens maintenant. Il n'y a pas de mauvaise réponse.</p>
    </div>
    <div class="grid" id="oq-grid"></div>
  </div>`);
  page.querySelector('#oq-grid').innerHTML = D.ouvrirQuand.map(o => `
    <a class="card envelope-card card-link" href="#/ouvrir-quand/${o.id}">
      <span class="glyph">${o.icone}</span>
      <h3>${escapeHtml(o.titre)}</h3>
    </a>`).join('');
  return page;
}

/* --- À ouvrir quand… (détail) --------------------------------------------*/
function renderOuvrirQuandDetail(id) {
  const item = D.ouvrirQuand.find(o => o.id === id);
  if (!item) return renderOuvrirQuandListe();
  const page = el(`<div class="page">
    <a href="#/ouvrir-quand" class="btn btn-ghost btn-sm" style="margin-bottom:24px;">← Retour</a>
    <div class="letter-reader">
      <span class="glyph" style="font-size:2rem;">${item.icone}</span>
      <h2>${escapeHtml(item.titre)}</h2>
      <div id="oq-content"></div>
    </div>
  </div>`);
  page.querySelector('#oq-content').innerHTML = item.contenu.map(renderBlock).join('');
  return page;
}

/* --- Mes vidéos -----------------------------------------------------------*/
function renderVideos() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Souvenirs en mouvement</span><h1>Mes vidéos</h1></div>
    <div class="grid" id="video-grid"></div>
  </div>`);
  const grid = page.querySelector('#video-grid');
  if (!D.videos.length) {
    grid.innerHTML = emptyState('🎬', "Pas encore de vidéo — ajoute-en dans js/data.js, section « videos ».");
  } else {
    grid.innerHTML = D.videos.map((v, i) => `
      <button class="card card-link" style="text-align:left;width:100%;border:none;" data-i="${i}">
        <div class="card-cover">${v.miniature ? `<img src="${v.miniature}" alt="">` : '🎬'}</div>
        <h3>${escapeHtml(v.titre)}</h3>
      </button>`).join('');
    grid.addEventListener('click', e => {
      const btn = e.target.closest('[data-i]'); if (!btn) return;
      const v = D.videos[btn.dataset.i];
      const html = v.type === 'mp4'
        ? `<video src="${v.src}" controls style="width:100%;border-radius:16px;"></video>`
        : `<iframe class="embed-frame" src="${v.src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      openModal({ glyph: '🎬', bodyHtml: `<h3 style="margin-bottom:12px;">${escapeHtml(v.titre)}</h3>${html}` });
    });
  }
  return page;
}

/* --- Mon vlog (épisodes vidéo/photo du jour, du plus récent au plus ancien) --*/
function renderVlog() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Un bout de ma journée, pour toi</span><h1>Mon vlog</h1><p>Un petit épisode déposé de temps en temps, pour que tu te sentes un peu avec moi.</p></div>
    <div class="grid" id="vlog-grid"></div>
  </div>`);
  const grid = page.querySelector('#vlog-grid');
  const sorted = [...D.vlog].sort((a, b) => b.date.localeCompare(a.date));

  if (!sorted.length) {
    grid.innerHTML = emptyState('📹', "Pas encore d'épisode — ajoute-en dans js/data.js, section « vlog ».");
    return page;
  }

  grid.innerHTML = sorted.map((v, i) => `
    <button class="card card-link" style="text-align:left;width:100%;border:none;" data-i="${sorted.indexOf(v)}">
      <div class="card-cover">${v.miniature ? `<img src="${v.miniature}" alt="">` : (v.type === 'photo' && v.src ? `<img src="${v.src}" alt="">` : '📹')}</div>
      <div class="letter-date">${formatDateLong(v.date)}</div>
      <h3>${escapeHtml(v.titre)}</h3>
      <p>${escapeHtml(v.texte || '')}</p>
    </button>`).join('');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-i]'); if (!btn) return;
    const v = sorted[btn.dataset.i];
    let mediaHtml = '';
    if (v.type === 'mp4' && v.src)      mediaHtml = `<video src="${v.src}" controls style="width:100%;border-radius:16px;margin-bottom:12px;"></video>`;
    else if (v.type === 'youtube' && v.src) mediaHtml = `<iframe class="embed-frame" src="${v.src}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    else if (v.type === 'drive' && v.src)   mediaHtml = `<iframe class="embed-frame" src="${v.src}" allow="autoplay" loading="lazy"></iframe>`;
    else if (v.type === 'photo' && v.src)   mediaHtml = `<img src="${v.src}" alt="" style="border-radius:16px;margin-bottom:12px;width:100%;">`;
    openModal({
      glyph: '📹',
      bodyHtml: `<div class="letter-date">${formatDateLong(v.date)}</div><h3 style="margin:6px 0 12px;">${escapeHtml(v.titre)}</h3>${mediaHtml}${v.texte ? `<p>${escapeHtml(v.texte)}</p>` : ''}`,
    });
  });
  return page;
}

/* --- Nos souvenirs (timeline) ---------------------------------------------*/
function renderSouvenirs() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Notre histoire</span><h1>Nos souvenirs</h1></div>
    <div class="timeline" id="timeline"></div>
  </div>`);
  const byYear = {};
  D.souvenirs.forEach(s => { (byYear[s.annee] ||= []).push(s); });
  const years = Object.keys(byYear).sort((a, b) => b - a);
  const tl = page.querySelector('#timeline');
  if (!years.length) {
    tl.innerHTML = emptyState('📸', "La timeline est vide pour l'instant — ajoute vos souvenirs dans js/data.js.");
  } else {
    tl.innerHTML = years.map(y => `
      <div class="timeline-year">${y}</div>
      ${byYear[y].map(s => `
        <div class="timeline-item">
          <div class="month">${escapeHtml(s.mois)}</div>
          <h3 style="margin:4px 0;">${escapeHtml(s.titre)}</h3>
          ${s.image ? `<img src="${s.image}" alt="" style="border-radius:14px;max-width:320px;margin-bottom:8px;">` : ''}
          <p>${escapeHtml(s.texte)}</p>
        </div>`).join('')}
    `).join('');
  }
  return page;
}

/* --- Nos projets (checklist) -----------------------------------------------*/
function renderProjets() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Ce qu'on construit</span><h1>Nos projets</h1></div>
    <div class="grid" id="projets-grid"></div>
  </div>`);
  const grid = page.querySelector('#projets-grid');
  const doneSet = new Set(Store.get('projets-faits', D.projets.filter(p => p.fait).map(p => p.id)));

  function paint() {
    grid.innerHTML = D.projets.map(p => `
      <div class="card">
        <h3>${escapeHtml(p.titre)}</h3>
        <p>${escapeHtml(p.texte)}</p>
        <div class="checklist" style="margin-top:12px;">
          <div class="check-row ${doneSet.has(p.id) ? 'done' : ''}" data-id="${p.id}">
            <div class="check-box">${doneSet.has(p.id) ? '✓' : ''}</div>
            <span class="check-label">${doneSet.has(p.id) ? 'Réalisé' : 'À réaliser'}</span>
          </div>
        </div>
      </div>`).join('');
  }
  paint();
  grid.addEventListener('click', e => {
    const row = e.target.closest('.check-row'); if (!row) return;
    doneSet.has(row.dataset.id) ? doneSet.delete(row.dataset.id) : doneSet.add(row.dataset.id);
    Store.set('projets-faits', Array.from(doneSet));
    paint();
  });
  return page;
}

/* --- Notre Lille -----------------------------------------------------------*/
function renderLille() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Notre prochain chapitre</span><h1>Notre Lille</h1><p>Les lieux qu'on veut découvrir, un par un.</p></div>
    <div class="map-status" id="map-status">Chargement de la carte…</div>
    <div class="leaflet-map" id="lille-map"></div>
    <div class="lib-filter" id="lille-filter"></div>
    <div class="grid" id="lille-grid"></div>
  </div>`);

  const cats = ['Tous', ...new Set(D.lieuxLille.map(l => l.categorie))];
  page.querySelector('#lille-filter').innerHTML = cats.map((c, i) =>
    `<button class="chip ${i === 0 ? 'active' : ''}" data-cat="${c}">${escapeHtml(c)}</button>`).join('');

  const favKey = 'lille-favoris';
  function paint(filter = 'Tous') {
    const grid = page.querySelector('#lille-grid');
    const list = filter === 'Tous' ? D.lieuxLille : D.lieuxLille.filter(l => l.categorie === filter);
    grid.innerHTML = list.length ? list.map(l => `
      <div class="card place-card" data-place="${l.id}">
        ${l.topPersonnel ? `<span class="badge-top">🏆 Top ${l.topPersonnel}</span>` : ''}
        <div class="card-cover">${l.image ? `<img src="${l.image}" alt="">` : '📍'}</div>
        <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
          <h3>${escapeHtml(l.nom)}</h3>
          <button class="fav-btn ${Store.has(favKey, l.id) ? 'active' : ''}" data-fav="${l.id}" aria-label="Favori">★</button>
        </div>
        <p>${escapeHtml(l.description)}</p>
        <div class="place-meta">
          <span>${escapeHtml(l.categorie)}</span>
          ${l.note ? `<span>⭐ ${l.note}/5</span>` : ''}
        </div>
        <div class="place-actions">
          <a class="btn btn-ghost btn-sm" href="${l.carteLien}" target="_blank" rel="noopener">Ouvrir dans Maps</a>
          <button class="btn btn-ghost btn-sm" data-locate="${l.id}">📍 Sur la carte</button>
        </div>
      </div>`).join('') : emptyState('🗺️', "Pas encore de lieu — ajoute-les dans js/data.js, section « lieuxLille ».");

    grid.querySelectorAll('[data-fav]').forEach(btn => btn.addEventListener('click', () => {
      Store.toggleInSet(favKey, btn.dataset.fav);
      btn.classList.toggle('active');
    }));
    grid.querySelectorAll('[data-locate]').forEach(btn => btn.addEventListener('click', () => {
      focusMarker(btn.dataset.locate);
      page.querySelector('#lille-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
  }
  paint();
  page.querySelector('#lille-filter').addEventListener('click', e => {
    const btn = e.target.closest('.chip'); if (!btn) return;
    $$('.chip', page.querySelector('#lille-filter')).forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    paint(btn.dataset.cat);
  });

  // --- Carte interactive (Leaflet + OpenStreetMap, gratuite, sans clé) ---
  // On attend que la page soit réellement insérée dans le DOM avant de
  // créer la carte : Leaflet a besoin de connaître la taille réelle du
  // conteneur, ce qui n'est pas encore le cas juste après render().
  let focusMarker = () => {};
  setTimeout(() => {
    focusMarker = mountLilleMap(page.querySelector('#lille-map'), page.querySelector('#map-status'));
  }, 0);

  return page;
}

/* Construit la carte interactive de "Notre Lille" : place un repère pour
   chaque lieu de D.lieuxLille en le géocodant via l'API gratuite Nominatim
   (OpenStreetMap). Les résultats sont mis en cache dans le navigateur pour
   que les visites suivantes soient instantanées. Renvoie une fonction
   focusMarker(id) utilisée par les boutons "📍 Sur la carte". */
function mountLilleMap(container, statusEl) {
  const LILLE_CENTER = [50.6292, 3.0573];
  const map = L.map(container, { scrollWheelZoom: false }).setView(LILLE_CENTER, 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  }).addTo(map);

  const markers = {};

  async function geocode(query) {
    const cacheKey = `geocode:${query}`;
    const cached = Store.get(cacheKey, null);
    if (cached) return { point: cached, fromCache: true };
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
      const data = await res.json();
      if (!data.length) return { point: null, fromCache: false };
      const point = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      Store.set(cacheKey, point);
      return { point, fromCache: false };
    } catch { return { point: null, fromCache: false }; }
  }

  (async () => {
    const places = D.lieuxLille;
    let placed = 0;
    for (const l of places) {
      const { point, fromCache } = await geocode(`${l.nom}, ${l.adresse || 'Lille, France'}`);
      if (point) {
        const marker = L.marker([point.lat, point.lon]).addTo(map);
        marker.bindPopup(`<b>${escapeHtml(l.nom)}</b><br>${escapeHtml(l.categorie)}${l.topPersonnel ? ` · 🏆 Top ${l.topPersonnel}` : ''}<br><a href="${l.carteLien}" target="_blank" rel="noopener">Ouvrir dans Maps</a>`);
        markers[l.id] = marker;
        placed++;
      }
      statusEl.textContent = `Placement des lieux sur la carte… (${placed}/${places.length})`;
      // Respecte la limite d'1 requête/seconde de l'API gratuite Nominatim
      // (inutile d'attendre si le résultat venait déjà du cache local)
      if (!fromCache) await new Promise(r => setTimeout(r, 1100));
    }
    statusEl.textContent = placed
      ? `${placed} lieu${placed > 1 ? 'x' : ''} sur la carte — clique un repère pour plus d'infos.`
      : `La carte n'a pas pu localiser les lieux pour l'instant.`;
    if (placed) {
      const group = L.featureGroup(Object.values(markers));
      map.fitBounds(group.getBounds().pad(0.2));
    }
  })();

  return function focusMarker(id) {
    const marker = markers[id];
    if (!marker) return;
    map.setView(marker.getLatLng(), 15, { animate: true });
    marker.openPopup();
  };
}

/* --- Appartement -----------------------------------------------------------*/
function renderAppartement() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Notre futur chez-nous</span><h1>Appartement</h1></div>
    <div class="grid" id="appt-grid"></div>
  </div>`);
  page.querySelector('#appt-grid').innerHTML = D.appartements.length ? D.appartements.map(a => `
    <div class="card">
      <div class="card-cover">${a.image ? `<img src="${a.image}" alt="">` : '🔑'}</div>
      <h3>${escapeHtml(a.titre)}</h3>
      <div class="place-meta"><span>${escapeHtml(a.prix)}</span><span>${escapeHtml(a.surface)}</span><span>${escapeHtml(a.quartier)}</span></div>
      ${a.notes ? `<p>${escapeHtml(a.notes)}</p>` : ''}
      <div class="place-actions">
        <a class="btn btn-ghost btn-sm" href="${a.lien}" target="_blank" rel="noopener">Voir sur ${escapeHtml(a.plateforme || 'le site')}</a>
      </div>
    </div>`).join('') : emptyState('🔑', "Aucune annonce pour l'instant — ajoute-les dans js/data.js, section « appartements ».");
  return page;
}

/* --- Ma tenue de sport (formulaire rempli par elle, envoyé par email) -------*/
function renderTenueSport() {
  const conf = D.tenueSport;
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Un petit service</span><h1>Ma tenue de sport</h1>
      <p>${escapeHtml(conf.intro)}</p>
    </div>

    ${conf.inspiration.length ? `
    <div class="section" style="max-width:640px;margin:0 auto var(--space-5);">
      <div class="section-title"><h2 style="font-size:1.05rem;">Pour t'inspirer</h2></div>
      <div>${conf.inspiration.map(i => `<a class="inspiration-chip" href="${i.lien}" target="_blank" rel="noopener">👕 ${escapeHtml(i.nom)}</a>`).join('')}</div>
    </div>` : ''}

    <div class="card" style="max-width:720px;margin:0 auto;">
      <div id="tenue-rows"></div>
      <button class="btn btn-ghost btn-sm" id="tenue-add">+ Ajouter un article</button>
      <div class="form-actions">
        <button class="btn btn-primary" id="tenue-send">Envoyer par email 💌</button>
        <button class="btn btn-ghost" id="tenue-copy">Copier le texte</button>
      </div>
      <p class="form-note" id="tenue-feedback"></p>
    </div>
  </div>`);

  const rowsEl = page.querySelector('#tenue-rows');
  const draftKey = 'tenue-sport-draft';

  function rowTemplate(data = {}) {
    return `<div class="form-row">
      <input type="text" placeholder="Article (ex : legging noir)" data-field="nom" value="${escapeHtml(data.nom || '')}">
      <input type="url" placeholder="Lien du produit" data-field="lien" value="${escapeHtml(data.lien || '')}">
      <input type="text" placeholder="Taille" data-field="taille" value="${escapeHtml(data.taille || '')}">
      <input type="text" placeholder="Notes" data-field="notes" value="${escapeHtml(data.notes || '')}">
      <button class="form-remove" type="button" aria-label="Supprimer cette ligne">✕</button>
    </div>`;
  }

  function saveDraft() {
    const rows = $$('.form-row', rowsEl).map(row => ({
      nom: row.querySelector('[data-field="nom"]').value,
      lien: row.querySelector('[data-field="lien"]').value,
      taille: row.querySelector('[data-field="taille"]').value,
      notes: row.querySelector('[data-field="notes"]').value,
    }));
    Store.set(draftKey, rows);
  }

  function addRow(data) {
    rowsEl.insertAdjacentHTML('beforeend', rowTemplate(data));
  }

  const saved = Store.get(draftKey, []);
  (saved.length ? saved : [{}, {}]).forEach(addRow);

  rowsEl.addEventListener('click', e => {
    const btn = e.target.closest('.form-remove'); if (!btn) return;
    if ($$('.form-row', rowsEl).length > 1) btn.closest('.form-row').remove();
    saveDraft();
  });
  rowsEl.addEventListener('input', saveDraft);

  page.querySelector('#tenue-add').addEventListener('click', () => addRow());

  function buildMessage() {
    const rows = $$('.form-row', rowsEl)
      .map(row => ({
        nom: row.querySelector('[data-field="nom"]').value.trim(),
        lien: row.querySelector('[data-field="lien"]').value.trim(),
        taille: row.querySelector('[data-field="taille"]').value.trim(),
        notes: row.querySelector('[data-field="notes"]').value.trim(),
      }))
      .filter(r => r.nom || r.lien);
    if (!rows.length) return null;
    return rows.map((r, i) =>
      `${i + 1}. ${r.nom || 'Article'}${r.lien ? ` — ${r.lien}` : ''}${r.taille ? ` (taille : ${r.taille})` : ''}${r.notes ? ` — ${r.notes}` : ''}`
    ).join('\n');
  }

  page.querySelector('#tenue-send').addEventListener('click', () => {
    const message = buildMessage();
    const feedback = page.querySelector('#tenue-feedback');
    if (!message) { feedback.textContent = "Ajoute au moins un article (un nom ou un lien) avant d'envoyer."; return; }
    const subject = encodeURIComponent('Ma tenue de sport 🏋️');
    const body = encodeURIComponent(`Voici ce que j'ai choisi pour toi :\n\n${message}\n`);
    window.location.href = `mailto:${D.reglages.emailContact}?subject=${subject}&body=${body}`;
    feedback.textContent = "Ton application mail va s'ouvrir avec tout prérempli — il ne reste qu'à envoyer.";
  });

  page.querySelector('#tenue-copy').addEventListener('click', async () => {
    const message = buildMessage();
    const feedback = page.querySelector('#tenue-feedback');
    if (!message) { feedback.textContent = "Ajoute au moins un article avant de copier."; return; }
    try {
      await navigator.clipboard.writeText(message);
      feedback.textContent = "Copié ! Tu peux le coller où tu veux (SMS, WhatsApp…).";
    } catch {
      feedback.textContent = "Impossible de copier automatiquement — sélectionne le texte manuellement.";
    }
  });

  return page;
}

/* --- Playlist ----------------------------------------------------------------*/
function renderPlaylist() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Notre bande-son</span><h1>Playlist</h1></div>
    <div class="grid" id="pl-grid"></div>
  </div>`);
  page.querySelector('#pl-grid').innerHTML = D.playlists.length ? D.playlists.map(p => `
    <div class="card"><h3>${escapeHtml(p.titre)}</h3>
      <iframe class="embed-frame audio" src="${p.src}" allow="encrypted-media" loading="lazy"></iframe>
    </div>`).join('') : emptyState('🎧', "Pas encore de playlist — ajoute des liens Spotify/YouTube dans js/data.js.");
  return page;
}

/* --- Films / séries ----------------------------------------------------------*/
function renderFilms() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">À regarder ensemble</span><h1>Films &amp; séries</h1></div>
    <div class="lib-filter" id="films-filter">
      <button class="chip active" data-f="tous">Tous</button>
      <button class="chip" data-f="avoir">À voir</button>
      <button class="chip" data-f="vu">Vus</button>
    </div>
    <div class="grid" id="films-grid"></div>
  </div>`);
  const key = 'films-vus';
  function paint(filter = 'tous') {
    let list = D.films;
    if (filter === 'avoir') list = list.filter(f => !Store.has(key, f.titre));
    if (filter === 'vu')    list = list.filter(f =>  Store.has(key, f.titre));
    const grid = page.querySelector('#films-grid');
    grid.innerHTML = list.length ? list.map(f => `
      <div class="card">
        <div class="card-cover">${f.image ? `<img src="${f.image}" alt="">` : '🎞️'}</div>
        <h3>${escapeHtml(f.titre)}</h3>
        <p>${escapeHtml(f.categorie || '')}</p>
        <button class="btn btn-sm ${Store.has(key, f.titre) ? 'btn-ghost' : 'btn-primary'}" data-toggle="${escapeHtml(f.titre)}" style="margin-top:8px;">
          ${Store.has(key, f.titre) ? '✓ Vu' : 'Marquer comme vu'}
        </button>
      </div>`).join('') : emptyState('🎞️', "Bibliothèque vide — ajoute des titres dans js/data.js, section « films ».");
    grid.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
      Store.toggleInSet(key, btn.dataset.toggle);
      paint(page.querySelector('.chip.active')?.dataset.f || 'tous');
    }));
  }
  paint();
  page.querySelector('#films-filter').addEventListener('click', e => {
    const btn = e.target.closest('.chip'); if (!btn) return;
    $$('.chip', page.querySelector('#films-filter')).forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    paint(btn.dataset.f);
  });
  return page;
}

/* --- Bibliothèque partagée : lettres & poèmes --------------------------------*/
function renderBibliotheque(type) {
  const items = D[type];
  const titre = type === 'lettres' ? 'Mes lettres' : 'Poèmes';
  const eyebrow = type === 'lettres' ? 'Des mots pour toi' : 'Des vers pour toi';
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">${eyebrow}</span><h1>${titre}</h1></div>
    <div class="grid" id="lib-grid"></div>
  </div>`);
  page.querySelector('#lib-grid').innerHTML = items.length ? items.map(l => `
    <a class="card card-link" href="#/${type}/${l.id}">
      <div class="letter-date">${formatDateLong(l.date)} · ${escapeHtml(l.categorie || '')}</div>
      <h3>${escapeHtml(l.titre)}</h3>
    </a>`).join('') : emptyState('💌', `Rien pour l'instant — ajoute des textes dans js/data.js, section « ${type} ».`);
  return page;
}
function renderBibliothequeDetail(type, id) {
  const item = D[type].find(l => l.id === id);
  if (!item) return renderBibliotheque(type);
  const page = el(`<div class="page">
    <a href="#/${type}" class="btn btn-ghost btn-sm" style="margin-bottom:24px;">← Retour</a>
    <div class="letter-reader">
      <div class="letter-date">${formatDateLong(item.date)} · ${escapeHtml(item.categorie || '')}</div>
      <h2>${escapeHtml(item.titre)}</h2>
      <div class="letter-body">${escapeHtml(item.texte)}</div>
    </div>
  </div>`);
  return page;
}

/* --- Photos (galerie + lightbox) ----------------------------------------------*/
function renderPhotos() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Nos images</span><h1>Photos</h1></div>
    <div class="photo-grid" id="photo-grid"></div>
  </div>`);
  const grid = page.querySelector('#photo-grid');
  grid.innerHTML = D.photos.length
    ? D.photos.map(src => `<img src="${src}" alt="" loading="lazy">`).join('')
    : emptyState('🖼️', "Galerie vide — dépose des images dans assets/images puis liste-les dans js/data.js.");
  grid.addEventListener('click', e => { if (e.target.tagName === 'IMG') openLightbox(e.target.src); });
  return page;
}

/* --- Le mot du jour -------------------------------------------------------------*/
function renderMotDuJour() {
  const m = D.motDuJour;
  return el(`<div class="page">
    <div class="page-header"><span class="eyebrow">${formatDateLong(m.date)}</span><h1>Le mot du jour</h1></div>
    <div class="quote-block" style="max-width:560px;margin:0 auto;">
      <div style="font-family:var(--font-display);font-size:2.4rem;color:var(--gold);margin-bottom:8px;">${escapeHtml(m.mot)}</div>
      <p style="font-style:normal;">${escapeHtml(m.texte)}</p>
    </div>
  </div>`);
}

/* --- Aujourd'hui (mini journal) -------------------------------------------------*/
function renderAujourdhui() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Mini journal</span><h1>Aujourd'hui</h1></div>
    <div class="grid grid-2" id="journal-grid"></div>
  </div>`);
  const sorted = [...D.journal].sort((a, b) => b.date.localeCompare(a.date));
  page.querySelector('#journal-grid').innerHTML = sorted.length ? sorted.map(j => `
    <div class="card">
      <div class="letter-date">${formatDateLong(j.date)}</div>
      ${j.photo ? `<img src="${j.photo}" alt="" style="border-radius:14px;margin:8px 0;">` : ''}
      ${j.anecdote ? `<p><strong>Aujourd'hui :</strong> ${escapeHtml(j.anecdote)}</p>` : ''}
      ${j.pensee ? `<p style="font-style:italic;color:var(--ink-soft);">${escapeHtml(j.pensee)}</p>` : ''}
    </div>`).join('') : emptyState('📔', "Le journal est vide — ajoute une entrée par jour dans js/data.js, section « journal ».");
  return page;
}

/* --- Le coin sourire -------------------------------------------------------------*/
function renderCoinSourire() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Pour rire un peu</span><h1>Le coin sourire</h1></div>
    <div class="grid" id="sourire-grid"></div>
  </div>`);
  page.querySelector('#sourire-grid').innerHTML = D.coinSourire.length ? D.coinSourire.map(v => `
    <div class="card"><h3>${escapeHtml(v.titre)}</h3>
      <iframe class="embed-frame" src="${v.src}" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>
    </div>`).join('') : emptyState('😊', "Vide pour l'instant — ajoute des vidéos drôles dans js/data.js, section « coinSourire ».");
  return page;
}

/* ======================================================================
   PUISSANCE 4 EN LIGNE — jeu en temps réel via Firebase Realtime
   Database. Grille stockée à plat : 42 cases (6 lignes × 7 colonnes),
   index = ligne*7 + colonne, ligne 0 = tout en bas du plateau.
   ====================================================================== */
const C4_ROWS = 6, C4_COLS = 7;

function c4EmptyGrid() { return Array(C4_ROWS * C4_COLS).fill(null); }

function c4CheckWinner(grille) {
  const at = (r, c) => (r < 0 || r >= C4_ROWS || c < 0 || c >= C4_COLS) ? null : grille[r * C4_COLS + c];
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      const color = at(r, c);
      if (!color) continue;
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let k = 1; k < 4; k++) { if (at(r + dr * k, c + dc * k) === color) count++; else break; }
        if (count >= 4) return color;
      }
    }
  }
  return grille.every(cell => cell) ? 'nul' : null;
}

function renderPuissance4() {
  const fbConf = D.reglages.firebase;
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Pour jouer, tous les deux</span><h1>Puissance 4</h1></div>
    <div id="c4-root" style="max-width:420px;margin:0 auto;text-align:center;"></div>
  </div>`);
  const root = page.querySelector('#c4-root');

  if (!fbConf.apiKey) {
    root.innerHTML = emptyState('🔴', "Il manque une dernière étape de configuration (gratuite, ~10 min) pour activer le jeu en temps réel — regarde la section « Puissance 4 en ligne » du README.");
    return page;
  }

  // Initialise Firebase une seule fois, même si on revient plusieurs fois sur cette page
  if (!window._fbApp) {
    window._fbApp = firebase.initializeApp(fbConf);
  }
  const db = firebase.database();
  const cle = D.reglages.puissance4Cle || 'notre-puissance4';
  const partieRef = db.ref(`${cle}/partie`);

  // Identifiant propre à cet appareil (mémorisé), pour savoir "qui est qui"
  let deviceId = Store.get('c4-device-id', null);
  if (!deviceId) { deviceId = 'd-' + Math.random().toString(36).slice(2, 12); Store.set('c4-device-id', deviceId); }

  root.innerHTML = `
    <p id="c4-status" style="color:var(--ink-soft);margin-bottom:14px;">Connexion à la partie…</p>
    <div class="c4-board" id="c4-board"></div>
    <div class="form-actions" style="justify-content:center;margin-top:18px;">
      <button class="btn btn-ghost btn-sm" id="c4-reset">🔄 Nouvelle partie</button>
    </div>
  `;
  const statusEl = root.querySelector('#c4-status');
  const boardEl = root.querySelector('#c4-board');

  // Prépare les 42 cases une fois (on ne fait que changer leur couleur ensuite,
  // ce qui permet une petite animation fluide à chaque coup)
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < C4_COLS; c++) {
      boardEl.insertAdjacentHTML('beforeend', `<button class="c4-cell" data-row="${r}" data-col="${c}" aria-label="Colonne ${c + 1}"></button>`);
    }
  }

  let monRole = null;
  let previousGrid = c4EmptyGrid();

  function paint(partie) {
    if (!partie) return;
    // Anime uniquement les cases qui viennent de changer
    partie.grille.forEach((val, i) => {
      const row = Math.floor(i / C4_COLS), col = i % C4_COLS;
      const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (!cell) return;
      cell.classList.remove('rouge', 'jaune');
      if (val) cell.classList.add(val);
      if (val && !previousGrid[i]) cell.classList.add('c4-pop');
      else cell.classList.remove('c4-pop');
    });
    previousGrid = partie.grille;

    if (!monRole) {
      statusEl.textContent = "Tu regardes la partie en spectateur.";
    } else if (partie.gagnant === 'nul') {
      statusEl.textContent = "Match nul, plateau plein ! 🤝";
    } else if (partie.gagnant) {
      const gagnantEstMoi = partie.gagnant === monRole;
      statusEl.textContent = gagnantEstMoi ? "Tu as gagné ! 🎉" : "Ton adversaire a gagné cette manche 😅";
    } else if (partie.tour === monRole) {
      statusEl.textContent = `À toi de jouer (${monRole === 'rouge' ? '🔴' : '🟡'})`;
    } else {
      statusEl.textContent = "Au tour de l'autre…";
    }
  }

  // Rejoint la partie : prend une place libre (rouge ou jaune), ou observe
  function joinGame() {
    partieRef.child('joueurs').transaction(joueurs => {
      joueurs = joueurs || { rouge: null, jaune: null };
      if (joueurs.rouge === deviceId || joueurs.jaune === deviceId) return joueurs;
      if (!joueurs.rouge) { joueurs.rouge = deviceId; return joueurs; }
      if (!joueurs.jaune) { joueurs.jaune = deviceId; return joueurs; }
      return joueurs; // déjà 2 joueurs pris : on n'y touche pas, on sera spectateur
    }, (err, committed, snap) => {
      const joueurs = snap ? snap.val() : null;
      if (joueurs?.rouge === deviceId) monRole = 'rouge';
      else if (joueurs?.jaune === deviceId) monRole = 'jaune';
      else monRole = null;
    });
  }

  // Crée la partie si elle n'existe pas encore
  partieRef.transaction(partie => partie || { grille: c4EmptyGrid(), tour: 'rouge', gagnant: null, joueurs: { rouge: null, jaune: null } });
  joinGame();

  partieRef.on('value', snap => paint(snap.val()));
  page._cleanup = () => partieRef.off('value');

  boardEl.addEventListener('click', e => {
    const cell = e.target.closest('[data-col]'); if (!cell || !monRole) return;
    const col = parseInt(cell.dataset.col, 10);
    partieRef.transaction(partie => {
      if (!partie || partie.gagnant || partie.tour !== monRole) return partie;
      const grille = partie.grille.slice();
      let placed = false;
      for (let row = 0; row < C4_ROWS; row++) {
        const idx = row * C4_COLS + col;
        if (!grille[idx]) { grille[idx] = monRole; placed = true; break; }
      }
      if (!placed) return partie; // colonne pleine
      partie.grille = grille;
      const winner = c4CheckWinner(grille);
      if (winner) partie.gagnant = winner;
      else partie.tour = monRole === 'rouge' ? 'jaune' : 'rouge';
      return partie;
    });
  });

  root.querySelector('#c4-reset').addEventListener('click', () => {
    partieRef.transaction(partie => {
      partie = partie || {};
      partie.grille = c4EmptyGrid();
      partie.tour = 'rouge';
      partie.gagnant = null;
      return partie;
    });
  });

  return page;
}

/* --- Nos rêves (moodboard) -------------------------------------------------------*/
function renderReves() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Ce qu'on imagine</span><h1>Nos rêves</h1></div>
    <div class="moodboard" id="reves-grid"></div>
  </div>`);
  const grid = page.querySelector('#reves-grid');
  grid.innerHTML = D.reves.length
    ? D.reves.map(src => `<img src="${src}" alt="" loading="lazy">`).join('')
    : emptyState('☁️', "Moodboard vide — ajoute des images d'inspiration dans js/data.js, section « reves ».");
  grid.addEventListener('click', e => { if (e.target.tagName === 'IMG') openLightbox(e.target.src); });
  return page;
}

/* --- Les petites surprises (enveloppes) ----------------------------------------*/
function renderSurprises() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Chut, c'est une surprise</span><h1>Les petites surprises</h1></div>
    <div class="grid" id="surprises-grid"></div>
  </div>`);
  const openedKey = 'surprises-ouvertes';
  const grid = page.querySelector('#surprises-grid');
  grid.innerHTML = D.surprises.length ? D.surprises.map(s => `
    <div class="card envelope ${Store.has(openedKey, s.id) ? 'opened' : ''}" data-id="${s.id}">
      <span class="flap">✉️</span>
      <h3>${escapeHtml(s.titre)}</h3>
      <p style="font-size:.85rem;">${Store.has(openedKey, s.id) ? 'Déjà ouverte — clique pour revoir' : 'Clique pour ouvrir'}</p>
    </div>`).join('') : emptyState('🎁', "Pas encore de surprise — ajoute-en dans js/data.js, section « surprises ».");

  grid.addEventListener('click', e => {
    const card = e.target.closest('.envelope'); if (!card) return;
    const s = D.surprises.find(x => x.id === card.dataset.id);
    Store.toggleInSet(openedKey, s.id);
    card.classList.add('opened');
    card.querySelector('p').textContent = 'Déjà ouverte — clique pour revoir';
    openModal({ glyph: '🎁', bodyHtml: `<h3 style="margin-bottom:12px;">${escapeHtml(s.titre)}</h3>${s.contenu.map(renderBlock).join('')}` });
  });
  return page;
}

/* --- État vide réutilisable -------------------------------------------------------*/
function emptyState(icon, text) {
  return `<div class="card" style="text-align:center;grid-column:1/-1;color:var(--ink-soft);">
    <div style="font-size:2rem;margin-bottom:8px;">${icon}</div><p>${text}</p>
  </div>`;
}

/* Certaines routes ont des sous-pages (détail). On les branche ici. */
const originalOuvrirQuand = renderOuvrirQuandListe;
ROUTES.find(r => r.path === 'ouvrir-quand').render = (sub) => sub ? renderOuvrirQuandDetail(sub) : originalOuvrirQuand();
ROUTES.find(r => r.path === 'lettres').render = (sub) => sub ? renderBibliothequeDetail('lettres', sub) : renderBibliotheque('lettres');
ROUTES.find(r => r.path === 'poemes').render  = (sub) => sub ? renderBibliothequeDetail('poemes', sub)  : renderBibliotheque('poemes');

/* ======================================================================
   6. EFFET D'ÉTOILES (discret, désactivable dans data.js)
   ====================================================================== */
function startAmbientStars() {
  if (!D.reglages.effetEtoiles) return;
  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  function seed() {
    stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + .3, phase: Math.random() * Math.PI * 2, speed: .01 + Math.random() * .015,
    }));
  }
  resize(); seed();
  addEventListener('resize', () => { resize(); seed(); });
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  function loop(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDark() ? 'rgba(243,231,225,0.9)' : 'rgba(199,165,103,0.55)';
    stars.forEach(s => {
      const a = (Math.sin(t * s.speed + s.phase) + 1) / 2;
      ctx.globalAlpha = a * 0.6;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ======================================================================
   7. DÉMARRAGE
   ====================================================================== */
function buildNav() {
  $('#nav-list').innerHTML = ROUTES.map(r =>
    `<a href="#/${r.path}" data-path="${r.path}"><span class="emoji">${r.emoji}</span> ${escapeHtml(r.label)}</a>`
  ).join('');
}

function init() {
  // Thème sauvegardé (ou préférence système)
  const savedTheme = Store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  buildNav();

  $('#nav-toggle').addEventListener('click', toggleDrawer);
  $('#nav-scrim').addEventListener('click', closeDrawer);
  $('#theme-toggle').addEventListener('click', toggleTheme);
  $('#modal-scrim').addEventListener('click', e => { if (e.target.id === 'modal-scrim') closeModal(); });
  $('#modal-close').addEventListener('click', closeModal);
  $('#lightbox').addEventListener('click', closeLightbox);

  // Recherche globale
  $('#search-toggle').addEventListener('click', () => {
    $('#search-overlay').classList.add('open');
    $('#search-input').value = '';
    runSearch('');
    $('#search-input').focus();
  });
  $('#search-overlay').addEventListener('click', e => { if (e.target.id === 'search-overlay') $('#search-overlay').classList.remove('open'); });
  $('#search-input').addEventListener('input', e => runSearch(e.target.value));

  // Bouton flottant "Je pense à toi"
  $('#floating-think').addEventListener('click', () => {
    openModal({ glyph: '💭', bodyHtml: `<p class="modal-text">${escapeHtml(pick(D.phrasesCalin))}</p>` });
  });

  // Échap ferme tout
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeModal(); closeLightbox(); closeDrawer();
    $('#search-overlay').classList.remove('open');
  });

  startAmbientStars();

  window.addEventListener('hashchange', renderRoute);
  renderRoute();

  // PWA : enregistrement du service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
