/* ======================================================================
   NOTRE PETIT ENDROIT, app.js
   ======================================================================
   Ce fichier fait tourner le site : navigation entre pages, animations,
   lecture des données de data.js. Tu ne devrais jamais avoir besoin d'y
   toucher pour ajouter du contenu, vois plutôt js/data.js pour ça.

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
   2. STOCKAGE LOCAL, mémorise favoris / cases cochées / films vus
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
  { path: 'ouvrir-quand',   label: 'À ouvrir quand…',         emoji: '🤍', desc: 'Pour les moments qui comptent',     render: renderOuvrirQuandListe },
  { path: 'vlog',           label: 'Mon vlog',                emoji: '📹', desc: 'Un bout de ma journée, pour toi',   render: renderVlog },
  { path: 'lille',          label: 'Notre Lille',             emoji: '🗺️', desc: 'Les lieux qu\'on veut découvrir',   render: renderLille },
  { path: 'tenue-sport',    label: 'Ma tenue de sport',       emoji: '👟', desc: 'Choisis-moi une tenue',             render: renderTenueSport },
  { path: 'youtube',        label: 'YouTube',                 emoji: '▶️', desc: 'Nos vidéos, en un clic',            render: renderYoutube },
  { path: 'mot-du-jour',    label: 'Le mot du jour',          emoji: '✨', desc: 'Une pensée par jour',               render: renderMotDuJour },
  { path: 'puissance4',     label: 'Puissance 4',             emoji: '🔴', desc: 'On y joue à deux, en direct',       render: renderPuissance4 },
  { path: 'surprises',      label: 'Petites surprises',       emoji: '🎁', desc: 'Des enveloppes à ouvrir',           render: renderSurprises },
  { path: 'jeux',           label: 'Nos petits jeux',         emoji: '🎲', desc: 'Quiz et mini-jeux pour deux',       render: renderJeuxListe },
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
  D.lieuxLille.forEach(p => index.push({ label: `Lille, ${p.nom}`, path: `lille` }));
  D.vlog.forEach(v => index.push({ label: `Vlog, ${v.titre}`, path: `vlog` }));
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
async function fetchWeatherFor(ville) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${ville.lat}&longitude=${ville.lon}&current=temperature_2m,weather_code`;
    const res = await fetch(url);
    const data = await res.json();
    const code = data.current.weather_code;
    const [icon, desc] = WEATHER_CODES[code] || ['🌥️', 'temps changeant'];
    return { ok: true, nom: ville.nom, icon, desc, temp: Math.round(data.current.temperature_2m) };
  } catch {
    return { ok: false, nom: ville.nom };
  }
}

async function loadWeather(container) {
  const villes = D.reglages.meteoVilles || [];
  if (!villes.length) { container.innerHTML = `<div style="color:var(--ink-soft);font-size:.9rem;">Aucune ville configurée.</div>`; return; }
  const resultats = await Promise.all(villes.map(fetchWeatherFor));
  container.innerHTML = resultats.map(r => r.ok ? `
    <div class="weather-row">
      <div class="weather-icon">${r.icon}</div>
      <div>
        <div class="weather-temp">${r.temp}°C</div>
        <div style="color:var(--ink-soft);font-size:.85rem;">${r.desc} à ${r.nom}</div>
      </div>
    </div>` : `<div style="color:var(--ink-soft);font-size:.85rem;">Météo indisponible pour ${r.nom}.</div>`
  ).join('');
}

/* --- Compteur ----------------------------------------------------------- */
let counterTimer = null;
function mountCounter(container) {
  clearInterval(counterTimer);
  const reference = new Date(D.derniereRencontre).getTime();

  function tick() {
    const diff = Math.max(0, Date.now() - reference); // jamais négatif
    const j = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
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

/* --- Carrousel de photos (accueil) ---------------------------------------
   Utilise le défilement natif du navigateur (scroll-snap) plutôt que des
   calculs de position en JS : c'est ce qui rend le glisser aussi fluide
   qu'une vraie application, y compris au doigt sur téléphone. */
function mountCarousel(page) {
  const photos = D.reglages.carrouselAccueil;
  const track = page.querySelector('#carousel-track');
  const dotsEl = page.querySelector('#carousel-dots');

  track.innerHTML = photos.map(p =>
    `<div class="carousel-slide"><img src="${p.src}" alt="${escapeHtml(p.alt || '')}" loading="lazy"><span class="carousel-heart">♥</span></div>`
  ).join('');
  dotsEl.innerHTML = photos.map((_, i) =>
    `<button class="carousel-dot ${i === 0 ? 'active' : ''}" data-i="${i}" aria-label="Photo ${i + 1}"></button>`
  ).join('');

  const slides = $$('.carousel-slide', track);
  function markActive(idx) {
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
  }
  markActive(0);

  function currentIndex() {
    const center = track.getBoundingClientRect().left + track.getBoundingClientRect().width / 2;
    let closest = 0, min = Infinity;
    slides.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs((r.left + r.width / 2) - center);
      if (d < min) { min = d; closest = i; }
    });
    return closest;
  }
  function goTo(i) {
    slides[Math.max(0, Math.min(slides.length - 1, i))]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  page.querySelector('#carousel-prev').addEventListener('click', () => goTo(currentIndex() - 1));
  page.querySelector('#carousel-next').addEventListener('click', () => goTo(currentIndex() + 1));
  dotsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-i]'); if (!btn) return;
    goTo(parseInt(btn.dataset.i, 10));
  });

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const idx = currentIndex();
      $$('.carousel-dot', dotsEl).forEach((d, i) => d.classList.toggle('active', i === idx));
      markActive(idx);
      ticking = false;
    });
  });
}

