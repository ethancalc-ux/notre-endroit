# Notre petit endroit 🤍

Un refuge numérique, pensé pour Lorvencia. Site 100 % gratuit, sans
framework, sans dépendance, hébergeable sur **GitHub Pages** ou
**Cloudflare Pages**.

## Comment tout marche, en une phrase

**Tu ne modifies quasiment jamais que `js/data.js`.** Tout le reste
(mise en page, animations, couleurs) est déjà fait. Ajouter une lettre,
une photo, une phrase de câlin ou un lieu à Lille = ouvrir ce fichier,
copier une ligne existante, changer le texte, enregistrer.

## Tester le site sur ton ordinateur

Pas besoin d'installer quoi que ce soit de compliqué :

1. Ouvre simplement `index.html` dans un navigateur (double-clic).
   → Ça fonctionne, mais certaines fonctions avancées (service worker)
   sont désactivées quand le fichier est ouvert directement (`file://`).
2. Pour tout tester à l'identique de la version en ligne, lance un petit
   serveur local (si tu as Python installé) :
   ```
   cd notre-endroit
   python3 -m http.server 8000
   ```
   puis ouvre `http://localhost:8000` dans ton navigateur.

## Mettre le site en ligne gratuitement (GitHub Pages)

1. Crée un dépôt GitHub (peut être **privé**, pour que le site reste
   discret — dans ce cas utilise plutôt Cloudflare Pages, voir plus bas,
   car GitHub Pages sur dépôt privé nécessite un abonnement payant).
2. Dépose tous les fichiers de ce dossier à la racine du dépôt.
3. Dans les réglages du dépôt → **Pages** → source = branche `main`,
   dossier `/ (root)`.
4. Le site sera disponible à une adresse du type
   `https://ton-pseudo.github.io/nom-du-depot/`.

### Alternative recommandée pour la discrétion : Cloudflare Pages

Cloudflare Pages permet d'héberger gratuitement un dépôt **privé** avec
une URL que tu peux même protéger par mot de passe (Cloudflare Access) :

