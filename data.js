/* ======================================================================
   NOTRE PETIT ENDROIT — data.js
   ======================================================================
   👉 C'EST ICI, ET SEULEMENT ICI, QUE TU AJOUTES DU CONTENU.

   Tu n'as jamais besoin de comprendre le reste du code. Il suffit de
   respecter la forme des { accolades } et des virgules. Chaque section
   ci-dessous est indépendante : tu peux ajouter, supprimer ou modifier
   une ligne sans casser les autres.

   Astuce : si tu casses accidentellement une virgule ou une accolade,
   le site entier peut ne plus s'afficher. Dans ce cas, annule ton
   dernier changement (Ctrl+Z) et réessaie tranquillement.

   Pour ajouter une photo/vidéo qui t'appartient : dépose le fichier
   directement dans le dossier du site (à côté de index.html, comme
   tous les autres fichiers), puis écris juste son nom ici, par
   exemple :
     image: "plage-arcachon.jpg"

   Pour YouTube : prends l'URL "embed", exemple :
     https://www.youtube.com/embed/XXXXXXXXXXX
   (dans YouTube : Partager → Intégrer → copie juste l'URL du src)

   Pour Google Drive (vidéo/audio) : partage le fichier en "lecture
   pour tous ceux qui ont le lien", puis utilise l'URL au format :
     https://drive.google.com/file/d/ID_DU_FICHIER/preview

   Pour Spotify : clic droit sur une musique/playlist → Partager →
   Copier le lien d'intégration (embed).
   ====================================================================== */