/* --- Page d'accueil ------------------------------------------------------*/
function renderAccueil() {
  const page = el(`<div class="page home-hero">
    ${D.reglages.fondDecoratif
      ? `<img class="bg-decor" src="${D.reglages.fondDecoratif}" alt="" aria-hidden="true" loading="lazy">`
      : `<div class="bg-blob bg-blob-1" aria-hidden="true"></div><div class="bg-blob bg-blob-2" aria-hidden="true"></div>`}
    <span class="page-header eyebrow" style="display:block;">Bienvenue</span>
    <h1>${escapeHtml(D.reglages.titreSite)} <span style="color:var(--gold);">♥</span></h1>
    <p class="subtitle">Un endroit rien qu'à toi. Rien à écrire, rien à répondre, juste à te poser.</p>
    ${D.reglages.carrouselAccueil?.length ? `
    <div class="carousel-wrap" id="carousel-wrap">
      <button class="carousel-arrow carousel-prev" id="carousel-prev" aria-label="Photo précédente">‹</button>
      <div class="carousel-track" id="carousel-track"></div>
      <button class="carousel-arrow carousel-next" id="carousel-next" aria-label="Photo suivante">›</button>
    </div>
    <div class="carousel-dots" id="carousel-dots"></div>` : ''}

    <div class="hug-wrap">
      <div class="hug-halo"></div>
      <button class="btn btn-primary btn-hug" id="btn-hug">J'ai besoin d'un câlin 🤍</button>
    </div>

    <div class="section duo-cards" style="margin-bottom:var(--space-7);">
      <div class="card duo-card">
        <div class="duo-card-title">💗 Depuis notre dernier câlin</div>
        <div class="duo-card-sub" id="derniere-rencontre-label"></div>
        <div class="counter" aria-live="polite"></div>
      </div>
      <div class="card duo-card" id="distance-widget"></div>
    </div>

    <div class="section" style="margin-top:var(--space-6);">
      <div class="widget-grid" id="widget-grid"></div>
    </div>

    <div class="section card daily-panel" style="max-width:420px;margin:0 auto;">
      <div class="daily-panel-title">🚽 Aujourd'hui</div>
      <div class="daily-panel-row">
        <button class="daily-btn" id="caca-lorvencia" type="button">Lorvencia <span class="daily-count" id="caca-lorvencia-n">0</span></button>
        <button class="daily-btn" id="caca-ethan" type="button">Ethan <span class="daily-count" id="caca-ethan-n">0</span></button>
      </div>
      <button class="btn btn-primary btn-sm" id="btn-uber-quick" style="width:100%;margin-top:12px;">🍔 Demander un Uber Eats</button>
    </div>

    <div class="section quote-block" style="max-width:520px;margin:0 auto;">
      <p id="quote-of-day"></p>
    </div>

    <div class="section card weather-card" style="max-width:520px;margin:0 auto;text-align:left;" id="weather-box">
      <div style="color:var(--ink-soft);">Chargement de la météo…</div>
    </div>
    <p class="weather-note" style="max-width:520px;margin:0 auto;">Peu importe la météo dehors, j'espère qu'il fera toujours un peu plus beau dans ton cœur.</p>

    <div class="section">
      <div class="section-title" style="justify-content:center;"><h2 style="font-size:1rem;color:var(--ink-soft);font-family:var(--font-body);font-weight:600;letter-spacing:.04em;text-transform:uppercase;">Explorer notre univers</h2></div>
      <div class="page-card-grid" id="page-card-grid"></div>
    </div>
  </div>`);

  // Citation du jour (manuelle si définie, sinon automatique)
  const quote = D.citationManuelle || D.citations[indexOfDay(D.citations.length)];
  page.querySelector('#quote-of-day').textContent = `« ${quote} »`;

  // Bouton câlin → phrase aléatoire dans une modale
  page.querySelector('#btn-hug').addEventListener('click', () => {
    openModal({ glyph: '🤍', bodyHtml: `<p class="modal-text">${escapeHtml(pick(D.phrasesCalin))}</p>` });
  });

  // Compteur "depuis notre dernier câlin"
  page.querySelector('#derniere-rencontre-label').textContent =
    `Depuis le ${new Date(D.derniereRencontre).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  mountCounter(page.querySelector('.duo-card'));

  // Widget distance
  const dist = D.distanceCouple;
  page.querySelector('#distance-widget').innerHTML = `
    <div class="duo-card-title">La distance entre nous 🤍</div>
    <div class="distance-row">
      <div class="distance-point">
        <img src="${dist.avatarA}" alt="" class="distance-avatar">
        <span>${escapeHtml(dist.villeA)}</span>
      </div>
      <div class="distance-line">
        <span class="distance-heart">♥</span>
      </div>
      <div class="distance-point">
        <img src="${dist.avatarB}" alt="" class="distance-avatar">
        <span>${escapeHtml(dist.villeB)}</span>
      </div>
    </div>
    <div class="distance-km">≈ ${dist.km} km</div>
    <p class="distance-note">Quelques kilomètres, mais toujours tout près dans mon cœur.</p>
  `;

  // Météo
  loadWeather(page.querySelector('#weather-box'));

  // Carrousel de photos
  if (D.reglages.carrouselAccueil?.length) mountCarousel(page);

  // Widgets compacts "pour rire" — s'affichent en petites tuiles carrées.
  // Ce qui apparaît ici (et dans quel ordre) se règle dans data.js,
  // section "widgetsAmusants".
  const FUN_WIDGETS = {
    envie:      { emoji: '💬', label: 'Une envie',            onClick: openEnvieWidget },
    meteo:      { emoji: '🌤️', label: 'Météo',                 onClick: openWeatherWidget },
    toilettes:  { emoji: '🚽', label: 'Compteur toilettes',   onClick: openToiletCounter },
  };
  const widgetKeys = D.reglages.widgetsAmusants || [];
  page.querySelector('#widget-grid').innerHTML = widgetKeys
    .map(key => FUN_WIDGETS[key] ? { ...FUN_WIDGETS[key], key } : null)
    .filter(Boolean)
    .map(w => `<button class="widget-tile" data-fun="${w.key}" type="button"><span class="widget-icon">${w.emoji}</span><span class="widget-label">${escapeHtml(w.label)}</span></button>`)
    .join('');
  page.querySelectorAll('[data-fun]').forEach(btn => {
    btn.addEventListener('click', () => FUN_WIDGETS[btn.dataset.fun].onClick());
  });

  // Cartes des pages — toutes les pages du site (ROUTES, sauf l'accueil
  // lui-même), avec icône, titre et petite description, façon vitrine.
  page.querySelector('#page-card-grid').innerHTML = ROUTES
    .filter(r => r.path !== 'accueil')
    .map(r => `
      <a class="page-card" href="#/${r.path}">
        <span class="page-card-icon">${r.emoji}</span>
        <h3>${escapeHtml(r.label)}</h3>
        <p>${escapeHtml(r.desc || '')}</p>
      </a>`)
    .join('');

  // Petit panneau du jour, toujours visible (pas besoin de cliquer) —
  // le compteur ne se réinitialise jamais : chaque jour garde son propre
  // total, l'historique complet reste dans le navigateur.
  const CACA_KEY = 'compteur-toilettes-jours';
  const todayKey = () => new Date().toISOString().slice(0, 10);
  function bumpCaca(personne) {
    const data = Store.get(CACA_KEY, {});
    const jour = todayKey();
    data[jour] = data[jour] || { lorvencia: 0, ethan: 0 };
    data[jour][personne]++;
    Store.set(CACA_KEY, data);
    paintCaca();
  }
  function paintCaca() {
    const data = Store.get(CACA_KEY, {});
    const today = data[todayKey()] || { lorvencia: 0, ethan: 0 };
    page.querySelector('#caca-lorvencia-n').textContent = today.lorvencia;
    page.querySelector('#caca-ethan-n').textContent = today.ethan;
  }
  paintCaca();
  page.querySelector('#caca-lorvencia').addEventListener('click', () => bumpCaca('lorvencia'));
  page.querySelector('#caca-ethan').addEventListener('click', () => bumpCaca('ethan'));

  // Bouton rapide Uber Eats — envoie directement le message par WhatsApp,
  // sans passer par la fenêtre "Une envie".
  page.querySelector('#btn-uber-quick').addEventListener('click', () => {
    const preset = (D.envies || []).find(e => /uber\s*eats/i.test(e.label)) || { message: "J'ai envie d'un Uber Eats ce soir 🍔" };
    const numero = (D.reglages.telephoneContact || '').replace(/[^\d+]/g, '');
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(preset.message)}`, '_blank');
  });

  return page;
}