1. Crée un compte sur [pages.cloudflare.com](https://pages.cloudflare.com).
2. « Créer un projet » → connecte ton dépôt GitHub (privé, donc).
3. Laisse les réglages de build vides (c'est un site statique, rien à
   compiler) et valide.
4. Le site est en ligne en moins d'une minute, sur une URL du type
   `https://notre-endroit.pages.dev`.

## ⚠️ Une chose à faire absolument avant de mettre en ligne

Ouvre `js/data.js`, section `reglages`, et remplace :

```js
emailContact: "ton-email@exemple.com",
```

par ta vraie adresse email. C'est l'adresse qui recevra le formulaire
« Ma tenue de sport » rempli par Lorvencia (voir plus bas).

Fais la même chose avec :

```js
telephoneContact: "+33600000000",
```

en mettant ton vrai numéro, au format international (`+33` puis le
numéro sans le premier `0`). C'est ce numéro qui reçoit les messages du
widget « Une envie » (WhatsApp / SMS).

## Ajouter du contenu — mode d'emploi rapide

Ouvre `js/data.js`. Chaque section est commentée en français et suit ce
principe : une **liste** entre crochets `[ ]`, où chaque élément est un
**bloc** entre accolades `{ }`. Pour ajouter un élément, copie un bloc
existant, colle-le juste après (n'oublie pas la virgule entre deux
blocs), et change le texte.

Exemples concrets :

- **Ajouter une phrase de câlin** → section `phrasesCalin`, ajoute
  `"Ta nouvelle phrase.",` dans la liste.
- **Ajouter une lettre** → section `lettres`, copie le bloc
  `premiere-lettre` et donne-lui un nouvel `id` unique (ex: `"lettre-2"`).
- **Ajouter un lieu à Lille** → section `lieuxLille`, modèle fourni en
  commentaire juste en dessous.
- **Ajouter une photo** → dépose le fichier image dans
  `assets/images/`, puis ajoute son chemin dans la section `photos`
  (ex: `"assets/images/plage.jpg",`).
- **Changer la date du compteur** → section `compteurs`, modifie la
  valeur `date` au format `"AAAA-MM-JJTHH:MM:00"`.
- **Changer le mot du jour** → section `motDuJour`, modifie `mot` et
  `texte` (et la `date` si tu veux, mais ce n'est pas obligatoire).

Astuce : si après une modification le site n'affiche plus rien, c'est
presque toujours une virgule oubliée ou une accolade mal fermée. Annule
ton dernier changement (Ctrl+Z) et recommence tranquillement — rien
n'est jamais cassé de façon permanente.

## Où mettre les photos, vidéos et musiques

```
assets/images/   → toutes tes photos (.jpg, .png, .webp)
assets/videos/   → tes vidéos en .mp4
assets/music/    → messages vocaux, musique d'ambiance (.mp3)
```

Les liens YouTube, Spotify et Google Drive n'ont pas besoin d'être
téléchargés : `js/data.js` explique en commentaire comment récupérer le
bon format de lien pour chacun.

## Fonctionnalités déjà en place

- Page d'accueil : bouton câlin (phrase aléatoire), compteur
  personnalisable, citation du jour, météo en direct.
- 15 pages : À ouvrir quand…, Vidéos, Mon vlog, Souvenirs (timeline),
  Projets (à cocher), Notre Lille (carte interactive + favoris ★),
  Ma tenue de sport (formulaire), Appartement, Playlist, Films (vu / à
  voir), Lettres, Poèmes, Photos (avec zoom), Mot du jour, Aujourd'hui
  (journal), Coin sourire, Nos rêves, Surprises (enveloppes à ouvrir).
- Recherche globale (icône loupe en haut).
- Mode clair / sombre (icône soleil/lune, mémorisé automatiquement).
- Bouton flottant « Je pense à toi » (phrase aléatoire, disponible sur
  toutes les pages).
- Effet d'étoiles très discret en fond (désactivable dans `data.js`).
- Installable comme une vraie application sur iPhone (Safari → Partager
  → « Sur l'écran d'accueil ») et Android.
- Fonctionne hors-ligne une fois ouvert une première fois.
- 100 % responsive, testé pour petits écrans (iPhone SE) à grands écrans.

## Ce qu'il te reste à faire, si tu veux aller plus loin

- Compléter `phrasesCalin` jusqu'à 300 (une base solide est déjà là).
- Remplacer les icônes `assets/icons/icon-192.png` / `icon-512.png`
  (générées simplement pour l'instant) par un vrai visuel si tu veux.
- Ajouter tes vraies photos, lettres, lieux, films, etc. au fur et à
  mesure — c'est pensé pour être alimenté petit à petit, pas tout d'un
  coup.

Ce site n'est jamais "fini" — comme dit dans le brief, c'est un endroit
qui doit continuer à vivre. Prends ton temps.

## La carte interactive de "Notre Lille"

Elle utilise **Leaflet** + **OpenStreetMap** (gratuit, sans clé, sans
compte à créer). Au premier chargement, le site cherche automatiquement
l'emplacement de chaque restaurant/lieu à partir de son `nom` et de son
`adresse` dans `data.js` (via l'API gratuite Nominatim). Ça prend une
petite dizaine de secondes la première fois (l'API impose 1 requête par
seconde), puis c'est instantané ensuite car le résultat est mémorisé
dans le navigateur.

Pour de meilleurs résultats, renseigne une adresse précise dans le
champ `adresse` de chaque lieu plutôt que juste "Lille".

## Le formulaire "Ma tenue de sport"

Le site est 100 % statique (pas de base de données), donc le
formulaire ne "stocke" rien sur un serveur : quand Lorvencia clique sur
« Envoyer par email », son application mail s'ouvre avec un message
déjà rédigé, adressé à `emailContact` (réglé dans `data.js`), et elle
n'a plus qu'à cliquer sur envoyer. Un bouton « Copier le texte » est
aussi disponible si elle préfère l'envoyer par SMS ou WhatsApp. Le
brouillon qu'elle remplit est sauvegardé automatiquement dans son
navigateur le temps qu'elle rédige, pour ne rien perdre en cas de
fermeture accidentelle de l'onglet.

## Puissance 4 en ligne — configuration (une seule fois, ~10 minutes)

Le jeu a besoin d'un endroit gratuit pour garder la partie synchronisée
en direct entre vos deux téléphones. On utilise **Firebase** (service
gratuit de Google, largement utilisé, pas de carte bancaire demandée
pour ce qu'on en fait ici).

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
   et connecte-toi avec un compte Google (créé un si besoin).
2. Clique **"Ajouter un projet"**, donne-lui un nom (ex: `notre-endroit`),
   laisse Google Analytics désactivé si proposé (pas nécessaire), puis
   **"Créer le projet"**.
3. Une fois dans le projet, clique l'icône **`</>`** (Web) pour
   "ajouter une application web". Donne-lui un nom, clique
   **"Enregistrer l'application"**.
4. Firebase affiche un bloc de code avec un objet qui ressemble à :
   ```js
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     databaseURL: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   Garde cette page ouverte (ou copie ces valeurs quelque part), tu en
   auras besoin à l'étape 6.
5. Dans le menu de gauche de la console Firebase, cherche
   **"Databases & Storage"** (ou juste "Realtime Database" selon la
   version) → clique **"Realtime Database"** → **"Créer une base de
   données"**. Choisis une région (n'importe laquelle, ex: Europe),
   puis choisis **"Démarrer en mode test"** (ça suffit largement pour
   un jeu privé à deux). Clique **"Activer"** / **"Terminé"**.
6. Retourne dans `js/data.js`, section `firebase`, et colle les
   valeurs récupérées à l'étape 4 :
   ```js
   firebase: {
     apiKey: "...",
     authDomain: "...",
     databaseURL: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
   },
   ```
7. Change aussi `puissance4Cle` pour quelque chose d'unique à vous
   deux (évite que quelqu'un qui devinerait l'adresse par défaut tombe
   sur votre partie) :
   ```js
   puissance4Cle: "quelque-chose-que-vous-seuls-connaissez",
   ```
8. Recharge le site, va sur la page **🔴 Puissance 4** : le premier
   appareil qui ouvre la page devient les rouges, le suivant devient
   les jaunes. Vous pouvez maintenant jouer chacun de votre côté, en
   direct.

**Note sur la confidentialité** : en "mode test", la base Firebase est
librement accessible à qui connaît son adresse — ce n'est pas grave
pour un simple jeu entre vous deux, mais évite de partager le contenu
de `js/data.js` publiquement une fois rempli, et préfère un dépôt
GitHub privé + Cloudflare Pages (voir plus haut) si tu veux rester
tranquille sur ce point. Le mode test Firebase se désactive
automatiquement après 30 jours si tu ne touches pas aux règles —
Firebase t'enverra un email avant, il suffira d'aller dans
"Realtime Database → Règles" et de cliquer à nouveau pour prolonger
(ou ajuster les règles pour un accès permanent, si tu veux creuser).