const SITE_DATA = {

  /* ====================================================================
     RÉGLAGES GÉNÉRAUX
     ==================================================================== */
  reglages: {
    prenom: "Lorvencia",
    titreSite: "Notre petit endroit",
    // Villes affichées dans le widget météo (dans cet ordre). Ajoute ou
    // enlève des villes librement — trouve lat/lon en cherchant
    // "[nom de ville] latitude longitude" sur le web.
    meteoVilles: [
      { nom: "Bordeaux", lat: 44.8378, lon: -0.5792 },
      { nom: "Limoges", lat: 45.8336, lon: 1.2611 },
    ],
    // Active ou non les petits bonus d'ambiance
    effetEtoiles: true,     // léger effet d'étoiles qui scintillent
    musiqueAmbiance: false, // mets à true si tu ajoutes un fichier ambiance.mp3
    musiqueFichier: "ambiance.mp3",
    // Photos affichées dans le carrousel de l'accueil (défilement avec
    // flèches). Ajoute, enlève ou réordonne librement — chaque photo
    // doit être dans le dossier du site, comme les autres fichiers.
    carrouselAccueil: [
      { src: "carousel-fleurs.jpg", alt: "Un bouquet reçu" },
      { src: "carousel-pull-ami.jpg", alt: "Nous deux, un soir" },
      { src: "carousel-joue-contre-joue.jpg", alt: "Joue contre joue" },
      { src: "carousel-cale-dehors.jpg", alt: "Câlin dehors" },
      { src: "carousel-lorvencia-lunettes.jpg", alt: "Lorvencia" },
      { src: "carousel-lorvencia-sourire.jpg", alt: "Le sourire de Lorvencia" },
    ],
    // Image de fond décorative, très discrète, derrière la page d'accueil
    // (laisse vide "" pour revenir aux formes douces générées par CSS)
    fondDecoratif: "fond-fleurs.jpg",
    // Ton adresse email : c'est là que partira le formulaire "Ma tenue de sport"
    // rempli par Lorvencia. Remplace la valeur ci-dessous par ta vraie adresse.
    emailContact: "ethancalc@icloud.com",
    // Ton numéro de téléphone, au format international (avec le +33 pour la
    // France, sans le 0 après). Utilisé par le bouton "Une envie" pour
    // envoyer un message par WhatsApp ou SMS. Exemple : "+33612345678"
    telephoneContact: "+33631774725",
  },

  /* ====================================================================
     PUISSANCE 4 EN LIGNE — nécessite un compte Firebase gratuit (voir
     le README, section "Puissance 4 en ligne", pour la marche à suivre
     complète, environ 10 minutes, à faire une seule fois).

     Une fois ton projet Firebase créé, remplace les valeurs ci-dessous
     par celles de TON projet (Firebase te les donne automatiquement
     quand tu "enregistres une application web" dans la console).
     Tant que "apiKey" est vide, la page affichera un message
     expliquant qu'il reste une étape de configuration.
     ==================================================================== */
  firebase: {
    apiKey: "AIzaSyBDHj4A7c5-Ov5cPZpaNrrxLhsEuTxCPUA",
    authDomain: "notre-projet-d49f3.firebaseapp.com",
    databaseURL: "https://notre-projet-d49f3-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "notre-projet-d49f3",
    storageBucket: "notre-projet-d49f3.firebasestorage.app",
    messagingSenderId: "635009069502",
    appId: "1:635009069502:web:1d38d7f021438c9e5ba8ef",
  },
  // Un identifiant "secret" pour votre partie : change-le pour quelque
  // chose d'unique à vous deux (évite que quelqu'un qui devinerait
  // l'adresse par défaut puisse voir/modifier votre partie). Pas besoin
  // que ce soit un mot de passe compliqué, juste pas trop générique.
  puissance4Cle: "notre-puissance4-ethan-lorvencia",

  /* ====================================================================
     WIDGETS "POUR RIRE" DE L'ACCUEIL — lesquels afficher, et dans quel
     ordre. Les vraies pages (Puissance 4, À ouvrir quand, etc.) sont
     toutes affichées automatiquement en dessous, pas besoin de les
     lister ici.

     Noms possibles : envie, meteo, toilettes
     ==================================================================== */
  widgetsAmusants: ["envie", "meteo"],

  /* ====================================================================
     UNE ENVIE — petit bouton présent sur l'accueil : elle choisit une
     envie rapide (ou écrit la sienne), puis l'envoie par WhatsApp, SMS
     ou email, en un tap. Ajoute/modifie les suggestions ci-dessous.
     ==================================================================== */
  envies: [
    { emoji: "🍔", label: "Un Uber Eats", message: "J'ai envie d'un Uber Eats ce soir 🍔" },
    { emoji: "📞", label: "Un appel",      message: "J'ai envie qu'on s'appelle 📞" },
    { emoji: "🤗", label: "Un câlin",       message: "J'ai besoin d'un câlin, même à distance 🤗" },
    { emoji: "🍿", label: "Un film ensemble", message: "On se lance un film ensemble ce soir ? 🍿" },
    { emoji: "❤️", label: "Te dire que tu me manques", message: "Tu me manques, juste ça ❤️" },
    // Ajoute tes propres envies sur ce modèle :
    // { emoji: "🌸", label: "Une balade", message: "On va se balader ?" },
  ],

  /* ====================================================================
     COMPTEUR — la page d'accueil affiche un compte à rebours (ou compte
     depuis) vers une date. Ajoute autant d'options que tu veux, la
     première de la liste est sélectionnée par défaut.
     Format de la date : "AAAA-MM-JJTHH:MM:00"
     ==================================================================== */
  /* ====================================================================
     DEPUIS NOTRE DERNIER CÂLIN — remplace l'ancien compte à rebours.
     Le site compte le temps ÉCOULÉ depuis cette date, en continu.
     Format : "AAAA-MM-JJTHH:MM:00+02:00" (garde le fuseau +02:00, heure
     d'été en France ; passe à +01:00 en hiver si tu veux être exact).
     ==================================================================== */
  derniereRencontre: "2026-07-12T00:00:00+02:00",

  /* ====================================================================
     LA DISTANCE ENTRE NOUS — juste les noms de ville et un chiffre
     approximatif, jamais d'adresse précise (site public sur GitHub).
     ==================================================================== */
  distanceCouple: {
    villeA: "Villenave-d'Ornon",
    villeB: "Limoges",
    km: 220,
    avatarA: "avatar-ethan.png",
    avatarB: "avatar-lorvencia.png",
  },

  /* ====================================================================
     PHRASES DU CÂLIN — s'affichent au hasard quand elle clique sur
     "J'ai besoin d'un câlin". Ajoute-en autant que tu veux, une par
     ligne, entre guillemets, séparées par une virgule.
     Objectif : 300+. Voici une bonne base pour commencer — complète-la
     petit à petit, ça peut même devenir une habitude du soir.
     ==================================================================== */
  phrasesCalin: [
    "Je suis là, même à distance. Respire, je te tiens la main.",
    "Tu n'as rien à prouver aujourd'hui. Juste à exister, doucement.",
    "Ton corps se bat très fort. Sois aussi douce avec lui que tu l'es avec moi.",
    "Je suis fier de toi, même les jours où tu ne fais que tenir bon.",
    "Tu peux poser les armes deux minutes. Je monte la garde.",
    "Il n'y a rien à réussir aujourd'hui, juste à traverser la journée.",
    "Je pense à toi plus souvent que tu ne l'imagines.",
    "Tu n'es pas un fardeau. Tu es la personne que je choisis, encore et encore.",
    "Ferme les yeux trois secondes. Je suis dans cette respiration avec toi.",
    "Ce que tu ressens est valide, même si personne ne le voit de l'extérieur.",
    "Tu avances, même quand ça ressemble à du surplace.",
    "Un jour, on regardera cette période en se disant : on l'a fait, ensemble.",
    "Je t'aime dans tes bons jours, et encore plus dans les mauvais.",
    "Tu n'as pas besoin d'être forte pour moi. Juste d'être toi.",
    "Chaque petit pas compte, même celui que tu trouves ridicule.",
    "Je suis fier de la façon dont tu te bats sans le montrer.",
    "Tu mérites du repos, pas seulement quand tout est fini.",
    "Je suis ton port, même quand la mer est agitée.",
    "Tu n'es pas seule, même dans le silence de 3h du matin.",
    "Il n'y a pas de mauvaise façon de traverser une journée difficile.",
    "Je t'aime pour ce que tu es, pas pour ce que tu produis.",
    "Ton rythme est le bon rythme. Le mien s'adapte au tien.",
    "Tu as le droit d'être fatiguée sans te justifier.",
    "Je garde une place au chaud pour toi, ici, tous les jours.",
    "Quand tu doutes de toi, souviens-toi que moi je n'en doute jamais.",
    "Ce n'est pas grave de pleurer. Ce n'est pas grave d'avoir peur.",
    "Tu fais déjà plus que ce que tu penses.",
    "Je t'envoie toute la douceur que je peux depuis ici.",
    "On avance à deux, même si un seul de nous porte le sac aujourd'hui.",
    "Tu es exactement là où tu dois être : en train d'essayer.",
    "Je crois en toi, surtout les jours où tu n'y crois plus.",
    "Ton courage ne se mesure pas à l'absence de larmes.",
    "Prends soin de toi comme tu prendrais soin de moi.",
    "Je t'aime, sans condition, sans horaire, sans exception.",
    "Une hernie ne définit pas ta force. Ta façon d'y faire face, si.",
    "Ce master, cet appart, Lille : on prend ça un jour à la fois.",
    "Tu n'as pas à tout gérer seule. Je suis dans l'équation.",
    "Respire. Le reste peut attendre cinq minutes.",
    "Je suis toujours dans ton coin, même de loin.",
    "Ce qui est difficile aujourd'hui ne le sera pas éternellement.",
    "Tu as le droit de ne pas être productive aujourd'hui.",
    "Je t'aime pour ta douceur, mais aussi pour ta force silencieuse.",
    "On trouvera cet appartement. On trouve toujours une solution, toi et moi.",
    "Tu n'es pas en retard sur ta vie. Tu la vis, simplement, à ton rythme.",
    "Même loin, mes pensées dorment à côté des tiennes ce soir.",
    "Tu es autorisée à dire stop, à toi-même y compris.",
    "Je suis fier de la personne que tu deviens, même dans la tempête.",
    "Ce que tu traverses est réel et difficile. Je ne minimise rien.",
    "Un câlin virtuel, en attendant le vrai : *je te serre fort*.",
    "Tu comptes énormément, bien plus que tu ne le penses.",
    "Je t'aime aujourd'hui, exactement comme tu es, fatiguée et tout.",
  ],

  /* ====================================================================
     CITATIONS DU JOUR — une par jour, choisie automatiquement selon la
     date (mais tu peux aussi juste changer "citationManuelle" ci-dessous
     si tu veux en imposer une précise pour aujourd'hui).
     ==================================================================== */
  citationManuelle: null, // ex: "Tout ce qui est difficile aujourd'hui sera un souvenir doux demain."
  citations: [
    "Tu n'as pas à porter demain aujourd'hui.",
    "Ce qui pousse lentement pousse solidement.",
    "Le repos fait partie du chemin, pas une pause dedans.",
    "Chaque jour tenu est une victoire qu'on ne fête jamais assez.",
    "La tempête ne dure pas. Toi, si.",
    "Tu peux être fatiguée et forte en même temps.",
    "Un jour à la fois. Parfois, une heure à la fois. C'est déjà beaucoup.",
    "Ton futur toi te remerciera d'avoir été douce avec toi-même aujourd'hui.",
    "Il est possible d'avoir peur et d'avancer quand même.",
    "Tu n'as rien à prouver à personne, surtout pas à toi-même.",
  ],

  /* ====================================================================
     MOT DU JOUR — change simplement ce texte quand tu veux.
     ==================================================================== */
  motDuJour: {
    date: "2026-07-29",
    mot: "Refuge",
    texte: "Aujourd'hui, je veux juste que cet endroit soit ton refuge. Pas un endroit à gérer, juste un endroit où te poser.",
  },

  /* ====================================================================
     "À OUVRIR QUAND…" — chaque carte ouvre une page dédiée.
     "contenu" est une liste de blocs. Types possibles :
       { type: "texte", valeur: "..." }
       { type: "image", src: "xxx.jpg" }
       { type: "video", src: "xxx.mp4" }         (fichier MP4)
       { type: "youtube", src: "https://www.youtube.com/embed/ID" }
       { type: "gif", src: "https://media.giphy.com/.../xxx.gif" }
       { type: "audio", src: "xxx.mp3" }
       { type: "spotify", src: "https://open.spotify.com/embed/..." }
       { type: "drive", src: "https://drive.google.com/file/d/ID/preview" }
     ==================================================================== */
  ouvrirQuand: [
    {
      id: "mal",
      icone: "🤍",
      titre: "Quand tu as mal",
      contenu: [
        { type: "texte", valeur: "Je sais que ton corps te fait souffrir en ce moment, et que c'est injuste et épuisant. Je ne peux pas prendre la douleur à ta place, mais je peux te dire : ce que tu traverses est réel, et tu n'as pas à faire semblant que ça va, ici." },
        { type: "texte", valeur: "Pose ton téléphone si tu veux. Respire. Je serai encore là quand tu reviendras." },
      ],
    },
    {
      id: "pleures",
      icone: "🌧️",
      titre: "Quand tu pleures",
      contenu: [
        { type: "texte", valeur: "Pleure autant que tu as besoin. Ce n'est pas de la faiblesse, c'est de la vidange. Après l'orage, il fait toujours un peu plus calme." },
        { type: "texte", valeur: "Je suis triste avec toi, à distance, en ce moment même." },
      ],
    },
    {
      id: "dormir",
      icone: "🌙",
      titre: "Quand tu n'arrives pas à dormir",
      contenu: [
        { type: "texte", valeur: "Inspire pendant 4 secondes, retiens 4 secondes, souffle pendant 6. Recommence autant de fois que nécessaire. Je te souhaite une nuit douce, même si elle est longue." },
      ],
    },
    {
      id: "doutes",
      icone: "🕊️",
      titre: "Quand tu doutes",
      contenu: [
        { type: "texte", valeur: "Le doute n'est pas la vérité, c'est juste une visite. Il repartira. En attendant, je continue de croire en toi, pour deux." },
      ],
    },
    {
      id: "peur",
      icone: "🫶",
      titre: "Quand tu as peur",
      contenu: [
        { type: "texte", valeur: "Lille, le master, l'appartement : ce sont de grandes choses, et avoir peur devant de grandes choses est normal. On les prendra une par une, ensemble." },
      ],
    },
    {
      id: "pas-assez",
      icone: "🌸",
      titre: "Quand tu penses que tu n'es pas assez",
      contenu: [
        { type: "texte", valeur: "Tu es assez. Tu l'as toujours été. Ce que tu ressens en ce moment n'est pas un fait, c'est la fatigue qui parle. Je te le redirai autant de fois qu'il le faudra." },
      ],
    },
    {
      id: "seule",
      icone: "🤝",
      titre: "Quand tu te sens seule",
      contenu: [
        { type: "texte", valeur: "Tu n'es pas seule. Même quand je ne suis pas à côté de toi physiquement, tu es dans mes pensées, littéralement tous les jours." },
      ],
    },
    {
      id: "manques",
      icone: "💌",
      titre: "Quand je te manque",
      contenu: [
        { type: "texte", valeur: "Tu me manques aussi, énormément. Regarde une de nos photos dans la galerie si tu veux, ou écoute-moi te le dire dans un mot vocal si j'en ai laissé un." },
      ],
    },
    {
      id: "sourire",
      icone: "😊",
      titre: "Quand tu veux sourire",
      contenu: [
        { type: "texte", valeur: "Va faire un tour dans 'Le coin sourire', je l'ai rempli exprès pour ces moments-là." },
      ],
    },
    {
      id: "voix",
      icone: "🎧",
      titre: "Quand tu veux entendre ma voix",
      contenu: [
        { type: "texte", valeur: "Ajoute ici un message vocal enregistré (dépose le fichier message-vocal.mp3 dans le dossier du site, puis remplace le bloc ci-dessous)." },
        // { type: "audio", src: "message-vocal.mp3" },
      ],
    },
  ],

  /* ====================================================================
     MON VLOG — un mini "épisode" par jour : une vidéo de ta journée
     (ou une photo, si tu n'as pas filmé), avec une petite légende.
     Trié automatiquement du plus récent au plus ancien sur le site.

     type possibles : "youtube" | "drive" | "mp4" | "photo"
     - "youtube" → mets la vidéo en "non répertoriée" sur YouTube (pas
       besoin qu'elle soit publique) puis colle le lien "embed".
     - "drive"   → partage le fichier "en lecture pour toute personne
       ayant le lien" puis utilise le format .../file/d/ID/preview
     - "mp4"     → dépose le fichier directement dans le dossier du site
       (idéalement
       moins de 50 Mo par vidéo pour que le site reste rapide)
     - "photo"   → si un jour tu n'as qu'une photo, pas de vidéo
     ==================================================================== */
  vlog: [
    {
      id: "vlog-1",
      date: "2026-07-29",
      titre: "Jour 1",
      texte: "Le tout premier épisode de ce petit vlog, pour que tu aies un bout de ma journée avec toi.",
      type: "mp4",
      src: "vlog-jour1.mp4",
      miniature: "",     // image d'aperçu, ex: "miniature-jour1.jpg" (facultatif)
    },
    // Ajoute un épisode par jour sur ce modèle (numérote "Jour 2", "Jour 3"…) :
    // {
    //   id: "vlog-2",
    //   date: "2026-07-30",
    //   titre: "Jour 2",
    //   texte: "Petite anecdote sur ta journée, ce que tu as fait, à quoi tu as pensé…",
    //   type: "mp4",
    //   src: "vlog-jour2.mp4",
    //   miniature: "",
    // },
  ],

  /* ====================================================================
     MA TENUE DE SPORT — page avec un petit formulaire que Lorvencia
     remplit : elle colle des liens d'articles (vêtements, chaussures…)
     qu'elle pense que tu devrais acheter, avec une note optionnelle.
     Comme le site est 100% gratuit et sans base de données, le
     formulaire s'envoie directement par email (ton adresse est réglée
     juste au-dessus, dans "reglages.emailContact").
     Tu peux ici écrire une petite introduction, et éventuellement
     lister déjà des articles que tu portes/aimes pour lui donner des
     idées de style.
     ==================================================================== */
  tenueSport: {
    intro: "Choisis-moi une tenue de sport ! Colle les liens des articles que tu trouves stylés, j'irai les acheter avec plaisir.",
    inspiration: [
      // { nom: "Exemple : legging noir", lien: "https://www.exemple.com/produit" },
    ],
  },

  /* ====================================================================
     NOTRE LILLE — lieux à découvrir. "carte" = lien Google Maps.
     Pour l'adresse, tu peux copier-coller le lien "Partager" de
     Google Maps directement dans "carteLien". "lienArticle" (facultatif)
     pointe vers un article pour en savoir plus sur le lieu.
     ==================================================================== */
  lieuxLille: [
    {
      id: "vieux-lille",
      nom: "Le Vieux-Lille",
      categorie: "Balade",
      description: "Ruelles pavées, façades flamandes, parfait pour marcher sans but précis.",
      adresse: "Vieux-Lille, 59000 Lille",
      image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Vieux+Lille",
      lienArticle: "",
      tempsAPied: "—",
      tempsEnVoiture: "—",
      note: 0,
      topPersonnel: null,
    },

    /* --- Suggestions ajoutées, pensées pour votre vie étudiante à Lille --- */
    {
      id: "jardin-vauban", nom: "Jardin Vauban", categorie: "Parc",
      description: "Grand jardin à l'anglaise gratuit, parfait pour un pique-nique ou une balade pas chère.",
      adresse: "1 Boulevard Vauban, 59800 Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Jardin+Vauban+Lille",
      lienArticle: "https://www.lille.fr/vauban-esquermes/Decouvrir-le-quartier/Nature/Le-jardin-Vauban",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "braderie-de-lille", nom: "Braderie de Lille (5-6 septembre 2026)", categorie: "Événement",
      description: "Le plus grand marché aux puces d'Europe, gratuit, pile pour votre arrivée. Moules-frites obligatoires.",
      adresse: "Centre-ville de Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Braderie+de+Lille",
      lienArticle: "https://www.braderie-de-lille.fr/braderie-de-lille-2026-dates-programme/",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "meert", nom: "Meert", categorie: "Café",
      description: "La maison de gaufres historique de Lille depuis 1761, un classique romantique du Vieux-Lille.",
      adresse: "27 Rue Esquermoise, 59800 Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Meert+Lille",
      lienArticle: "https://www.meert.fr/fr/content/10-notre-salon-de-the-de-lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "learning-center", nom: "BU et Learning Center", categorie: "Bibliothèque",
      description: "Le réseau des bibliothèques universitaires de Lille, pratique pour réviser à deux.",
      adresse: "Université de Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=LILLIAD+Learning+Center+Lille",
      lienArticle: "https://bu.univ-lille.fr/",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "marche-wazemmes", nom: "Marché de Wazemmes", categorie: "Marché",
      description: "Marché populaire et animé depuis plus d'un siècle, mardi/jeudi/dimanche, très abordable.",
      adresse: "Place de la Nouvelle Aventure, 59000 Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Marche+de+Wazemmes+Lille",
      lienArticle: "https://www.lille.fr/wazemmes/Decouvrir-le-quartier/Marche-de-Wazemmes",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "citadelle-lille", nom: "Parc de la Citadelle", categorie: "Parc",
      description: "110 hectares, le plus grand espace vert de Lille, entrée gratuite, avec le zoo à l'intérieur.",
      adresse: "Avenue Mathias Delobel, 59800 Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Parc+de+la+Citadelle+Lille",
      lienArticle: "https://parcdelacitadelle.lille.fr/",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "zoo-lille", nom: "Zoo de Lille", categorie: "Parc",
      description: "Gratuit pour les résidents de Lille/Lomme/Hellemmes avec le Pass zoo, sinon quelques euros.",
      adresse: "Avenue Mathias Delobel, 59800 Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Zoo+de+Lille",
      lienArticle: "https://www.lille.fr/Zoo-de-Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "freres-pinard", nom: "Les Frères Pinard", categorie: "Bar",
      description: "Bar à vin-épicerie dans une ruelle pavée du Vieux-Lille, ambiance chaleureuse, à réserver.",
      adresse: "26 Rue des Vieux Murs, 59800 Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Les+Freres+Pinard+Lille",
      lienArticle: "https://lechti.com/article/les-meilleurs-bars-a-vin-de-lille/",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    /* --- Italiens à faire absolument --------------------------------- */
    {
      id: "la-bellezza", nom: "La Bellezza", categorie: "Italien",
      description: "L'expérience italienne la plus spectaculaire de Lille. Immense décoration façon Big Mamma, pâtes fraîches, pizzas napolitaines. À réserver longtemps à l'avance.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=La+Bellezza+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 1,
    },
    {
      id: "come-prima", nom: "Come Prima", categorie: "Italien",
      description: "Institution lilloise. Cuisine italienne traditionnelle, très réputée pour les pâtes et le risotto.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Come+Prima+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 3,
    },
    {
      id: "bacio-divino", nom: "Bacio Divino", categorie: "Italien",
      description: "Plus intimiste, produits italiens haut de gamme, ambiance romantique.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Bacio+Divino+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 6,
    },
    {
      id: "la-piazzetta", nom: "La Piazzetta", categorie: "Italien",
      description: "Petite adresse authentique, excellente pour un déjeuner italien.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=La+Piazzetta+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "papa-raffaele", nom: "Papà Raffaele", categorie: "Italien",
      description: "Considéré par beaucoup de Lillois comme l'une des meilleures pizzas napolitaines de la ville.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Papa+Raffaele+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 9,
    },

    /* --- Burgers premium ---------------------------------------------- */
    {
      id: "pny", nom: "PNY Vieux-Lille", categorie: "Burger",
      description: "L'équivalent d'un Five Guys version gastronomique, avec pain brioché, viande maturée et de très belles recettes.",
      adresse: "Vieux-Lille, Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=PNY+Vieux+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 2,
    },
    {
      id: "comptoir-volant", nom: "Le Comptoir Volant", categorie: "Burger",
      description: "Institution du burger lillois, produits locaux, excellent rapport qualité/prix.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Le+Comptoir+Volant+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 5,
    },
    {
      id: "soulmade", nom: "Soulmade", categorie: "Burger",
      description: "Smash burgers premium, style américain, très bien noté.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Soulmade+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 8,
    },
    {
      id: "eat-and-meat", nom: "Eat And Meat", categorie: "Burger",
      description: "Burgers généreux, viandes de qualité.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Eat+And+Meat+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },

    /* --- Brasseries / viande -------------------------------------------- */
    {
      id: "brasserie-campion", nom: "Brasserie Campion", categorie: "Brasserie",
      description: "Une des plus belles brasseries modernes de Lille, avec une superbe décoration et une cuisine française généreuse.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Brasserie+Campion+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 4,
    },
    {
      id: "le-fossile", nom: "Le Fossile", categorie: "Brasserie",
      description: "Pour les amateurs de viande. Très réputé.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Le+Fossile+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 7,
    },
    {
      id: "brasserie-andre", nom: "Brasserie André", categorie: "Brasserie",
      description: "Brasserie chic et classique, belle carte de viandes et de poissons.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Brasserie+Andre+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: 10,
    },

    /* --- Restaurants "concept" ------------------------------------------ */
    {
      id: "cafe-de-paris", nom: "Café de Paris", categorie: "Concept",
      description: "Célèbre pour son steak-frites et sa fameuse sauce au beurre, souvent comparé au concept de L'Entrecôte.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Cafe+de+Paris+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },

    /* --- Les classiques qu'on garde sous le coude ------------------------ */
    {
      id: "mcdonalds-lille", nom: "McDonald's", categorie: "Classique",
      description: "Le classique qu'on garde toujours sur la carte, pour les jours sans envie de faire des choix.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=McDonald%27s+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },
    {
      id: "burger-king-lille", nom: "Burger King", categorie: "Classique",
      description: "L'autre valeur sûre des soirs simples.",
      adresse: "Lille", image: "",
      carteLien: "https://www.google.com/maps/search/?api=1&query=Burger+King+Lille",
      tempsAPied: "—", tempsEnVoiture: "—", note: 0, topPersonnel: null,
    },

    // Ajoute tes propres lieux sur ce modèle :
    // {
    //   id: "identifiant-unique",
    //   nom: "Nom du lieu",
    //   categorie: "Restaurant" | "Italien" | "Burger" | "Brasserie" | "Concept" | "Classique" | "Café" | "Balade" | "Musée" | "Parc" | "Bibliothèque" | "Boulangerie" | "Pique-nique",
    //   description: "...",
    //   adresse: "adresse précise si tu l'as (améliore la carte interactive)",
    //   image: "....jpg",
    //   carteLien: "https://www.google.com/maps/search/?api=1&query=...",
    //   lienArticle: "https://... (facultatif, un article sur le lieu)",
    //   tempsAPied: "12 min",
    //   tempsEnVoiture: "4 min",
    //   note: 4, // sur 5
    //   topPersonnel: null, // ou un chiffre de 1 à 10 pour ton classement perso
    // },
  ],

  /* ====================================================================
     FILMS / SÉRIES / DOCS / ANIMES
     ==================================================================== */
  /* ====================================================================
     YOUTUBE — vidéos qu'elle peut regarder en un clic. Ajoute un lien
     YouTube et un titre (le titre est juste pour toi, elle ne voit que
     la miniature). Pour trouver l'ID d'une vidéo YouTube, c'est la
     partie après "youtu.be/" ou après "v=" dans l'adresse.
     ==================================================================== */
  youtube: [
    { id: "dQgG2SBBol0", titre: "Vidéo 1" },
    { id: "IE4uCwqS0b4", titre: "Vidéo 2" },
    { id: "Z_vU5jAY138", titre: "Vidéo 3" },
    { id: "THLO_oc9OjE", titre: "Vidéo 4" },
    { id: "6uv5RzB8BX8", titre: "Vidéo 5" },
    { id: "i_5oHWaiaqs", titre: "Vidéo 6" },
    // Ajoute-en d'autres sur ce modèle :
    // { id: "XXXXXXXXXXX", titre: "Mon titre" },
  ],

  /* ====================================================================
     NOS PETITS JEUX — contenu des mini-jeux jouables tout de suite.
     ==================================================================== */
  jeux: {
    // La roue de nos envies : ajoute/enlève des activités librement
    roue: [
      "🎬 Regarder un film", "📞 Faire un appel vidéo", "🍽️ Choisir un futur resto",
      "📸 Envoyer une photo", "💌 Écrire un compliment", "🗺️ Préparer une sortie",
      "🎵 Écouter la même chanson", "🧠 Faire un petit quiz", "📖 Raconter un souvenir",
      "✈️ Choisir une destination", "🎙️ Envoyer un vocal", "🎁 Faire une surprise",
    ],
    // Notre compatibilité du jour : 5 petites questions, résultat pour rire
    compatibilite: [
      { question: "Ton humeur là, maintenant ?", options: ["😌 Calme", "🤩 Excité·e", "😴 Fatigué·e", "🥰 Amoureux·se"] },
      { question: "Plutôt sortir ou rester ?", options: ["🏠 Rester", "🚶 Sortir"] },
      { question: "Salé ou sucré ?", options: ["🧂 Salé", "🍰 Sucré"] },
      { question: "Musique du moment ?", options: ["🎧 Calme", "🔥 Énergique"] },
      { question: "Envie ce soir ?", options: ["🤫 Calme", "💬 Papoter"] },
    ],
  },

  /* ====================================================================
     LES PETITES SURPRISES — enveloppes à ouvrir.
     "contenu" utilise les mêmes types de blocs que "ouvrirQuand".
     ==================================================================== */
  // "icone" est facultatif (par défaut, une enveloppe ✉️). Change-la pour
  // une horloge ⏰ par exemple, le temps de préparer de vraies surprises.
  surprises: [
    {
      id: "a-venir",
      icone: "⏰",
      titre: "À venir",
      contenu: [
        { type: "texte", valeur: "De vraies surprises arrivent bientôt. Reviens régulièrement, cette page se remplit petit à petit." },
      ],
    },
  ],

};

/* Ne modifie rien en dessous de cette ligne : c'est juste ce qui rend
   les données disponibles pour le reste du site. */
window.SITE_DATA = SITE_DATA;