/* --- "Une envie" : message rapide envoyé par WhatsApp / SMS / email ------
   iOS et Android n'utilisent pas exactement le même format pour les liens
   "sms:" (Android veut un "?" avant "body=", iOS veut un "&"). On détecte
   la plateforme pour éviter que le message n'apparaisse pas prérempli. */
function isIOS() { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

/* ======================================================================
   JEUX EN LIGNE — infrastructure partagée par les mini-jeux qui ont
   besoin de synchroniser deux appareils (réutilise la même base Firebase
   que le Puissance 4).
   ====================================================================== */

// Ouvre (ou réutilise) la connexion Firebase. Renvoie null si la config
// n'a pas encore été faite (voir README, section Puissance 4).
function firebaseDB() {
  if (!D.firebase?.apiKey) return null;
  if (!window._fbApp) window._fbApp = firebase.initializeApp(D.firebase);
  return firebase.database();
}
function jeuxCle() { return D.puissance4Cle || 'notre-puissance4'; }

// Identité partagée : "ethan" ou "lorvencia", choisie une fois par
// appareil puis mémorisée. Réutilisée par tous les jeux à deux.
function getIdentite(callback) {
  const stockee = Store.get('mon-identite', null);
  if (stockee) return callback(stockee);
  openModal({
    glyph: '🤍',
    bodyHtml: `
      <h3 style="margin-bottom:14px;">Juste pour savoir qui tu es</h3>
      <p style="margin-bottom:16px;color:var(--ink-soft);font-size:.9rem;">Cette réponse est mémorisée sur cet appareil, tu n'auras plus à la redonner.</p>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button class="btn btn-primary btn-sm" id="id-ethan">Je suis Ethan</button>
        <button class="btn btn-primary btn-sm" id="id-lorvencia">Je suis Lorvencia</button>
      </div>`,
  });
  $('#id-ethan')?.addEventListener('click', () => { Store.set('mon-identite', 'ethan'); closeModal(); callback('ethan'); });
  $('#id-lorvencia')?.addEventListener('click', () => { Store.set('mon-identite', 'lorvencia'); closeModal(); callback('lorvencia'); });
}
function todayISO() { return new Date().toISOString().slice(0, 10); }

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

/* --- Mon vlog (épisodes vidéo/photo du jour, du plus récent au plus ancien) --*/
function renderVlog() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Un bout de ma journée, pour toi</span><h1>Mon vlog</h1><p>Un petit épisode déposé de temps en temps, pour que tu te sentes un peu avec moi.</p></div>
    <div class="grid" id="vlog-grid"></div>
  </div>`);
  const grid = page.querySelector('#vlog-grid');
  const sorted = [...D.vlog].sort((a, b) => b.date.localeCompare(a.date));

  if (!sorted.length) {
    grid.innerHTML = emptyState('📹', "Pas encore d'épisode, ajoute-en dans js/data.js, section « vlog ».");
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
        <span class="place-category">${escapeHtml(l.categorie)}</span>
        <p>${escapeHtml(l.description)}</p>
        ${l.note ? `<div class="place-meta"><span>⭐ ${l.note}/5</span></div>` : ''}
        <div class="place-actions">
          <a class="btn btn-ghost btn-sm" href="${l.carteLien}" target="_blank" rel="noopener">📍 Maps</a>
          ${l.lienArticle ? `<a class="btn btn-ghost btn-sm" href="${l.lienArticle}" target="_blank" rel="noopener">📖 En savoir plus</a>` : ''}
          <button class="btn btn-ghost btn-sm" data-locate="${l.id}">🗺️ Sur la carte</button>
        </div>
      </div>`).join('') : emptyState('🗺️', "Pas encore de lieu, ajoute-les dans js/data.js, section « lieuxLille ».");

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
      ? `${placed} lieu${placed > 1 ? 'x' : ''} sur la carte, clique un repère pour plus d'infos.`
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
      `${i + 1}. ${r.nom || 'Article'}${r.lien ? `, ${r.lien}` : ''}${r.taille ? ` (taille : ${r.taille})` : ''}${r.notes ? `, ${r.notes}` : ''}`
    ).join('\n');
  }

  page.querySelector('#tenue-send').addEventListener('click', () => {
    const message = buildMessage();
    const feedback = page.querySelector('#tenue-feedback');
    if (!message) { feedback.textContent = "Ajoute au moins un article (un nom ou un lien) avant d'envoyer."; return; }
    const subject = encodeURIComponent('Ma tenue de sport 🏋️');
    const body = encodeURIComponent(`Voici ce que j'ai choisi pour toi :\n\n${message}\n`);
    window.location.href = `mailto:${D.reglages.emailContact}?subject=${subject}&body=${body}`;
    feedback.textContent = "Ton application mail va s'ouvrir avec tout prérempli, il ne reste qu'à envoyer.";
  });

  page.querySelector('#tenue-copy').addEventListener('click', async () => {
    const message = buildMessage();
    const feedback = page.querySelector('#tenue-feedback');
    if (!message) { feedback.textContent = "Ajoute au moins un article avant de copier."; return; }
    try {
      await navigator.clipboard.writeText(message);
      feedback.textContent = "Copié ! Tu peux le coller où tu veux (SMS, WhatsApp…).";
    } catch {
      feedback.textContent = "Impossible de copier automatiquement, sélectionne le texte manuellement.";
    }
  });

  return page;
}

/* --- Films / séries ----------------------------------------------------------*/
function renderYoutube() {
  const page = el(`<div class="page">
    <div class="page-header">
      <span class="eyebrow">Nos vidéos</span>
      <h1><span class="youtube-badge" aria-hidden="true">▶</span> YouTube</h1>
      <p>Clique une miniature, ça s'ouvre directement.</p>
    </div>
    <div class="grid" id="youtube-grid"></div>
  </div>`);
  const grid = page.querySelector('#youtube-grid');
  const videos = D.youtube || [];
  grid.innerHTML = videos.length ? videos.map((v, i) => `
    <button class="card card-link youtube-card" style="text-align:left;width:100%;border:none;" data-i="${i}">
      <div class="card-cover youtube-thumb">
        <img src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg" alt="" loading="lazy">
        <span class="youtube-play" aria-hidden="true">▶</span>
      </div>
    </button>`).join('') : emptyState('▶️', "Pas encore de vidéo, ajoute des liens YouTube dans js/data.js, section « youtube ».");

  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-i]'); if (!btn) return;
    const v = videos[btn.dataset.i];
    openModal({
      glyph: '▶️',
      bodyHtml: `<iframe class="embed-frame" src="https://www.youtube.com/embed/${v.id}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`,
    });
  });
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

/* ======================================================================
   PUISSANCE 4 EN LIGNE, jeu en temps réel via Firebase Realtime
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
  const fbConf = D.firebase;
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Pour jouer, tous les deux</span><h1>Puissance 4</h1></div>
    <div id="c4-root" style="max-width:420px;margin:0 auto;text-align:center;"></div>
  </div>`);
  const root = page.querySelector('#c4-root');

  if (!fbConf.apiKey) {
    root.innerHTML = emptyState('🔴', "Il manque une dernière étape de configuration (gratuite, ~10 min) pour activer le jeu en temps réel, regarde la section « Puissance 4 en ligne » du README.");
    return page;
  }

  // Initialise Firebase une seule fois, même si on revient plusieurs fois sur cette page
  if (!window._fbApp) {
    window._fbApp = firebase.initializeApp(fbConf);
  }
  const db = firebase.database();
  const cle = D.puissance4Cle || 'notre-puissance4';
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

  // Rejoint la partie (et la crée si besoin) en une seule opération, pour
  // éviter que deux connexions simultanées ne se marchent sur les pieds.
  function joinGame() {
    partieRef.transaction(partie => {
      partie = partie || { grille: c4EmptyGrid(), tour: 'rouge', gagnant: null, joueurs: { rouge: null, jaune: null } };
      partie.joueurs = partie.joueurs || { rouge: null, jaune: null };
      if (partie.joueurs.rouge === deviceId || partie.joueurs.jaune === deviceId) return partie;
      if (!partie.joueurs.rouge) { partie.joueurs.rouge = deviceId; return partie; }
      if (!partie.joueurs.jaune) { partie.joueurs.jaune = deviceId; return partie; }
      return partie; // déjà 2 joueurs pris : on n'y touche pas, on sera spectateur
    }, (err, committed, snap) => {
      const partie = snap ? snap.val() : null;
      const joueurs = partie?.joueurs;
      if (joueurs?.rouge === deviceId) monRole = 'rouge';
      else if (joueurs?.jaune === deviceId) monRole = 'jaune';
      else monRole = null;
      // Reforce un affichage à jour : le tout premier passage de .on('value')
      // peut arriver avant que monRole ne soit connu.
      if (partie) paint(partie);
    });
  }
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

/* --- Les petites surprises (enveloppes) ----------------------------------------*/
/* ======================================================================
   NOS PETITS JEUX
   ====================================================================== */
const JEUX_LISTE = [
  { id: 'question-du-jour', icone: '💬', titre: 'Question du jour',           texte: 'Une par jour, révélée à deux' },
  { id: 'tu-preferes',   icone: '↔️', titre: 'Tu préfères ?',               texte: 'Match parfait ou pas ?' },
  { id: 'qui-connait',   icone: '🧠', titre: 'Qui connaît le mieux l\'autre ?', texte: '5 questions, un score sur 5' },
  { id: 'devine-reponse', icone: '🔮', titre: 'Devine ma réponse',           texte: 'Un secret, une devinette' },
  { id: 'roue',          icone: '🎡', titre: 'La roue de nos envies',       texte: 'Fais tourner, on suit ce qui sort' },
  { id: 'trone',         icone: '👑', titre: "Le Trône d'Or",               texte: 'Pour rire, sans se prendre au sérieux' },
  { id: 'compatibilite', icone: '💞', titre: 'Notre compatibilité du jour', texte: '100% pour rire, amour 100% vrai' },
];

function renderJeuxListe() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Pour jouer, tous les deux</span><h1>Nos petits jeux</h1></div>
    <div class="grid" id="jeux-grid"></div>
    <p style="text-align:center;color:var(--ink-soft);font-size:.85rem;margin-top:24px;">D'autres jeux (à deux, en direct) arrivent bientôt ✨</p>
  </div>`);
  page.querySelector('#jeux-grid').innerHTML = JEUX_LISTE.map(j => `
    <a class="card envelope-card card-link" href="#/jeux/${j.id}">
      <span class="glyph">${j.icone}</span>
      <h3>${escapeHtml(j.titre)}</h3>
      <p>${escapeHtml(j.texte)}</p>
    </a>`).join('');
  return page;
}

function renderJeuxDetail(sub) {
  if (sub === 'question-du-jour') return renderJeuQuestionDuJour();
  if (sub === 'tu-preferes') return renderJeuTuPreferes();
  if (sub === 'qui-connait') return renderJeuQuiConnait();
  if (sub === 'devine-reponse') return renderJeuDevineReponse();
  if (sub === 'roue') return renderJeuRoue();
  if (sub === 'trone') return renderJeuTrone();
  if (sub === 'compatibilite') return renderJeuCompatibilite();
  return renderJeuxListe();
}

function jeuxBackLink() {
  return `<a href="#/jeux" class="btn btn-ghost btn-sm" style="margin-bottom:24px;">← Retour aux jeux</a>`;
}

/* --- Jeu : Devine ma réponse (synchronisé via Firebase) --------------------- */
function renderJeuDevineReponse() {
  const page = el(`<div class="page">
    ${jeuxBackLink()}
    <div class="page-header"><span class="eyebrow">🔮</span><h1>Devine ma réponse</h1></div>
    <div id="dr-root" style="max-width:480px;margin:0 auto;text-align:center;"></div>
  </div>`);
  const root = page.querySelector('#dr-root');
  const db = firebaseDB();
  if (!db) {
    root.innerHTML = emptyState('🔮', "Il manque la configuration Firebase (déjà utilisée pour le Puissance 4) pour activer ce jeu, regarde le README.");
    return page;
  }

  const jour = todayISO();
  const banque = D.jeux.devineReponse;
  const graineJour = Array.from(jour).reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
  const question = banque[Math.abs(graineJour) % banque.length];
  // Le rôle "répondant" alterne chaque jour, pour que ce soit équitable
  const repondant = Math.abs(graineJour) % 2 === 0 ? 'ethan' : 'lorvencia';
  const ref = db.ref(`${jeuxCle()}/devineReponse/${jour}`);
  const scoreRef = db.ref(`${jeuxCle()}/devineReponse/scoreCumulatif`);

  root.innerHTML = `<p style="color:var(--ink-soft);">Connexion…</p>`;

  getIdentite(moi => {
    const autre = moi === 'ethan' ? 'lorvencia' : 'ethan';
    const jeSuisRepondant = moi === repondant;
    const nomRepondant = repondant === 'ethan' ? 'Ethan' : 'Lorvencia';

    let scoreCumule = { ethan: 0, lorvencia: 0 };
    scoreRef.on('value', snap => { scoreCumule = snap.val() || { ethan: 0, lorvencia: 0 }; });

    function paint(val) {
      val = val || {};

      if (!val.reponse) {
        if (jeSuisRepondant) {
          root.innerHTML = `
            <div class="card">
              <p style="font-weight:600;margin-bottom:14px;">${escapeHtml(question)}</p>
              <input type="text" id="dr-reponse" style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--border-soft);font-family:var(--font-body);text-align:center;" placeholder="Ta réponse, en secret">
              <button class="btn btn-primary btn-sm" id="dr-envoyer" style="margin-top:12px;width:100%;">Valider en secret</button>
            </div>`;
          root.querySelector('#dr-envoyer').addEventListener('click', () => {
            const texte = root.querySelector('#dr-reponse').value.trim();
            if (!texte) return;
            ref.child('reponse').set(texte);
          });
        } else {
          root.innerHTML = `<div class="card"><p>${nomRepondant} n'a pas encore répondu en secret. Reviens un peu plus tard 🤍</p></div>`;
        }
        return;
      }

      if (jeSuisRepondant) {
        if (!val.correct && val.correct !== false) {
          if (!val.deviné) {
            root.innerHTML = `<div class="card"><p>Ta réponse secrète est enregistrée. En attente que l'autre devine…</p></div>`;
          } else {
            root.innerHTML = `
              <div class="card">
                <p style="font-weight:600;">${escapeHtml(question)}</p>
                <p style="margin:10px 0;"><strong>Ta réponse :</strong> ${escapeHtml(val.reponse)}</p>
                <p style="margin-bottom:14px;"><strong>Sa devinette :</strong> ${escapeHtml(val.deviné)}</p>
                <p style="font-size:.85rem;color:var(--ink-soft);margin-bottom:10px;">A-t-il/elle trouvé ?</p>
                <div style="display:flex;gap:10px;justify-content:center;">
                  <button class="btn btn-primary btn-sm" id="dr-correct">✅ Trouvé</button>
                  <button class="btn btn-ghost btn-sm" id="dr-incorrect">❌ Pas cette fois</button>
                </div>
              </div>`;
            root.querySelector('#dr-correct').addEventListener('click', () => {
              ref.child('correct').set(true);
              scoreRef.child(autre).transaction(n => (n || 0) + 1);
            });
            root.querySelector('#dr-incorrect').addEventListener('click', () => ref.child('correct').set(false));
          }
        } else {
          afficherResultatFinal();
        }
      } else {
        if (!val.deviné) {
          root.innerHTML = `
            <div class="card">
              <p style="font-weight:600;margin-bottom:4px;">${escapeHtml(question)}</p>
              <p style="color:var(--ink-soft);font-size:.85rem;margin-bottom:14px;">${nomRepondant} a répondu en secret. Devine sa réponse !</p>
              <input type="text" id="dr-devine" style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--border-soft);font-family:var(--font-body);text-align:center;">
              <button class="btn btn-primary btn-sm" id="dr-envoyer-devine" style="margin-top:12px;width:100%;">Valider ma devinette</button>
            </div>`;
          root.querySelector('#dr-envoyer-devine').addEventListener('click', () => {
            const texte = root.querySelector('#dr-devine').value.trim();
            if (!texte) return;
            ref.child('deviné').set(texte);
          });
        } else if (val.correct === undefined) {
          root.innerHTML = `<div class="card"><p>Ta devinette est envoyée. ${nomRepondant} doit encore dire si c'était juste 🤍</p></div>`;
        } else {
          afficherResultatFinal();
        }
      }

      function afficherResultatFinal() {
        root.innerHTML = `
          <div class="card">
            <p style="font-weight:600;">${escapeHtml(question)}</p>
            <p style="margin:10px 0;"><strong>Réponse :</strong> ${escapeHtml(val.reponse)}</p>
            <p style="margin-bottom:10px;"><strong>Devinette :</strong> ${escapeHtml(val.deviné)}</p>
            <div style="font-family:var(--font-display);font-size:1.2rem;color:var(--bordeaux);font-weight:700;">
              ${val.correct ? '🎉 Deviné !' : 'Pas cette fois, la prochaine sera la bonne'}
            </div>
            <p style="font-size:.8rem;color:var(--ink-soft);margin-top:12px;">Score cumulé : Ethan ${scoreCumule.ethan || 0} · Lorvencia ${scoreCumule.lorvencia || 0}</p>
          </div>`;
      }
    }
    ref.on('value', snap => paint(snap.val()));
  });

  return page;
}

/* --- Jeu : Qui connaît le mieux l'autre ? (synchronisé via Firebase) ------- */
function renderJeuQuiConnait() {
  const page = el(`<div class="page">
    ${jeuxBackLink()}
    <div class="page-header"><span class="eyebrow">🧠</span><h1>Qui connaît le mieux l'autre ?</h1></div>
    <div id="qc-root" style="max-width:480px;margin:0 auto;"></div>
  </div>`);
  const root = page.querySelector('#qc-root');
  const db = firebaseDB();
  if (!db) {
    root.innerHTML = emptyState('🧠', "Il manque la configuration Firebase (déjà utilisée pour le Puissance 4) pour activer ce jeu, regarde le README.");
    return page;
  }

  const jour = todayISO();
  const banque = D.jeux.quiConnait;
  // Tire 5 questions différentes, choisies de façon stable pour la journée
  const graineJour = Array.from(jour).reduce((h, c) => h * 31 + c.charCodeAt(0), 0);
  const indices = [];
  for (let i = 0; indices.length < Math.min(5, banque.length); i++) {
    const idx = Math.abs(graineJour + i * 17) % banque.length;
    if (!indices.includes(idx)) indices.push(idx);
  }
  const questions = indices.map(i => banque[i]);
  const ref = db.ref(`${jeuxCle()}/quiConnait/${jour}`);

  root.innerHTML = `<p style="color:var(--ink-soft);text-align:center;">Connexion…</p>`;

  function formulaireReponses(titre, sousTexte, onValider) {
    root.innerHTML = `
      <div class="card">
        <p style="font-weight:600;margin-bottom:4px;">${titre}</p>
        <p style="color:var(--ink-soft);font-size:.85rem;margin-bottom:14px;">${sousTexte}</p>
        ${questions.map((q, i) => `
          <div style="margin-bottom:12px;text-align:left;">
            <label style="font-size:.88rem;font-weight:600;display:block;margin-bottom:4px;">${escapeHtml(q)}</label>
            <input type="text" data-qi="${i}" style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid var(--border-soft);font-family:var(--font-body);">
          </div>`).join('')}
        <button class="btn btn-primary btn-sm" id="qc-valider" style="width:100%;margin-top:8px;">Valider mes réponses</button>
      </div>`;
    root.querySelector('#qc-valider').addEventListener('click', () => {
      const reponses = questions.map((_, i) => root.querySelector(`[data-qi="${i}"]`).value.trim() || '(vide)');
      onValider(reponses);
    });
  }

  getIdentite(moi => {
    const autre = moi === 'ethan' ? 'lorvencia' : 'ethan';

    function paint(val) {
      val = val || {};
      const soi = val.soi || {};
      const devine = val.devine || {};
      const score = val.score || {};

      if (!soi[moi]) {
        formulaireReponses('D\'abord, réponds pour toi-même', 'Sois honnête, ça sert de base au jeu.',
          (reponses) => ref.child(`soi/${moi}`).set(reponses));
      } else if (!devine[moi]) {
        formulaireReponses('Maintenant, devine pour l\'autre', `Qu'est-ce que ${autre === 'ethan' ? 'Ethan' : 'Lorvencia'} répondrait ?`,
          (reponses) => ref.child(`devine/${moi}`).set(reponses));
      } else if (!soi[autre] || !devine[autre]) {
        root.innerHTML = `<div class="card" style="text-align:center;"><p>Tes réponses sont enregistrées. En attente que l'autre termine aussi 🤍</p></div>`;
      } else if (score[moi] === undefined) {
        root.innerHTML = `
          <div class="card">
            <p style="font-weight:600;margin-bottom:14px;text-align:center;">Coche les fois où tu as deviné juste</p>
            ${questions.map((q, i) => `
              <label style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;text-align:left;cursor:pointer;">
                <input type="checkbox" data-score-i="${i}" style="margin-top:4px;">
                <span style="font-size:.88rem;">
                  <strong>${escapeHtml(q)}</strong><br>
                  Tu as deviné : ${escapeHtml(devine[moi][i])}<br>
                  Sa vraie réponse : ${escapeHtml(soi[autre][i])}
                </span>
              </label>`).join('')}
            <button class="btn btn-primary btn-sm" id="qc-voir-score" style="width:100%;">Voir mon score</button>
          </div>`;
        root.querySelector('#qc-voir-score').addEventListener('click', () => {
          const n = root.querySelectorAll('[data-score-i]:checked').length;
          ref.child(`score/${moi}`).set(n);
        });
      } else {
        const n = score[moi];
        const messages = {
          0: "Il va falloir mener une petite enquête amoureuse.",
          1: "Il va falloir mener une petite enquête amoureuse.",
          2: "Tu la connais déjà très bien, mais elle garde quelques mystères.",
          3: "Tu la connais déjà très bien, mais elle garde quelques mystères.",
          4: "Presque imbattable !",
          5: "Télépathie de couple débloquée.",
        };
        root.innerHTML = `
          <div class="card" style="text-align:center;">
            <div style="font-family:var(--font-display);font-size:2.4rem;color:var(--bordeaux);font-weight:800;">${n}/5</div>
            <p style="margin-top:8px;">${messages[n]}</p>
          </div>`;
        if (n === 5 && !root.dataset.confettiJoue) {
          root.dataset.confettiJoue = '1';
          if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            for (let i = 0; i < 24; i++) {
              const piece = document.createElement('span');
              piece.className = 'confetti-piece';
              piece.style.left = Math.random() * 100 + '%';
              piece.style.background = ['var(--bordeaux)', 'var(--gold)', 'var(--blush)'][i % 3];
              piece.style.animationDelay = (Math.random() * 0.3) + 's';
              document.body.appendChild(piece);
              setTimeout(() => piece.remove(), 1800);
            }
          }
        }
      }
    }
    ref.on('value', snap => paint(snap.val()));
  });

  return page;
}

/* --- Jeu : Tu préfères ? (synchronisé via Firebase) ------------------------- */
function renderJeuTuPreferes() {
  const page = el(`<div class="page">
    ${jeuxBackLink()}
    <div class="page-header"><span class="eyebrow">↔️</span><h1>Tu préfères ?</h1></div>
    <div id="tp-root" style="max-width:480px;margin:0 auto;text-align:center;"></div>
  </div>`);
  const root = page.querySelector('#tp-root');
  const db = firebaseDB();
  if (!db) {
    root.innerHTML = emptyState('↔️', "Il manque la configuration Firebase (déjà utilisée pour le Puissance 4) pour activer ce jeu, regarde le README.");
    return page;
  }

  const jour = todayISO();
  const paires = D.jeux.tuPreferes;
  const index = Math.abs(Array.from(jour).reduce((h, c) => h * 31 + c.charCodeAt(0), 0)) % paires.length;
  const paire = paires[index];
  const ref = db.ref(`${jeuxCle()}/tuPreferes/${jour}`);

  root.innerHTML = `<p style="color:var(--ink-soft);">Connexion…</p>`;

  getIdentite(moi => {
    const autre = moi === 'ethan' ? 'lorvencia' : 'ethan';

    function paint(val) {
      val = val || {};
      const choix = val.choix || {};
      const monChoix = choix[moi];
      const sonChoix = choix[autre];

      if (!monChoix) {
        root.innerHTML = `
          <div class="card">
            <p style="font-weight:600;margin-bottom:16px;">Tu préfères…</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <button class="btn btn-ghost" data-choix="a">${escapeHtml(paire.a)}</button>
              <button class="btn btn-ghost" data-choix="b">${escapeHtml(paire.b)}</button>
            </div>
          </div>`;
        root.querySelectorAll('[data-choix]').forEach(btn => btn.addEventListener('click', () => {
          ref.child(`choix/${moi}`).set(btn.dataset.choix);
        }));
      } else if (!sonChoix) {
        root.innerHTML = `
          <div class="card">
            <p style="font-weight:600;">Ton choix : ${escapeHtml(monChoix === 'a' ? paire.a : paire.b)}</p>
            <p style="color:var(--ink-soft);font-size:.9rem;margin-top:10px;">En attente de l'autre…</p>
          </div>`;
      } else {
        const match = monChoix === sonChoix;
        root.innerHTML = `
          <div class="card ${match ? 'fade-rise' : ''}">
            <div class="place-meta" style="justify-content:center;margin-bottom:10px;">
              <span>Toi : ${escapeHtml(monChoix === 'a' ? paire.a : paire.b)}</span>
            </div>
            <div class="place-meta" style="justify-content:center;margin-bottom:14px;">
              <span>${autre === 'ethan' ? 'Ethan' : 'Lorvencia'} : ${escapeHtml(sonChoix === 'a' ? paire.a : paire.b)}</span>
            </div>
            <div style="font-family:var(--font-display);font-size:1.3rem;color:var(--bordeaux);font-weight:700;">
              ${match ? '💞 Match parfait' : '🌈 Deux envies, deux fois plus d\'idées'}
            </div>
          </div>`;
      }
    }
    ref.on('value', snap => paint(snap.val()));
  });

  return page;
}

/* --- Jeu : Question du jour (synchronisé via Firebase) --------------------- */
function renderJeuQuestionDuJour() {
  const page = el(`<div class="page">
    ${jeuxBackLink()}
    <div class="page-header"><span class="eyebrow">💬</span><h1>Question du jour</h1></div>
    <div id="qdj-root" style="max-width:480px;margin:0 auto;text-align:center;"></div>
  </div>`);
  const root = page.querySelector('#qdj-root');
  const db = firebaseDB();
  if (!db) {
    root.innerHTML = emptyState('💬', "Il manque la configuration Firebase (déjà utilisée pour le Puissance 4) pour activer ce jeu, regarde le README.");
    return page;
  }

  const jour = todayISO();
  const questions = D.jeux.questionsDuJour;
  const index = Math.abs(Array.from(jour).reduce((h, c) => h * 31 + c.charCodeAt(0), 0)) % questions.length;
  const question = questions[index];
  const ref = db.ref(`${jeuxCle()}/questionJour/${jour}`);

  root.innerHTML = `<p style="color:var(--ink-soft);">Connexion…</p>`;

  getIdentite(moi => {
    const autre = moi === 'ethan' ? 'lorvencia' : 'ethan';

    function paint(val) {
      val = val || {};
      const reponses = val.reponses || {};
      const coeurs = val.coeurs || {};
      const mesReponses = reponses[moi];
      const sesReponses = reponses[autre];

      if (!mesReponses) {
        root.innerHTML = `
          <div class="card">
            <p style="font-weight:600;margin-bottom:14px;">${escapeHtml(question)}</p>
            <textarea id="qdj-texte" rows="3" style="width:100%;border-radius:14px;border:1px solid var(--border-soft);padding:12px;font-family:var(--font-body);"></textarea>
            <button class="btn btn-primary btn-sm" id="qdj-envoyer" style="margin-top:12px;">Envoyer ma réponse</button>
          </div>`;
        root.querySelector('#qdj-envoyer').addEventListener('click', () => {
          const texte = root.querySelector('#qdj-texte').value.trim();
          if (!texte) return;
          ref.child(`reponses/${moi}`).set(texte);
        });
      } else if (!sesReponses) {
        root.innerHTML = `
          <div class="card">
            <p style="font-weight:600;margin-bottom:10px;">${escapeHtml(question)}</p>
            <p style="color:var(--ink-soft);font-size:.9rem;">Ta réponse est envoyée. On attend que l'autre réponde aussi pour tout révéler 🤍</p>
          </div>`;
      } else {
        root.innerHTML = `
          <div class="card fade-rise">
            <p style="font-weight:600;margin-bottom:14px;">${escapeHtml(question)}</p>
            <div class="qdj-reponse">
              <div class="qdj-nom">Toi</div>
              <p>${escapeHtml(mesReponses)}</p>
            </div>
            <div class="qdj-reponse">
              <div class="qdj-nom">${autre === 'ethan' ? 'Ethan' : 'Lorvencia'}
                <button class="fav-btn ${coeurs[autre] ? 'active' : ''}" id="qdj-coeur">★</button>
              </div>
              <p>${escapeHtml(sesReponses)}</p>
            </div>
          </div>`;
        root.querySelector('#qdj-coeur')?.addEventListener('click', () => {
          ref.child(`coeurs/${autre}`).set(!coeurs[autre]);
        });
      }
    }
    ref.on('value', snap => paint(snap.val()));
  });

  return page;
}

/* --- Jeu 1 : la roue de nos envies ---------------------------------------- */
function renderJeuRoue() {
  const activites = D.jeux.roue;
  const page = el(`<div class="page">
    ${jeuxBackLink()}
    <div class="page-header"><span class="eyebrow">🎡</span><h1>La roue de nos envies</h1></div>
    <div class="roue-wrap">
      <div class="roue-disque" id="roue-disque"></div>
      <div class="roue-pointeur">▼</div>
    </div>
    <div style="text-align:center;">
      <button class="btn btn-primary" id="btn-tourner">Tourner la roue</button>
    </div>
    <div id="roue-resultat" style="max-width:420px;margin:20px auto 0;"></div>
  </div>`);

  const disque = page.querySelector('#roue-disque');
  let tours = 0;
  page.querySelector('#btn-tourner').addEventListener('click', () => {
    const choix = pick(activites);
    const reduitMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    tours++;
    if (!reduitMotion) {
      disque.style.transform = `rotate(${tours * 1080 + Math.floor(Math.random() * 360)}deg)`;
    }
    const afficher = () => {
      page.querySelector('#roue-resultat').innerHTML = `
        <div class="card" style="text-align:center;">
          <div style="font-size:1.3rem;margin-bottom:10px;">${escapeHtml(choix)}</div>
          <button class="btn btn-primary btn-sm" id="btn-on-le-fait">On le fait 🤍</button>
        </div>`;
      page.querySelector('#btn-on-le-fait')?.addEventListener('click', () => {
        openModal({ glyph: '🎡', bodyHtml: `<p class="modal-text">${escapeHtml(choix)}, décidé !</p>` });
      });
    };
    reduitMotion ? afficher() : setTimeout(afficher, 900);
  });
  return page;
}

/* --- Jeu 2 : Le Trône d'Or -------------------------------------------------
   Réutilise les mêmes données que le petit panneau "Aujourd'hui" de
   l'accueil (même clé de stockage), pour que les deux restent synchronisés
   sur cet appareil. */
function renderJeuTrone() {
  const CACA_KEY = 'compteur-toilettes-jours';
  const SON_KEY = 'trone-sons-actifs';
  const todayKey = () => new Date().toISOString().slice(0, 10);

  const page = el(`<div class="page">
    ${jeuxBackLink()}
    <div class="page-header"><span class="eyebrow">👑</span><h1>Le Trône d'Or</h1><p>Pour rire, sans se prendre au sérieux.</p></div>
    <div class="card trone-card" style="max-width:480px;margin:0 auto;text-align:center;">
      <div class="trone-couronne" id="trone-couronne"></div>
      <div class="daily-panel-row" style="margin:14px 0;">
        <button class="daily-btn" id="trone-lorvencia" type="button">Lorvencia <span class="daily-count" id="trone-lorvencia-n">0</span></button>
        <button class="daily-btn" id="trone-ethan" type="button">Ethan <span class="daily-count" id="trone-ethan-n">0</span></button>
      </div>
      <div class="trone-stats" id="trone-stats"></div>
      <div class="trone-trophees" id="trone-trophees"></div>
      <label class="trone-son-toggle"><input type="checkbox" id="trone-son"> 🔈 Activer les petits sons</label>
    </div>
  </div>`);

  function beep(freq = 440, duree = 0.12) {
    if (!Store.get(SON_KEY, false)) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duree);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duree);
    } catch {}
  }

  function confetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = ['var(--bordeaux)', 'var(--gold)', 'var(--blush)'][i % 3];
      piece.style.animationDelay = (Math.random() * 0.3) + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 1800);
    }
  }

  function getData() { return Store.get(CACA_KEY, {}); }

  function bump(personne) {
    const data = getData();
    const jour = todayKey();
    data[jour] = data[jour] || { lorvencia: 0, ethan: 0 };
    const ancienRecord = Math.max(0, ...Object.values(data).map(d => d[personne] || 0).filter((_, i, arr) => true));
    data[jour][personne]++;
    Store.set(CACA_KEY, data);
    beep(personne === 'lorvencia' ? 520 : 400);
    if (data[jour][personne] > ancienRecord) confetti();
    paint();
  }

  function paint() {
    const data = getData();
    const jours = Object.keys(data).sort();
    const today = data[todayKey()] || { lorvencia: 0, ethan: 0 };
    page.querySelector('#trone-lorvencia-n').textContent = today.lorvencia;
    page.querySelector('#trone-ethan-n').textContent = today.ethan;

    const total = { lorvencia: 0, ethan: 0 };
    let semaine = { lorvencia: 0, ethan: 0 };
    const septJours = new Set(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10);
    }));
    jours.forEach(j => {
      total.lorvencia += data[j].lorvencia || 0;
      total.ethan += data[j].ethan || 0;
      if (septJours.has(j)) { semaine.lorvencia += data[j].lorvencia || 0; semaine.ethan += data[j].ethan || 0; }
    });

    const leader = total.lorvencia === total.ethan ? null : (total.lorvencia > total.ethan ? 'Lorvencia' : 'Ethan');
    page.querySelector('#trone-couronne').innerHTML = leader
      ? `<span style="font-size:2.2rem;">👑</span><div style="font-weight:700;color:var(--bordeaux);">${leader} sur le trône</div>`
      : `<span style="font-size:2.2rem;">🤝</span><div style="font-weight:700;color:var(--bordeaux);">Égalité parfaite</div>`;

    // Série : nombre de jours consécutifs (en remontant depuis aujourd'hui) où les deux ont au moins 1
    let serie = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const j = data[key];
      if (j && j.lorvencia > 0 && j.ethan > 0) serie++; else break;
    }

    page.querySelector('#trone-stats').innerHTML = `
      <div class="place-meta" style="justify-content:center;">
        <span>📅 Cette semaine : Lorvencia ${semaine.lorvencia} · Ethan ${semaine.ethan}</span>
      </div>
      <div class="place-meta" style="justify-content:center;">
        <span>🏆 Total : Lorvencia ${total.lorvencia} · Ethan ${total.ethan}</span>
      </div>
      ${serie > 1 ? `<div class="place-meta" style="justify-content:center;"><span>🔥 Série en cours : ${serie} jours</span></div>` : ''}
    `;

    const trophees = [];
    if (leader) trophees.push(`👑 ${leader === 'Lorvencia' ? 'Reine' : 'Roi'} du trône`);
    if (Object.values(data).some(d => (d.lorvencia || 0) >= 2 || (d.ethan || 0) >= 2)) trophees.push('⚡ Double impact');
    if (Object.values(data).some(d => d.lorvencia > 0 && d.lorvencia === d.ethan)) trophees.push('🤝 Synchronisation parfaite');
    if (serie >= 3) trophees.push('🔥 La délivrance (3 jours de suite)');
    page.querySelector('#trone-trophees').innerHTML = trophees.length
      ? `<div class="place-meta" style="justify-content:center;flex-wrap:wrap;">${trophees.map(t => `<span class="place-category">${t}</span>`).join('')}</div>`
      : '';
  }

  paint();
  page.querySelector('#trone-lorvencia').addEventListener('click', () => bump('lorvencia'));
  page.querySelector('#trone-ethan').addEventListener('click', () => bump('ethan'));
  const sonCheckbox = page.querySelector('#trone-son');
  sonCheckbox.checked = Store.get(SON_KEY, false);
  sonCheckbox.addEventListener('change', () => Store.set(SON_KEY, sonCheckbox.checked));

  return page;
}

/* --- Jeu 3 : Notre compatibilité du jour ------------------------------------ */
function renderJeuCompatibilite() {
  const questions = D.jeux.compatibilite;
  const page = el(`<div class="page">
    ${jeuxBackLink()}
    <div class="page-header"><span class="eyebrow">💞</span><h1>Notre compatibilité du jour</h1></div>
    <div id="compat-quiz" style="max-width:480px;margin:0 auto;"></div>
  </div>`);

  const reponses = [];
  const zone = page.querySelector('#compat-quiz');

  function afficherQuestion(i) {
    if (i >= questions.length) return afficherResultat();
    const q = questions[i];
    zone.innerHTML = `
      <div class="card" style="text-align:center;">
        <p style="font-weight:600;margin-bottom:14px;">${escapeHtml(q.question)}</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${q.options.map((o, oi) => `<button class="btn btn-ghost" data-oi="${oi}">${escapeHtml(o)}</button>`).join('')}
        </div>
        <p style="margin-top:14px;color:var(--ink-soft);font-size:.8rem;">Question ${i + 1}/${questions.length}</p>
      </div>`;
    zone.querySelectorAll('[data-oi]').forEach(btn => btn.addEventListener('click', () => {
      reponses.push(parseInt(btn.dataset.oi, 10));
      afficherQuestion(i + 1);
    }));
  }

  function afficherResultat() {
    // Résultat pseudo-aléatoire mais stable pour la journée (même résultat si on la refait le même jour)
    const graine = todayKeySimple() + reponses.join('');
    let hash = 0;
    for (const c of graine) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
    const pourcentage = 70 + (hash % 31); // entre 70 et 100, toujours positif et sympa
    zone.innerHTML = `
      <div class="card" style="text-align:center;">
        <div style="font-family:var(--font-display);font-size:2.6rem;color:var(--bordeaux);font-weight:800;">${pourcentage}%</div>
        <p>de compatibilité aujourd'hui</p>
        <p style="font-size:.8rem;color:var(--ink-soft);margin-top:10px;">Résultat 100% pour rire, amour 100% véritable.</p>
        <button class="btn btn-ghost btn-sm" id="btn-rejouer" style="margin-top:12px;">Recommencer</button>
      </div>`;
    zone.querySelector('#btn-rejouer').addEventListener('click', () => { reponses.length = 0; afficherQuestion(0); });
  }
  function todayKeySimple() { return new Date().toISOString().slice(0, 10); }

  afficherQuestion(0);
  return page;
}

function renderSurprises() {
  const page = el(`<div class="page">
    <div class="page-header"><span class="eyebrow">Chut, c'est une surprise</span><h1>Les petites surprises</h1></div>
    <div class="grid" id="surprises-grid"></div>
  </div>`);
  const openedKey = 'surprises-ouvertes';
  const grid = page.querySelector('#surprises-grid');
  grid.innerHTML = D.surprises.length ? D.surprises.map(s => `
    <div class="card envelope ${Store.has(openedKey, s.id) ? 'opened' : ''}" data-id="${s.id}">
      <span class="flap">${s.icone || '✉️'}</span>
      <h3>${escapeHtml(s.titre)}</h3>
      <p style="font-size:.85rem;">${Store.has(openedKey, s.id) ? 'Déjà ouverte, clique pour revoir' : 'Clique pour ouvrir'}</p>
    </div>`).join('') : emptyState('🎁', "Pas encore de surprise, ajoute-en dans js/data.js, section « surprises ».");

  grid.addEventListener('click', e => {
    const card = e.target.closest('.envelope'); if (!card) return;
    const s = D.surprises.find(x => x.id === card.dataset.id);
    Store.toggleInSet(openedKey, s.id);
    card.classList.add('opened');
    card.querySelector('p').textContent = 'Déjà ouverte, clique pour revoir';
    openModal({ glyph: s.icone || '🎁', bodyHtml: `<h3 style="margin-bottom:12px;">${escapeHtml(s.titre)}</h3>${s.contenu.map(renderBlock).join('')}` });
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
ROUTES.find(r => r.path === 'jeux').render = (sub) => renderJeuxDetail(sub);

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
