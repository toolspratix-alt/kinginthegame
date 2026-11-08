/** @type {HTMLCanvasElement} */
const canvas = document.querySelector('#game');
const gameContainer = document.querySelector('#game-container');
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
/** @type {HTMLButtonElement} */
const muteButton = document.querySelector('#mute');
/** @type {HTMLButtonElement} */
const exitGameButton = document.querySelector('#exit-game');
/** @type {HTMLButtonElement} */
const fullscreenButton = document.querySelector('#fullscreen-game');
/** @type {HTMLButtonElement} */
const mobileFireButton = document.querySelector('#mobile-fire');
/** @type {HTMLButtonElement} */
const mobileShieldButton = document.querySelector('#mobile-shield');
/** @type {HTMLButtonElement} */
const mobileMarkButton = document.querySelector('#mobile-mark');
/** @type {HTMLDivElement} */
const lossActions = document.querySelector('#loss-actions');
/** @type {HTMLButtonElement} */
const lossRetryButton = document.querySelector('#loss-retry');
/** @type {HTMLButtonElement} */
const lossRestartButton = document.querySelector('#loss-restart');
/** @type {HTMLButtonElement} */
const lossCloseButton = document.querySelector('#loss-close');
const W = 1920;
const H = 1080;
const bow = { x: W / 2, y: 1000 };
// The crossbow sprite is rendered at 224×185. Its real bolt exit is near the
// right-hand barrel cap, not at the sprite/pivot center.
const BOW_MUZZLE_LOCAL = { x: 110, y: -22 };
// The shield sits just beyond the actual bolt exit, between the hunter and the
// incoming threat. Its front face stays readable instead of turning inward.
const SHIELD_FORWARD_OFFSET = 38;

function bowMuzzlePosition(angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: bow.x + BOW_MUZZLE_LOCAL.x * cosine - BOW_MUZZLE_LOCAL.y * sine,
    y: bow.y + BOW_MUZZLE_LOCAL.x * sine + BOW_MUZZLE_LOCAL.y * cosine,
  };
}

function bowAimAngle() {
  // Resolve the small offset between the weapon pivot and its muzzle so the
  // projectile line still passes through the cursor at every distance.
  let angle = Math.atan2(mouse.y - bow.y, mouse.x - bow.x);
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const muzzle = bowMuzzlePosition(angle);
    angle = Math.atan2(mouse.y - muzzle.y, mouse.x - muzzle.x);
  }
  return angle;
}
/** @type {HTMLSelectElement} */
const languageSelect = document.querySelector('#language-select');
function readLocalStorage(key, fallback = null) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing or a full storage quota must not stop the hunt.
  }
}

const savedMuted = readLocalStorage('kara-av-muted');
let muted = savedMuted === 'true';

const I18N = {
  en: {
    pageTitle: 'Dark Hunt: Dragon Valley', valley: 'DRAGON VALLEY', title: 'DARK HUNT', subtitle: 'Ten levels. Ten realms. Countless dragons.', aim: 'AIM WITH MOUSE', fireInstruction: 'Left click: draw and fire  •  Right click / Shift: shield', start: 'CLICK TO BEGIN', pausedTitle: 'HUNT PAUSED', pausedMessage: 'Time, aim and charge are held in place.', resume: 'RESUME HUNT', pauseHint: 'Press Escape, Space or click to continue', rankPromotion: 'RANK PROMOTION', rankOath: 'THE HUNT GRANTS YOU A NEW TITLE',
    level: 'LEVEL', hunt: 'HUNT', score: 'SCORE', health: 'HEALTH', shield: 'SHIELD', active: 'ACTIVE', shieldHint: 'RIGHT CLICK / SHIFT', arrows: 'ARROWS', strongArrows: 'POWER ARROWS ×{{count}}', seconds: '{{value}} sec', combo: '×{{count}} COMBO', newRegion: 'DARKNESS AWAKENS IN A NEW REGION', levelBanner: 'LEVEL {{level}}', lowAmmo: 'RUNNING LOW ON ARROWS!',
    shieldBlocked: 'SHIELD BLOCKED +{{points}}', shieldBroken: 'SHIELD BROKEN!', airShot: 'MID-AIR HIT +{{points}}', critical: 'CRITICAL +{{points}}', points: '+{{points}}', defeated: '{{name}} FALLEN!', powerDrop: 'CRIMSON POWER: 3 POWER ARROWS', ammoPlus: '+{{count}} ARROWS', caughtInFire: 'YOU WERE CAUGHT IN THE FIRE!', comboSurge: 'HUNT MOMENTUM ×{{count}}  •  +{{arrows}} POWER ARROWS',
    valleySilent: 'THE VALLEY FALLS SILENT', huntInterrupted: 'THE HUNT ENDS', ammoDepleted: 'AMMUNITION DEPLETED', huntComplete: 'HUNT COMPLETE', arrowsFinished: 'ARROWS GONE', hunterFallen: 'HUNTER FALLEN', finalRank: 'FINAL RANK: {{rank}}', creaturesHunted: '{{kills}} / {{total}} creatures hunted', levelsCount: '{{levels}} levels', restart: 'CLICK TO HUNT AGAIN', rank: 'RANK', campaignStarted: 'HUNT BEGUN', plusHealth: '  •  +1 HEALTH',
    reward: 'RANK: {{rank}}  •  +{{ammo}} ARROWS  •  SHIELD RESTORED{{health}}', started: 'RANK: {{rank}}  •  HUNT BEGUN', shieldButton: 'SHIELD', fireButton: 'FIRE', mute: 'Mute or unmute audio', exitGame: 'Exit hunt and return to title', language: 'Language selection',
    levelDreadvale: 'Dreadvale Valley', levelBloodmoon: 'Bloodmoon Ruins', levelFrozen: 'Frozen Spires', levelSwamp: 'Drowned Darkwood', levelObsidian: 'Obsidian Crater', levelStorm: 'Storm Cliffs', levelHaunted: 'Haunted Forest', levelCathedral: 'Cathedral of the Abyss', levelEmber: 'Ember Citadel', levelThrone: 'Throne of Storms',
    rankNovice: 'Novice Hunter', rankScout: 'Night Scout', rankMarksman: 'Valley Marksman', rankWarden: 'Mist Warden', rankCrimson: 'Crimson Warden', rankStorm: 'Storm Hunter', rankSoulbreaker: 'Soulbreaker', rankDragonslayer: 'Dragonslayer', rankCommander: 'Night Commander', rankAncient: 'Ancient Dragon Sovereign',
    creatureWraith: 'Shadow Bat', creatureWyvern: 'Storm Wyvern', creatureDragon: 'Crimson Dragon', creatureFrost: 'Frost Dragon', creatureBone: 'Bone Dragon', creatureMagma: 'Magma Wyvern', creatureVoid: 'Void Serpent'
  },
  tr: {
    pageTitle: 'Kara Av: Ejderha Vadisi', valley: 'EJDERHA VADİSİ', title: 'KARA AV', subtitle: 'On seviye. On farklı diyar. Sayısız ejderha.', aim: 'FAREYLE NİŞAN AL', fireInstruction: 'Sol tuş: yayı ger ve ateş et  •  Sağ tuş / Shift: kalkan', start: 'BAŞLAMAK İÇİN TIKLA', pausedTitle: 'AV DURAKLATILDI', pausedMessage: 'Zaman, nişan ve yay gerişi olduğu yerde tutuluyor.', resume: 'AVA DEVAM ET', pauseHint: 'Devam etmek için Escape, Space veya tıkla', rankPromotion: 'RÜTBE ATLADIN', rankOath: 'AV SANA YENİ BİR UNVAN KAZANDIRDI',
    level: 'SEVİYE', hunt: 'AV', score: 'PUAN', health: 'CAN', shield: 'KALKAN', active: 'AKTİF', shieldHint: 'SAĞ TUŞ / SHIFT', arrows: 'OK', strongArrows: 'GÜÇLÜ OK ×{{count}}', seconds: '{{value}} sn', combo: '×{{count}} İSABET SERİSİ', newRegion: 'YENİ BÖLGEDE KARANLIK UYANIYOR', levelBanner: '{{level}}. SEVİYE', lowAmmo: 'OKLARIN TÜKENİYOR!',
    shieldBlocked: 'KALKAN BLOKLADI +{{points}}', shieldBroken: 'KALKAN KIRILDI!', airShot: 'HAVADA VURUŞ +{{points}}', critical: 'KRİTİK +{{points}}', points: '+{{points}}', defeated: '{{name}} DÜŞTÜ!', powerDrop: 'KIZIL GÜÇ: 3 GÜÇLÜ OK', ammoPlus: '+{{count}} OK', caughtInFire: 'ATEŞE YAKALANDIN!', comboSurge: 'AV İVMESİ ×{{count}}  •  +{{arrows}} GÜÇLÜ OK',
    valleySilent: 'VADİ YENİDEN SESSİZ', huntInterrupted: 'AV YARIM KALDI', ammoDepleted: 'MÜHİMMAT TÜKENDİ', huntComplete: 'AV TAMAMLANDI', arrowsFinished: 'OKLAR BİTTİ', hunterFallen: 'AVCI DÜŞTÜ', finalRank: 'SON RÜTBE: {{rank}}', creaturesHunted: '{{kills}} / {{total}} yaratık avlandı', levelsCount: '{{levels}} seviye', restart: 'YENİDEN AVLANMAK İÇİN TIKLA', rank: 'RÜTBE', campaignStarted: 'AV SEFERİ BAŞLADI', plusHealth: '  •  +1 CAN',
    reward: 'RÜTBE: {{rank}}  •  +{{ammo}} OK  •  KALKAN YENİLENDİ{{health}}', started: 'RÜTBE: {{rank}}  •  AV SEFERİ BAŞLADI', shieldButton: 'KALKAN', fireButton: 'ATEŞ', mute: 'Sesi aç veya kapat', exitGame: 'Avdan çık ve başlığa dön', language: 'Dil seçimi',
    levelDreadvale: 'Dreadvale Vadisi', levelBloodmoon: 'Kanlı Ay Harabeleri', levelFrozen: 'Buzul Sivri Kayalıkları', levelSwamp: 'Boğulmuş Karaorman', levelObsidian: 'Obsidyen Krateri', levelStorm: 'Fırtına Uçurumları', levelHaunted: 'Perili Orman', levelCathedral: 'Uçurum Katedrali', levelEmber: 'Kor Tahtı Kalesi', levelThrone: 'Fırtınaların Tahtı',
    rankNovice: 'Çaylak Avcı', rankScout: 'Gece İzci', rankMarksman: 'Vadi Nişancısı', rankWarden: 'Sis Muhafızı', rankCrimson: 'Kızıl Muhafız', rankStorm: 'Fırtına Avcısı', rankSoulbreaker: 'Ruh Kırıcı', rankDragonslayer: 'Ejderha Celladı', rankCommander: 'Gece Komutanı', rankAncient: 'Kadim Ejderha Hükümdarı',
    creatureWraith: 'Gölge Yarasa', creatureWyvern: 'Fırtına Wyvernı', creatureDragon: 'Kızıl Ejderha', creatureFrost: 'Buzul Ejderhası', creatureBone: 'Kemik Ejderha', creatureMagma: 'Lav Wyvernı', creatureVoid: 'Boşluk Yılanı'
  },
  de: {
    pageTitle: 'Dunkle Jagd: Drachental', valley: 'DRACHENTAL', title: 'DUNKLE JAGD', subtitle: 'Zehn Level. Zehn Reiche. Unzählige Drachen.', aim: 'MIT DER MAUS ZIELEN', fireInstruction: 'Linksklick: Bogen spannen und feuern  •  Rechtsklick / Shift: Schild', start: 'ZUM START KLICKEN', pausedTitle: 'JAGD PAUSIERT', pausedMessage: 'Zeit, Ziel und Spannung bleiben an Ort und Stelle.', resume: 'JAGD FORTSETZEN', pauseHint: 'Escape, Leertaste oder Klick zum Fortsetzen', rankPromotion: 'RANGAUFSTIEG', rankOath: 'DIE JAGD VERLEIHT DIR EINEN NEUEN TITEL',
    level: 'LEVEL', hunt: 'JAGD', score: 'PUNKTE', health: 'LEBEN', shield: 'SCHILD', active: 'AKTIV', shieldHint: 'RECHTSKLICK / SHIFT', arrows: 'PFEILE', strongArrows: 'MACHTPFEILE ×{{count}}', seconds: '{{value}} Sek.', combo: '×{{count}} KOMBO', newRegion: 'DIE DUNKELHEIT ERWACHT IN EINER NEUEN REGION', levelBanner: 'LEVEL {{level}}', lowAmmo: 'WENIGE PFEILE ÜBRIG!',
    shieldBlocked: 'SCHILD BLOCKT +{{points}}', shieldBroken: 'SCHILD ZERBROCHEN!', airShot: 'LUFTTREFFER +{{points}}', critical: 'KRITISCH +{{points}}', points: '+{{points}}', defeated: '{{name}} GEFALLEN!', powerDrop: 'KARMES MACHT: 3 MACHTPFEILE', ammoPlus: '+{{count}} PFEILE', caughtInFire: 'DU WURDEST VOM FEUER GETROFFEN!', comboSurge: 'JAGDIMPULS ×{{count}}  •  +{{arrows}} MACHTPFEILE',
    valleySilent: 'DAS TAL WIRD STILL', huntInterrupted: 'DIE JAGD ENDET', ammoDepleted: 'MUNITION ERSCHÖPFT', huntComplete: 'JAGD ABGESCHLOSSEN', arrowsFinished: 'PFEILE VERBRAUCHT', hunterFallen: 'JÄGER GEFALLEN', finalRank: 'ENDRANG: {{rank}}', creaturesHunted: '{{kills}} / {{total}} Kreaturen gejagt', levelsCount: '{{levels}} Level', restart: 'KLICKEN, UM ERNEUT ZU JAGEN', rank: 'RANG', campaignStarted: 'JAGD BEGINNT', plusHealth: '  •  +1 LEBEN',
    reward: 'RANG: {{rank}}  •  +{{ammo}} PFEILE  •  SCHILD ERNEUERT{{health}}', started: 'RANG: {{rank}}  •  JAGD BEGINNT', shieldButton: 'SCHILD', fireButton: 'FEUER', mute: 'Ton an oder aus', exitGame: 'Jagd beenden und zum Titel zurückkehren', language: 'Sprachauswahl',
    levelDreadvale: 'Dreadvale-Tal', levelBloodmoon: 'Ruinen des Blutmonds', levelFrozen: 'Gefrorene Spitzen', levelSwamp: 'Versunkenes Dunkelholz', levelObsidian: 'Obsidiankrater', levelStorm: 'Sturmklippen', levelHaunted: 'Geisterwald', levelCathedral: 'Kathedrale des Abgrunds', levelEmber: 'Glutzitadelle', levelThrone: 'Thron der Stürme',
    rankNovice: 'Neuer Jäger', rankScout: 'Nachtspäher', rankMarksman: 'Tal-Scharfschütze', rankWarden: 'Nebelwächter', rankCrimson: 'Purpurwächter', rankStorm: 'Sturmjäger', rankSoulbreaker: 'Seelenbrecher', rankDragonslayer: 'Drachentöter', rankCommander: 'Nachtkommandant', rankAncient: 'Uralter Drachenherrscher',
    creatureWraith: 'Schattenfledermaus', creatureWyvern: 'Sturmwyvern', creatureDragon: 'Purpurdrache', creatureFrost: 'Frostdrache', creatureBone: 'Knochendrache', creatureMagma: 'Magmawyvern', creatureVoid: 'Leerenwyrm'
  },
  fr: {
    pageTitle: 'Chasse Noire : Vallée des Dragons', valley: 'VALLÉE DES DRAGONS', title: 'CHASSE NOIRE', subtitle: 'Dix niveaux. Dix royaumes. Des dragons innombrables.', aim: 'VISEZ AVEC LA SOURIS', fireInstruction: 'Clic gauche : tendre et tirer  •  Clic droit / Shift : bouclier', start: 'CLIQUER POUR COMMENCER', pausedTitle: 'CHASSE EN PAUSE', pausedMessage: 'Le temps, la visée et la tension restent en place.', resume: 'REPRENDRE LA CHASSE', pauseHint: 'Appuyez sur Échap, Espace ou cliquez pour continuer', rankPromotion: 'PROMOTION DE RANG', rankOath: 'LA CHASSE VOUS ACCORDE UN NOUVEAU TITRE',
    level: 'NIVEAU', hunt: 'CHASSE', score: 'SCORE', health: 'VIE', shield: 'BOUCLIER', active: 'ACTIF', shieldHint: 'CLIC DROIT / SHIFT', arrows: 'FLÈCHES', strongArrows: 'FLÈCHES DE PUISSANCE ×{{count}}', seconds: '{{value}} s', combo: '×{{count}} COMBO', newRegion: 'LES TÉNÈBRES S’ÉVEILLENT DANS UNE NOUVELLE RÉGION', levelBanner: 'NIVEAU {{level}}', lowAmmo: 'PEU DE FLÈCHES RESTANTES !',
    shieldBlocked: 'BOUCLIER BLOQUÉ +{{points}}', shieldBroken: 'BOUCLIER BRISÉ !', airShot: 'TOUCHE AÉRIENNE +{{points}}', critical: 'CRITIQUE +{{points}}', points: '+{{points}}', defeated: '{{name}} TERRASSÉ !', powerDrop: 'POUVOIR CRAMOISI : 3 FLÈCHES DE PUISSANCE', ammoPlus: '+{{count}} FLÈCHES', caughtInFire: 'VOUS AVEZ ÉTÉ PRIS DANS LE FEU !', comboSurge: 'ÉLAN DE CHASSE ×{{count}}  •  +{{arrows}} FLÈCHES DE PUISSANCE',
    valleySilent: 'LA VALLÉE RETROUVE LE SILENCE', huntInterrupted: 'LA CHASSE S’ACHÈVE', ammoDepleted: 'MUNITIONS ÉPUISÉES', huntComplete: 'CHASSE TERMINÉE', arrowsFinished: 'PLUS DE FLÈCHES', hunterFallen: 'CHASSEUR TERRASSÉ', finalRank: 'RANG FINAL : {{rank}}', creaturesHunted: '{{kills}} / {{total}} créatures chassées', levelsCount: '{{levels}} niveaux', restart: 'CLIQUER POUR RECHASSER', rank: 'RANG', campaignStarted: 'LA CHASSE COMMENCE', plusHealth: '  •  +1 VIE',
    reward: 'RANG : {{rank}}  •  +{{ammo}} FLÈCHES  •  BOUCLIER RESTAURÉ{{health}}', started: 'RANG : {{rank}}  •  LA CHASSE COMMENCE', shieldButton: 'BOUCLIER', fireButton: 'FEU', mute: 'Activer ou couper le son', exitGame: 'Quitter la chasse et revenir au titre', language: 'Choix de la langue',
    levelDreadvale: 'Vallée de Dreadvale', levelBloodmoon: 'Ruines de la Lune Sanglante', levelFrozen: 'Cimes Gelées', levelSwamp: 'Bois Sombre Englouti', levelObsidian: 'Cratère d’Obsidienne', levelStorm: 'Falaises de la Tempête', levelHaunted: 'Forêt Hantée', levelCathedral: 'Cathédrale de l’Abîme', levelEmber: 'Citadelle des Braises', levelThrone: 'Trône des Tempêtes',
    rankNovice: 'Chasseur Novice', rankScout: 'Éclaireur de Nuit', rankMarksman: 'Tireur de la Vallée', rankWarden: 'Gardien des Brumes', rankCrimson: 'Gardien Cramoisi', rankStorm: 'Chasseur de Tempêtes', rankSoulbreaker: 'Briseur d’Âmes', rankDragonslayer: 'Tueur de Dragons', rankCommander: 'Commandant de Nuit', rankAncient: 'Souverain Dragon Ancestral',
    creatureWraith: 'Chauve-souris Ombreuse', creatureWyvern: 'Wyverne des Tempêtes', creatureDragon: 'Dragon Cramoisi', creatureFrost: 'Dragon de Givre', creatureBone: 'Dragon d’Os', creatureMagma: 'Wyverne de Magma', creatureVoid: 'Serpent du Néant'
  },
  es: {
    pageTitle: 'Caza Oscura: Valle de Dragones', valley: 'VALLE DE DRAGONES', title: 'CAZA OSCURA', subtitle: 'Diez niveles. Diez reinos. Dragones sin fin.', aim: 'APUNTA CON EL RATÓN', fireInstruction: 'Clic izquierdo: tensar y disparar  •  Clic derecho / Shift: escudo', start: 'HAZ CLIC PARA EMPEZAR', pausedTitle: 'CAZA EN PAUSA', pausedMessage: 'El tiempo, la puntería y la tensión quedan detenidos.', resume: 'CONTINUAR LA CAZA', pauseHint: 'Pulsa Escape, Espacio o haz clic para continuar', rankPromotion: 'ASCENSO DE RANGO', rankOath: 'LA CAZA TE CONCEDE UN NUEVO TÍTULO',
    level: 'NIVEL', hunt: 'CAZA', score: 'PUNTOS', health: 'SALUD', shield: 'ESCUDO', active: 'ACTIVO', shieldHint: 'CLIC DERECHO / SHIFT', arrows: 'FLECHAS', strongArrows: 'FLECHAS DE PODER ×{{count}}', seconds: '{{value}} s', combo: '×{{count}} COMBO', newRegion: 'LA OSCURIDAD DESPIERTA EN UNA NUEVA REGIÓN', levelBanner: 'NIVEL {{level}}', lowAmmo: '¡QUEDAN POCAS FLECHAS!',
    shieldBlocked: 'ESCUDO BLOQUEÓ +{{points}}', shieldBroken: '¡ESCUDO ROTO!', airShot: 'IMPACTO AÉREO +{{points}}', critical: 'CRÍTICO +{{points}}', points: '+{{points}}', defeated: '¡{{name}} DERROTADO!', powerDrop: 'PODER CARMESÍ: 3 FLECHAS DE PODER', ammoPlus: '+{{count}} FLECHAS', caughtInFire: '¡TE ALCANZÓ EL FUEGO!', comboSurge: 'IMPULSO DE CAZA ×{{count}}  •  +{{arrows}} FLECHAS DE PODER',
    valleySilent: 'EL VALLE QUEDA EN SILENCIO', huntInterrupted: 'LA CAZA TERMINA', ammoDepleted: 'MUNICIÓN AGOTADA', huntComplete: 'CAZA COMPLETADA', arrowsFinished: 'SIN FLECHAS', hunterFallen: 'CAZADOR CAÍDO', finalRank: 'RANGO FINAL: {{rank}}', creaturesHunted: '{{kills}} / {{total}} criaturas cazadas', levelsCount: '{{levels}} niveles', restart: 'HAZ CLIC PARA CAZAR DE NUEVO', rank: 'RANGO', campaignStarted: 'LA CAZA COMIENZA', plusHealth: '  •  +1 SALUD',
    reward: 'RANGO: {{rank}}  •  +{{ammo}} FLECHAS  •  ESCUDO RESTAURADO{{health}}', started: 'RANGO: {{rank}}  •  LA CAZA COMIENZA', shieldButton: 'ESCUDO', fireButton: 'FUEGO', mute: 'Activar o silenciar audio', exitGame: 'Salir de la caza y volver al título', language: 'Selección de idioma',
    levelDreadvale: 'Valle de Dreadvale', levelBloodmoon: 'Ruinas de la Luna Sangrienta', levelFrozen: 'Agujas Heladas', levelSwamp: 'Bosque Oscuro Inundado', levelObsidian: 'Cráter de Obsidiana', levelStorm: 'Acantilados de la Tormenta', levelHaunted: 'Bosque Encantado', levelCathedral: 'Catedral del Abismo', levelEmber: 'Ciudadela de Brasas', levelThrone: 'Trono de las Tormentas',
    rankNovice: 'Cazador Novato', rankScout: 'Explorador Nocturno', rankMarksman: 'Tirador del Valle', rankWarden: 'Guardián de la Niebla', rankCrimson: 'Guardián Carmesí', rankStorm: 'Cazador de Tormentas', rankSoulbreaker: 'Rompealmas', rankDragonslayer: 'Asesino de Dragones', rankCommander: 'Comandante Nocturno', rankAncient: 'Soberano Dragón Ancestral',
    creatureWraith: 'Murciélago Sombrío', creatureWyvern: 'Wyvern de Tormenta', creatureDragon: 'Dragón Carmesí', creatureFrost: 'Dragón de Hielo', creatureBone: 'Dragón Óseo', creatureMagma: 'Wyvern de Magma', creatureVoid: 'Serpiente del Vacío'
  },
  it: {
    pageTitle: 'Caccia Oscura: Valle dei Draghi', valley: 'VALLE DEI DRAGHI', title: 'CACCIA OSCURA', subtitle: 'Dieci livelli. Dieci regni. Draghi senza fine.', aim: 'MIRA CON IL MOUSE', fireInstruction: 'Clic sinistro: tendi e scocca  •  Clic destro / Shift: scudo', start: 'CLICCA PER INIZIARE', pausedTitle: 'CACCIA IN PAUSA', pausedMessage: 'Tempo, mira e tensione restano fermi al loro posto.', resume: 'RIPRENDI LA CACCIA', pauseHint: 'Premi Esc, Spazio o fai clic per continuare', rankPromotion: 'PROMOZIONE DI GRADO', rankOath: 'LA CACCIA TI CONCEDE UN NUOVO TITOLO',
    level: 'LIVELLO', hunt: 'CACCIA', score: 'PUNTI', health: 'SALUTE', shield: 'SCUDO', active: 'ATTIVO', shieldHint: 'CLIC DESTRO / SHIFT', arrows: 'FRECCE', strongArrows: 'FRECCE POTENZIATE ×{{count}}', seconds: '{{value}} s', combo: '×{{count}} COMBO', newRegion: 'L’OSCURITÀ SI RISVEGLIA IN UNA NUOVA REGIONE', levelBanner: 'LIVELLO {{level}}', lowAmmo: 'POCHE FRECCE RIMASTE!',
    shieldBlocked: 'SCUDO BLOCCATO +{{points}}', shieldBroken: 'SCUDO DISTRUTTO!', airShot: 'COLPO IN ARIA +{{points}}', critical: 'CRITICO +{{points}}', points: '+{{points}}', defeated: '{{name}} SCONFITTO!', powerDrop: 'POTERE CREMISI: 3 FRECCE POTENZIATE', ammoPlus: '+{{count}} FRECCE', caughtInFire: 'SEI STATO COLPITO DAL FUOCO!', comboSurge: 'SLANCIO DI CACCIA ×{{count}}  •  +{{arrows}} FRECCE POTENZIATE',
    valleySilent: 'LA VALLE TORNA SILENZIOSA', huntInterrupted: 'LA CACCIA FINISCE', ammoDepleted: 'MUNIZIONI ESAURITE', huntComplete: 'CACCIA COMPLETATA', arrowsFinished: 'FRECCE ESAURITE', hunterFallen: 'CACCIATORE CADUTO', finalRank: 'GRADO FINALE: {{rank}}', creaturesHunted: '{{kills}} / {{total}} creature cacciate', levelsCount: '{{levels}} livelli', restart: 'CLICCA PER CACCIARE ANCORA', rank: 'GRADO', campaignStarted: 'LA CACCIA INIZIA', plusHealth: '  •  +1 SALUTE',
    reward: 'GRADO: {{rank}}  •  +{{ammo}} FRECCE  •  SCUDO RIPRISTINATO{{health}}', started: 'GRADO: {{rank}}  •  LA CACCIA INIZIA', shieldButton: 'SCUDO', fireButton: 'FUOCO', mute: 'Attiva o disattiva audio', exitGame: 'Esci dalla caccia e torna al titolo', language: 'Selezione lingua',
    levelDreadvale: 'Valle di Dreadvale', levelBloodmoon: 'Rovine della Luna Rossa', levelFrozen: 'Guglie Gelate', levelSwamp: 'Bosco Oscuro Sommerso', levelObsidian: 'Cratere di Ossidiana', levelStorm: 'Scogliere della Tempesta', levelHaunted: 'Foresta Infestata', levelCathedral: 'Cattedrale dell’Abisso', levelEmber: 'Cittadella delle Braci', levelThrone: 'Trono delle Tempeste',
    rankNovice: 'Cacciatore Novizio', rankScout: 'Esploratore Notturno', rankMarksman: 'Tiratore della Valle', rankWarden: 'Guardiano della Nebbia', rankCrimson: 'Guardiano Cremisi', rankStorm: 'Cacciatore di Tempeste', rankSoulbreaker: 'Spezzanime', rankDragonslayer: 'Uccisore di Draghi', rankCommander: 'Comandante della Notte', rankAncient: 'Sovrano dei Draghi Antichi',
    creatureWraith: 'Pipistrello Ombra', creatureWyvern: 'Viverna della Tempesta', creatureDragon: 'Drago Cremisi', creatureFrost: 'Drago del Gelo', creatureBone: 'Drago d’Ossa', creatureMagma: 'Viverna di Magma', creatureVoid: 'Serpente del Vuoto'
  },
  pt: {
    pageTitle: 'Caçada Sombria: Vale dos Dragões', valley: 'VALE DOS DRAGÕES', title: 'CAÇADA SOMBRIA', subtitle: 'Dez níveis. Dez reinos. Dragões incontáveis.', aim: 'MIRE COM O MOUSE', fireInstruction: 'Clique esquerdo: tensionar e disparar  •  Clique direito / Shift: escudo', start: 'CLIQUE PARA COMEÇAR', pausedTitle: 'CAÇADA PAUSADA', pausedMessage: 'O tempo, a mira e a tensão ficam exatamente onde estavam.', resume: 'CONTINUAR A CAÇADA', pauseHint: 'Pressione Escape, Espaço ou clique para continuar', rankPromotion: 'PROMOÇÃO DE PATENTE', rankOath: 'A CAÇADA LHE CONCEDE UM NOVO TÍTULO',
    level: 'NÍVEL', hunt: 'CAÇADA', score: 'PONTOS', health: 'VIDA', shield: 'ESCUDO', active: 'ATIVO', shieldHint: 'CLIQUE DIREITO / SHIFT', arrows: 'FLECHAS', strongArrows: 'FLECHAS DE PODER ×{{count}}', seconds: '{{value}} s', combo: '×{{count}} COMBO', newRegion: 'A ESCURIDÃO DESPERTA EM UMA NOVA REGIÃO', levelBanner: 'NÍVEL {{level}}', lowAmmo: 'POUCAS FLECHAS RESTANTES!',
    shieldBlocked: 'ESCUDO BLOQUEOU +{{points}}', shieldBroken: 'ESCUDO QUEBRADO!', airShot: 'ACERTO NO AR +{{points}}', critical: 'CRÍTICO +{{points}}', points: '+{{points}}', defeated: '{{name}} DERROTADO!', powerDrop: 'PODER CARMESIM: 3 FLECHAS DE PODER', ammoPlus: '+{{count}} FLECHAS', caughtInFire: 'VOCÊ FOI ATINGIDO PELO FOGO!', comboSurge: 'ÍMPETO DA CAÇADA ×{{count}}  •  +{{arrows}} FLECHAS DE PODER',
    valleySilent: 'O VALE FICA EM SILÊNCIO', huntInterrupted: 'A CAÇADA TERMINA', ammoDepleted: 'MUNIÇÃO ESGOTADA', huntComplete: 'CAÇADA CONCLUÍDA', arrowsFinished: 'SEM FLECHAS', hunterFallen: 'CAÇADOR DERROTADO', finalRank: 'PATENTE FINAL: {{rank}}', creaturesHunted: '{{kills}} / {{total}} criaturas caçadas', levelsCount: '{{levels}} níveis', restart: 'CLIQUE PARA CAÇAR NOVAMENTE', rank: 'PATENTE', campaignStarted: 'A CAÇADA COMEÇOU', plusHealth: '  •  +1 VIDA',
    reward: 'PATENTE: {{rank}}  •  +{{ammo}} FLECHAS  •  ESCUDO RESTAURADO{{health}}', started: 'PATENTE: {{rank}}  •  A CAÇADA COMEÇOU', shieldButton: 'ESCUDO', fireButton: 'FOGO', mute: 'Ativar ou silenciar áudio', exitGame: 'Sair da caçada e voltar ao título', language: 'Seleção de idioma',
    levelDreadvale: 'Vale Dreadvale', levelBloodmoon: 'Ruínas da Lua de Sangue', levelFrozen: 'Pináculos Congelados', levelSwamp: 'Floresta Negra Submersa', levelObsidian: 'Cratera de Obsidiana', levelStorm: 'Penhascos da Tempestade', levelHaunted: 'Floresta Assombrada', levelCathedral: 'Catedral do Abismo', levelEmber: 'Cidadela das Brasas', levelThrone: 'Trono das Tempestades',
    rankNovice: 'Caçador Novato', rankScout: 'Batedor Noturno', rankMarksman: 'Atirador do Vale', rankWarden: 'Guardião da Névoa', rankCrimson: 'Guardião Carmesim', rankStorm: 'Caçador da Tempestade', rankSoulbreaker: 'Quebra-Almas', rankDragonslayer: 'Matador de Dragões', rankCommander: 'Comandante Noturno', rankAncient: 'Soberano dos Dragões Antigos',
    creatureWraith: 'Morcego Sombrio', creatureWyvern: 'Wyvern da Tempestade', creatureDragon: 'Dragão Carmesim', creatureFrost: 'Dragão de Gelo', creatureBone: 'Dragão de Ossos', creatureMagma: 'Wyvern de Magma', creatureVoid: 'Serpente do Vazio'
  }
};

const EXTRA_I18N = {
  en: {
    chapterMedal: 'CHAPTER MEDAL', medalClear: 'CLEAR', medalClean: 'UNHARMED', medalPerfect: 'PERFECT', medals: 'MEDALS',
    shadowAmbush: 'SHADOW AMBUSH', shadowDefeated: 'SHADOW AMBUSH SLAIN +{{points}}', perfectShot: 'PERFECT SHOT +{{points}}',
    registry: 'HUNTER REGISTRY', registrySummary: 'REGISTRY  •  {{medals}}/{{total}} MEDALS  •  SHADOW AMBUSHES {{shadow}}  •  PERFECT {{perfect}}',
    medalEarned: 'CHAPTER MEDAL +{{points}}', recordUpdated: 'HUNTER RECORD UPDATED',
    chapterVictory: 'CHAPTER VICTORY', nextChapter: 'THE NEXT CHAPTER AWAITS', hunterDeath: 'THE HUNTER HAS FALLEN',
    arrowsDepleted: 'NO ARROWS REMAIN', dragonStrike: 'THE DRAGON STRUCK YOU!', transitionHint: 'THE HUNT CONTINUES', bossTitle: 'CHAPTER BOSS', bossEncounter: 'A SPECIAL DRAGON AWAKENS',
    bossDreadheart: 'Dreadheart, the Crimson Maw', bossTempestCrown: 'Tempest Crown, Breaker of Skies', bossFrostveil: 'Frostveil, the Pale Wyrm', bossGravewing: 'Gravewing, Lord of Bones', bossCindermaw: 'Cindermaw, the Ember Tyrant', bossCliffbreaker: 'Cliffbreaker, Lord of the Gale', bossNullfang: 'Nullfang, the Void Coil', bossCathedralWyrm: 'The Cathedral Wyrm', bossEmberTyrant: 'Ember Tyrant Ascendant', bossAncientSovereign: 'The Ancient Storm Sovereign'
  },
  tr: {
    chapterMedal: 'BÖLÜM MADALYASI', medalClear: 'TEMİZLİK', medalClean: 'HASARSIZ', medalPerfect: 'KUSURSUZ', medals: 'MADALYALAR',
    shadowAmbush: 'GÖLGE PUSUSU', shadowDefeated: 'GÖLGE PUSUSU AVLADI +{{points}}', perfectShot: 'KUSURSUZ ATIŞ +{{points}}',
    registry: 'AVCI SİCİLİ', registrySummary: 'SİCİL  •  {{medals}}/{{total}} MADALYA  •  GÖLGE PUSUSU {{shadow}}  •  KUSURSUZ {{perfect}}',
    medalEarned: 'BÖLÜM MADALYASI +{{points}}', recordUpdated: 'AVCI SİCİLİ GÜNCELLENDİ',
    chapterVictory: 'BÖLÜM ZAFERİ', nextChapter: 'SONRAKİ BÖLÜM SENİ BEKLİYOR', hunterDeath: 'AVCI ÖLDÜ',
    arrowsDepleted: 'OKLAR TÜKENDİ', dragonStrike: 'EJDERHA SANA VURDU!', transitionHint: 'AV SÜRÜYOR', bossTitle: 'BÖLÜM SONU CANAVARI', bossEncounter: 'ÖZEL EJDERHA UYANIYOR',
    bossDreadheart: 'Dreadheart, Kızıl Çene', bossTempestCrown: 'Fırtına Tacı, Gökyüzü Kıran', bossFrostveil: 'Buzperdesi, Solgun Wyrm', bossGravewing: 'Mezar Kanadı, Kemiklerin Efendisi', bossCindermaw: 'Külçene, Kor Tiranı', bossCliffbreaker: 'Uçurum Kıran, Gâle Efendisi', bossNullfang: 'Yokdiş, Boşluk Sarmalı', bossCathedralWyrm: 'Katedral Wyrmı', bossEmberTyrant: 'Kor Tiranı Yükseliyor', bossAncientSovereign: 'Kadim Fırtına Hükümdarı'
  },
  de: {
    chapterMedal: 'KAPITELMEDAILLE', medalClear: 'ABSCHLUSS', medalClean: 'UNVERLETZT', medalPerfect: 'PERFEKT', medals: 'MEDAILLEN',
    shadowAmbush: 'SCHATTENHINTERHALT', shadowDefeated: 'SCHATTENHINTERHALT BESIEGT +{{points}}', perfectShot: 'PERFEKTER SCHUSS +{{points}}',
    registry: 'JÄGERREGISTER', registrySummary: 'REGISTER  •  {{medals}}/{{total}} MEDAILLEN  •  SCHATTENHINTERHALTE {{shadow}}  •  PERFEKT {{perfect}}',
    medalEarned: 'KAPITELMEDAILLE +{{points}}', recordUpdated: 'JÄGERREGISTER AKTUALISIERT',
    chapterVictory: 'KAPITELSIEG', nextChapter: 'DAS NÄCHSTE KAPITEL WARTET', hunterDeath: 'DER JÄGER IST GEFALLEN',
    arrowsDepleted: 'KEINE PFEILE ÜBRIG', dragonStrike: 'DER DRACHE HAT DICH GETROFFEN!', transitionHint: 'DIE JAGD GEHT WEITER', bossTitle: 'KAPITELBOSS', bossEncounter: 'EIN BESONDERER DRACHE ERWACHT',
    bossDreadheart: 'Dreadheart, der Purpurschlund', bossTempestCrown: 'Sturmkrone, Himmelsbrecher', bossFrostveil: 'Frostschleier, der bleiche Wyrm', bossGravewing: 'Grabflügel, Herr der Knochen', bossCindermaw: 'Glutmaul, der Embertyrann', bossCliffbreaker: 'Klippenbrecher, Herr des Sturms', bossNullfang: 'Nichtigzahn, die Leerenwindung', bossCathedralWyrm: 'Der Kathedralenwyrm', bossEmberTyrant: 'Der aufgestiegene Gluttyrann', bossAncientSovereign: 'Der Uralte Sturmthron'
  },
  fr: {
    chapterMedal: 'MÉDAILLE DE CHAPITRE', medalClear: 'VICTOIRE', medalClean: 'INDEMNE', medalPerfect: 'PARFAIT', medals: 'MÉDAILLES',
    shadowAmbush: 'EMBUSCADE D’OMBRE', shadowDefeated: 'EMBUSCADE D’OMBRE VAINCUE +{{points}}', perfectShot: 'TIR PARFAIT +{{points}}',
    registry: 'REGISTRE DU CHASSEUR', registrySummary: 'REGISTRE  •  {{medals}}/{{total}} MÉDAILLES  •  EMBUSCADES {{shadow}}  •  PARFAITS {{perfect}}',
    medalEarned: 'MÉDAILLE DE CHAPITRE +{{points}}', recordUpdated: 'REGISTRE MIS À JOUR',
    chapterVictory: 'VICTOIRE DU CHAPITRE', nextChapter: 'LE PROCHAIN CHAPITRE VOUS ATTEND', hunterDeath: 'LE CHASSEUR EST TOMBÉ',
    arrowsDepleted: 'PLUS DE FLÈCHES', dragonStrike: 'LE DRAGON VOUS A FRAPPÉ !', transitionHint: 'LA CHASSE CONTINUE', bossTitle: 'BOSS DU CHAPITRE', bossEncounter: 'UN DRAGON SPÉCIAL S’ÉVEILLE',
    bossDreadheart: 'Dreadheart, la Gueule Cramoisie', bossTempestCrown: 'Couronne Tempête, Brise-Ciel', bossFrostveil: 'Voile-Givre, le Wyrm Pâle', bossGravewing: 'Aile-Tombe, Seigneur des Os', bossCindermaw: 'Gueule de Braise, le Tyran', bossCliffbreaker: 'Brise-Falaise, Seigneur des Vents', bossNullfang: 'Croc-Néant, la Spirale du Vide', bossCathedralWyrm: 'Le Wyrm de la Cathédrale', bossEmberTyrant: 'Le Tyran des Braises Ascendant', bossAncientSovereign: 'L’Ancien Souverain des Tempêtes'
  },
  es: {
    chapterMedal: 'MEDALLA DE CAPÍTULO', medalClear: 'VICTORIA', medalClean: 'ILESO', medalPerfect: 'PERFECTO', medals: 'MEDALLAS',
    shadowAmbush: 'EMBOSCADA SOMBRÍA', shadowDefeated: 'EMBOSCADA SOMBRÍA VENCIDA +{{points}}', perfectShot: 'DISPARO PERFECTO +{{points}}',
    registry: 'REGISTRO DEL CAZADOR', registrySummary: 'REGISTRO  •  {{medals}}/{{total}} MEDALLAS  •  EMBOSCADAS {{shadow}}  •  PERFECTOS {{perfect}}',
    medalEarned: 'MEDALLA DE CAPÍTULO +{{points}}', recordUpdated: 'REGISTRO ACTUALIZADO',
    chapterVictory: 'VICTORIA DEL CAPÍTULO', nextChapter: 'EL PRÓXIMO CAPÍTULO TE ESPERA', hunterDeath: 'EL CAZADOR HA CAÍDO',
    arrowsDepleted: 'NO QUEDAN FLECHAS', dragonStrike: '¡EL DRAGÓN TE GOLPEÓ!', transitionHint: 'LA CAZA CONTINÚA', bossTitle: 'JEFE DEL CAPÍTULO', bossEncounter: 'UN DRAGÓN ESPECIAL DESPIERTA',
    bossDreadheart: 'Dreadheart, la Mandíbula Carmesí', bossTempestCrown: 'Corona Tempestad, Rompe-Cielos', bossFrostveil: 'Velo de Escarcha, el Wyrm Pálido', bossGravewing: 'Ala Tumba, Señor de los Huesos', bossCindermaw: 'Fauce de Brasa, el Tirano', bossCliffbreaker: 'Rompeacantilados, Señor del Vendaval', bossNullfang: 'Colmillo Nulo, la Espiral del Vacío', bossCathedralWyrm: 'El Wyrm de la Catedral', bossEmberTyrant: 'El Tirano de Brasas Ascendido', bossAncientSovereign: 'El Soberano Antiguo de la Tormenta'
  },
  it: {
    chapterMedal: 'MEDAGLIA DEL CAPITOLO', medalClear: 'VITTORIA', medalClean: 'INDENNE', medalPerfect: 'PERFETTO', medals: 'MEDAGLIE',
    shadowAmbush: 'IMBOSCATA D’OMBRA', shadowDefeated: 'IMBOSCATA D’OMBRA SCONFITTA +{{points}}', perfectShot: 'TIRO PERFETTO +{{points}}',
    registry: 'REGISTRO DEL CACCIATORE', registrySummary: 'REGISTRO  •  {{medals}}/{{total}} MEDAGLIE  •  IMBOSCATE {{shadow}}  •  PERFETTI {{perfect}}',
    medalEarned: 'MEDAGLIA DEL CAPITOLO +{{points}}', recordUpdated: 'REGISTRO AGGIORNATO',
    chapterVictory: 'VITTORIA DEL CAPITOLO', nextChapter: 'IL PROSSIMO CAPITOLO TI ATTENDE', hunterDeath: 'IL CACCIATORE È CADUTO',
    arrowsDepleted: 'NESSUNA FRECCIA RIMASTA', dragonStrike: 'IL DRAGO TI HA COLPITO!', transitionHint: 'LA CACCIA CONTINUA', bossTitle: 'BOSS DEL CAPITOLO', bossEncounter: 'UN DRAGO SPECIALE SI RISVEGLIA',
    bossDreadheart: 'Dreadheart, la Mascella Cremisi', bossTempestCrown: 'Corona della Tempesta, Spezza-Cieli', bossFrostveil: 'Velo di Gelo, il Wyrm Pallido', bossGravewing: 'Ala Tomba, Signore delle Ossa', bossCindermaw: 'Mascella di Brace, il Tiranno', bossCliffbreaker: 'Spezza-Scogliere, Signore dei Venti', bossNullfang: 'Zanna Nulla, la Spirale del Vuoto', bossCathedralWyrm: 'Il Wyrm della Cattedrale', bossEmberTyrant: 'Il Tiranno delle Braci Ascendente', bossAncientSovereign: 'L’Antico Sovrano delle Tempeste'
  },
  pt: {
    chapterMedal: 'MEDALHA DO CAPÍTULO', medalClear: 'VITÓRIA', medalClean: 'ILESO', medalPerfect: 'PERFEITO', medals: 'MEDALHAS',
    shadowAmbush: 'EMBOSCADA SOMBRIA', shadowDefeated: 'EMBOSCADA SOMBRIA DERROTADA +{{points}}', perfectShot: 'DISPARO PERFEITO +{{points}}',
    registry: 'REGISTRO DO CAÇADOR', registrySummary: 'REGISTRO  •  {{medals}}/{{total}} MEDALHAS  •  EMBOSCADAS {{shadow}}  •  PERFEITOS {{perfect}}',
    medalEarned: 'MEDALHA DO CAPÍTULO +{{points}}', recordUpdated: 'REGISTRO ATUALIZADO',
    chapterVictory: 'VITÓRIA DO CAPÍTULO', nextChapter: 'O PRÓXIMO CAPÍTULO AGUARDA', hunterDeath: 'O CAÇADOR CAIU',
    arrowsDepleted: 'NÃO RESTAM FLECHAS', dragonStrike: 'O DRAGÃO ATINGIU VOCÊ!', transitionHint: 'A CAÇADA CONTINUA', bossTitle: 'CHEFE DO CAPÍTULO', bossEncounter: 'UM DRAGÃO ESPECIAL DESPERTA',
    bossDreadheart: 'Dreadheart, a Mandíbula Carmesim', bossTempestCrown: 'Coroa da Tempestade, Quebra-Céus', bossFrostveil: 'Véu de Gelo, o Wyrm Pálido', bossGravewing: 'Asa-Túmulo, Senhor dos Ossos', bossCindermaw: 'Mandíbula de Brasa, o Tirano', bossCliffbreaker: 'Quebra-Penhascos, Senhor do Vendaval', bossNullfang: 'Presa Nula, a Espiral do Vazio', bossCathedralWyrm: 'O Wyrm da Catedral', bossEmberTyrant: 'O Tirano das Brasas Ascendente', bossAncientSovereign: 'O Antigo Soberano das Tempestades'
  }
};
const GUIDE_I18N = {
  en: {
    chapterBriefing: 'CHAPTER BRIEFING', briefingHint: 'CLICK OR PRESS SPACE TO ENTER THE HUNT', guideSage: 'Elder Maeron', guideWarrior: 'Captain Veyra', guideScout: 'Nell the Valley Scout', guideOracle: 'The Veiled Oracle',
    guidePraisePerfect: 'Excellent shot! That is how a dragon falls.', guidePraiseHit: 'A clean hit. Keep your rhythm, hunter.', guideMiss: 'Too wide. Breathe, lead the target, and try again.', guideDanger: 'The fire is upon you. Raise the ward!', guideShield: 'Good. Let the ward drink the flame.',
    briefingText1: 'Hunter, Dreadvale is waking. The shadow bats are small, but the storm wyvern will test your first shot.', briefingText2: 'Bloodmoon Ruins hide a shadow ambush. Keep your eyes high, hunter, and save your shield for the fire.', briefingText3: 'The Frozen Spires turn every wing into a blade. Frost dragons are slow, but their breath leaves no room for error.', briefingText4: 'The Drowned Darkwood is full of false movement. Trust the flight path, not the mist, and watch the bone dragon\'s aim.', briefingText5: 'Obsidian Crater burns beneath the wings. Magma wyverns strike fast, and the shadow ambush will come when you feel safe.', briefingText6: 'Storm Cliffs give the creatures the high ground. Track the frost and magma flyers, then break the dragon before it fires.', briefingText7: 'In the Haunted Forest, the Void Serpent bends the dark around it. Do not chase the illusion; wait for the true body.', briefingText8: 'The Cathedral of the Abyss remembers every miss. Bone, flame and void will surround you, and the shadow will strike from silence.', briefingText9: 'Ember Citadel is the forge of the final hunt. Hold your nerve, use every power arrow, and make each dragon count.', briefingText10: 'At the Throne of Storms, every lesson ends. The sky will bring frost, bone, magma and the void. Stand ready, hunter.'
  },
  tr: {
    chapterBriefing: 'BÖLÜM BRİFİNGİ', briefingHint: 'AVA GİRMEK İÇİN TIKLA VEYA SPACE\'E BAS', guideSage: 'Bilge Maeron', guideWarrior: 'Yüzbaşı Veyra', guideScout: 'Vadi Gözcüsü Nell', guideOracle: 'Peçeli Kâhin',
    guidePraisePerfect: 'Mükemmel atış! Bir ejderha böyle düşer.', guidePraiseHit: 'Temiz isabet. Ritmini koru, avcı.', guideMiss: 'Çok geniş. Nefes al, hedefin önüne nişanla ve tekrar dene.', guideDanger: 'Ateş üzerimize geliyor. Tılsımı kaldır!', guideShield: 'İyi. Kalkan alevi emsin.',
    briefingText1: 'Avcı, Dreadvale uyanıyor. Gölge yarasalar küçük; ama fırtına wyvernı ilk atışını sınayacak.', briefingText2: 'Kanlı Ay Harabeleri bir gölge pususu saklıyor. Gözlerini yukarıda tut ve kalkanını ateş için sakla.', briefingText3: 'Buzul Sivri Kayalıkları her kanadı bir bıçağa çeviriyor. Buz ejderhaları yavaş, ama nefesleri hata affetmez.', briefingText4: 'Boğulmuş Karaorman sahte hareketlerle dolu. Sise değil uçuş yoluna güven ve kemik ejderhanın nişanına dikkat et.', briefingText5: 'Obsidyen Krateri kanatların altında yanıyor. Lav wyvernları hızlı vurur; gölge pususu da kendini güvende hissettiğinde gelir.', briefingText6: 'Fırtına Uçurumları yaratıklara yüksek zemin veriyor. Buz ve lav uçanlarını izle, ejderha ateş etmeden onu düşür.', briefingText7: 'Perili Ormanda Boşluk Yılanı karanlığı büküyor. Yanılsamayı kovalama; gerçek gövdeyi bekle.', briefingText8: 'Uçurum Katedrali her ıskayı hatırlar. Kemik, alev ve boşluk seni saracak; gölge sessizlikten vuracak.', briefingText9: 'Kor Tahtı Kalesi son avın ocağıdır. Cesaretini koru, güçlü oklarını kullan ve her ejderhayı say.', briefingText10: 'Fırtınaların Tahtında her ders sona erer. Gökyüzü buz, kemik, lav ve boşluk getirecek. Hazır ol, avcı.'
  },
  de: {
    chapterBriefing: 'KAPITELBRIEFING', briefingHint: 'KLICKEN ODER LEERTASTE DRÜCKEN', guideSage: 'Weiser Maeron', guideWarrior: 'Hauptfrau Veyra', guideScout: 'Talspäherin Nell', guideOracle: 'Die Verhüllte Seherin',
    guidePraisePerfect: 'Hervorragender Schuss! So fällt ein Drache.', guidePraiseHit: 'Sauber getroffen. Halte deinen Rhythmus.', guideMiss: 'Zu weit. Ruhig atmen, vor das Ziel zielen, erneut versuchen.', guideDanger: 'Das Feuer ist da. Hebe den Schild!', guideShield: 'Gut. Lass den Schild die Flammen trinken.',
    briefingText1: 'Jäger, Dreadvale erwacht. Die Schattenfledermäuse sind klein, doch der Sturmwyvern prüft deinen ersten Schuss.', briefingText2: 'Die Ruinen des Blutmonds verbergen einen Hinterhalt. Augen nach oben und den Schild für das Feuer sparen.', briefingText3: 'Die Gefrorenen Spitzen machen aus jedem Flügel eine Klinge. Frost ist langsam, aber sein Atem verzeiht keinen Fehler.', briefingText4: 'Das versunkene Dunkelholz ist voller falscher Bewegung. Vertraue dem Flugweg, nicht dem Nebel, und achte auf den Knochendrachen.', briefingText5: 'Der Obsidiankrater brennt unter den Flügeln. Magmawyvern schlagen schnell zu; der Schatten kommt, wenn du dich sicher fühlst.', briefingText6: 'Die Sturmklippen geben den Kreaturen den Höhenvorteil. Beobachte Frost und Magma und brich den Drachen, bevor er feuert.', briefingText7: 'Im Geisterwald biegt der Leerenwyrm die Dunkelheit. Jage nicht die Täuschung; warte auf den echten Körper.', briefingText8: 'Die Kathedrale des Abgrunds erinnert sich an jeden Fehlschuss. Knochen, Flamme und Leere werden dich umgeben.', briefingText9: 'Die Glutzitadelle ist die Schmiede der letzten Jagd. Bleib standhaft, nutze Machtpfeile und zähle jeden Drachen.', briefingText10: 'Am Thron der Stürme endet jede Lektion. Frost, Knochen, Magma und Leere kommen. Sei bereit, Jäger.'
  },
  fr: {
    chapterBriefing: 'BRIEFING DU CHAPITRE', briefingHint: 'CLIQUEZ OU APPUYEZ SUR ESPACE', guideSage: 'Sage Maeron', guideWarrior: 'Capitaine Veyra', guideScout: 'Nell, l’éclaireuse de la vallée', guideOracle: 'L’Oracle Voilée',
    guidePraisePerfect: 'Tir parfait ! Voilà comment tombe un dragon.', guidePraiseHit: 'Touché net. Garde ton rythme.', guideMiss: 'Trop loin. Respire, vise devant la cible et recommence.', guideDanger: 'Le feu arrive. Lève la protection !', guideShield: 'Bien. Que la protection boive les flammes.',
    briefingText1: 'Chasseur, Dreadvale s’éveille. Les chauves-souris sont petites, mais la wyverne testera ton premier tir.', briefingText2: 'Les ruines de la Lune Sanglante cachent une embuscade. Garde les yeux en l’air et le bouclier pour le feu.', briefingText3: 'Les Cimes Gelées transforment chaque aile en lame. Les dragons de givre sont lents, mais leur souffle ne pardonne pas.', briefingText4: 'Le Bois Sombre englouti est plein de faux mouvements. Suis le vol, pas la brume, et surveille le dragon d’os.', briefingText5: 'Le cratère d’Obsidienne brûle sous les ailes. Les wyvernes de magma frappent vite, et l’ombre attendra ton relâchement.', briefingText6: 'Les falaises donnent la hauteur aux créatures. Suis le givre et le magma, puis brise le dragon avant son feu.', briefingText7: 'Dans la forêt hantée, le serpent du Néant tord les ténèbres. Ne poursuis pas l’illusion; attends le vrai corps.', briefingText8: 'La cathédrale se souvient de chaque tir manqué. Os, flamme et néant t’encercleront en silence.', briefingText9: 'La citadelle des braises forge la dernière chasse. Garde ton courage et utilise chaque flèche de puissance.', briefingText10: 'Au trône des tempêtes, chaque leçon s’achève. Givre, os, magma et néant arrivent. Sois prêt.'
  },
  es: {
    chapterBriefing: 'INFORME DEL CAPÍTULO', briefingHint: 'HAZ CLIC O PULSA ESPACIO', guideSage: 'Sabio Maeron', guideWarrior: 'Capitana Veyra', guideScout: 'Nell, exploradora del valle', guideOracle: 'La Oráculo Velada',
    guidePraisePerfect: '¡Disparo excelente! Así cae un dragón.', guidePraiseHit: 'Buen impacto. Mantén el ritmo.', guideMiss: 'Demasiado lejos. Respira, apunta delante y vuelve a intentarlo.', guideDanger: '¡El fuego llega! ¡Alza la protección!', guideShield: 'Bien. Deja que el escudo beba las llamas.',
    briefingText1: 'Cazador, Dreadvale despierta. Los murciélagos son pequeños, pero el wyvern pondrá a prueba tu primer disparo.', briefingText2: 'Las ruinas de la Luna Sangrienta esconden una emboscada. Mira arriba y guarda el escudo para el fuego.', briefingText3: 'Las Agujas Heladas vuelven cada ala una hoja. Los dragones de hielo son lentos, pero su aliento no perdona.', briefingText4: 'El Bosque Oscuro está lleno de falsos movimientos. Confía en el vuelo, no en la niebla, y vigila al dragón óseo.', briefingText5: 'El cráter de obsidiana arde bajo las alas. Los wyverns de magma atacan rápido y la sombra espera tu descuido.', briefingText6: 'Los acantilados dan altura a las criaturas. Sigue al hielo y al magma y rompe al dragón antes de que dispare.', briefingText7: 'En el bosque encantado, la serpiente del vacío dobla la oscuridad. No persigas la ilusión; espera al cuerpo real.', briefingText8: 'La catedral recuerda cada fallo. Hueso, fuego y vacío te rodearán, y la sombra atacará en silencio.', briefingText9: 'La ciudadela de brasas forja la última caza. Mantén el valor y usa cada flecha de poder.', briefingText10: 'En el Trono de las Tormentas termina cada lección. Hielo, hueso, magma y vacío llegarán. Prepárate.'
  },
  it: {
    chapterBriefing: 'BRIEFING DEL CAPITOLO', briefingHint: 'CLICCA O PREMI SPAZIO', guideSage: 'Saggio Maeron', guideWarrior: 'Capitana Veyra', guideScout: 'Nell, esploratrice della valle', guideOracle: 'L’Oracolo Velata',
    guidePraisePerfect: 'Tiro perfetto! Così cade un drago.', guidePraiseHit: 'Colpo pulito. Mantieni il ritmo.', guideMiss: 'Troppo largo. Respira, mira davanti al bersaglio e riprova.', guideDanger: 'Il fuoco è qui. Alza la protezione!', guideShield: 'Bene. Lascia che lo scudo beva le fiamme.',
    briefingText1: 'Cacciatore, Dreadvale si sveglia. I pipistrelli sono piccoli, ma la viverna metterà alla prova il tuo primo tiro.', briefingText2: 'Le rovine della Luna Rossa nascondono un’imboscata. Guarda in alto e conserva lo scudo per il fuoco.', briefingText3: 'Le Guglie Gelate trasformano ogni ala in una lama. I draghi del gelo sono lenti, ma il loro respiro non perdona.', briefingText4: 'Il Bosco Sommerso è pieno di movimenti falsi. Fidati del volo, non della nebbia, e osserva il drago d’ossa.', briefingText5: 'Il cratere d’ossidiana brucia sotto le ali. Le viverne di magma colpiscono in fretta, e l’ombra attende il tuo errore.', briefingText6: 'Le scogliere danno altezza alle creature. Segui gelo e magma, poi spezza il drago prima che spari.', briefingText7: 'Nella foresta infestata, il serpente del vuoto piega l’oscurità. Non inseguire l’illusione; attendi il corpo vero.', briefingText8: 'La cattedrale ricorda ogni tiro mancato. Ossa, fiamme e vuoto ti circonderanno in silenzio.', briefingText9: 'La cittadella delle braci forgia l’ultima caccia. Resisti e usa ogni freccia potenziata.', briefingText10: 'Al Trono delle Tempeste finisce ogni lezione. Gelo, ossa, magma e vuoto arriveranno. Preparati.'
  },
  pt: {
    chapterBriefing: 'BRIEFING DO CAPÍTULO', briefingHint: 'CLIQUE OU PRESSIONE ESPAÇO', guideSage: 'Sábio Maeron', guideWarrior: 'Capitã Veyra', guideScout: 'Nell, batedora do vale', guideOracle: 'A Oráculo Velada',
    guidePraisePerfect: 'Disparo perfeito! É assim que um dragão cai.', guidePraiseHit: 'Acerto limpo. Mantenha o ritmo.', guideMiss: 'Muito longe. Respire, mire à frente e tente novamente.', guideDanger: 'O fogo chegou. Erga a proteção!', guideShield: 'Muito bem. Deixe o escudo beber as chamas.',
    briefingText1: 'Caçador, Dreadvale desperta. Os morcegos são pequenos, mas a wyvern testará seu primeiro disparo.', briefingText2: 'As ruínas da Lua de Sangue escondem uma emboscada. Olhe para cima e guarde o escudo para o fogo.', briefingText3: 'Os Pináculos Congelados tornam cada asa uma lâmina. Dragões de gelo são lentos, mas seu sopro não perdoa.', briefingText4: 'A Floresta Negra está cheia de movimentos falsos. Confie no voo, não na névoa, e observe o dragão ósseo.', briefingText5: 'A cratera de obsidiana queima sob as asas. Wyverns de magma atacam rápido, e a sombra espera seu descuido.', briefingText6: 'Os penhascos dão altura às criaturas. Siga gelo e magma, então derrube o dragão antes que ele dispare.', briefingText7: 'Na floresta assombrada, a serpente do vazio dobra a escuridão. Não persiga a ilusão; espere o corpo real.', briefingText8: 'A catedral lembra cada erro. Ossos, fogo e vazio cercarão você, e a sombra atacará em silêncio.', briefingText9: 'A cidadela das brasas forja a última caçada. Mantenha a coragem e use cada flecha de poder.', briefingText10: 'No Trono das Tempestades termina cada lição. Gelo, ossos, magma e vazio virão. Fique pronto.'
  }
};
const MISSION_I18N = {
  en: { markInstruction: 'M / MIDDLE CLICK: MARK TARGET', markButton: 'MARK', markTarget: 'TARGET MARKED', armorWeakness: 'ARMOR WEAKNESS +{{points}}', scoutTrial: "VALLEY SCOUT'S TRIAL", scoutTrialProgress: 'MARKED {{marked}}/{{required}}  •  WEAKNESS {{weakness}}/1', scoutConfronted: 'VALLEY SCOUT FACED +{{points}}' },
  tr: { markInstruction: 'M / ORTA TIK: HEDEFİ İŞARETLE', markButton: 'İŞARETLE', markTarget: 'HEDEF İŞARETLENDİ', armorWeakness: 'ZIRH AÇIĞI +{{points}}', scoutTrial: 'VADİ GÖZCÜSÜ SINAVI', scoutTrialProgress: 'İŞARETLİ {{marked}}/{{required}}  •  ZIRH AÇIĞI {{weakness}}/1', scoutConfronted: 'VADİ GÖZCÜSÜYLE YÜZLEŞİLDİ +{{points}}' },
  de: { markInstruction: 'M / MITTELKLICK: ZIEL MARKIEREN', markButton: 'MARKIEREN', markTarget: 'ZIEL MARKIERT', armorWeakness: 'RÜSTUNGSSCHWACHSTELLE +{{points}}', scoutTrial: 'PRÜFUNG DER TALSPÄHERIN', scoutTrialProgress: 'MARKIERT {{marked}}/{{required}}  •  SCHWACHSTELLE {{weakness}}/1', scoutConfronted: 'TALSPÄHERIN BEGEGNET +{{points}}' },
  fr: { markInstruction: 'M / CLIC MOLETTE : MARQUER LA CIBLE', markButton: 'MARQUER', markTarget: 'CIBLE MARQUÉE', armorWeakness: 'FAILLE D’ARMURE +{{points}}', scoutTrial: 'ÉPREUVE DE L’ÉCLAIREUSE', scoutTrialProgress: 'CIBLES {{marked}}/{{required}}  •  FAILLE {{weakness}}/1', scoutConfronted: 'ÉCLAIREUSE AFFRONTÉE +{{points}}' },
  es: { markInstruction: 'M / CLIC CENTRAL: MARCA EL OBJETIVO', markButton: 'MARCAR', markTarget: 'OBJETIVO MARCADO', armorWeakness: 'DEBILIDAD DE ARMADURA +{{points}}', scoutTrial: 'PRUEBA DE LA EXPLORADORA', scoutTrialProgress: 'MARCADOS {{marked}}/{{required}}  •  DEBILIDAD {{weakness}}/1', scoutConfronted: 'EXPLORADORA ENFRENTADA +{{points}}' },
  it: { markInstruction: 'M / CLIC CENTRALE: MARCA IL BERSAGLIO', markButton: 'MARCA', markTarget: 'BERSAGLIO MARCATO', armorWeakness: 'PUNTO DEBOLE DELL’ARMATURA +{{points}}', scoutTrial: 'PROVA DELL’ESPLORATRICE', scoutTrialProgress: 'MARCATE {{marked}}/{{required}}  •  PUNTO DEBOLE {{weakness}}/1', scoutConfronted: 'ESPLORATRICE AFFRONTATA +{{points}}' },
  pt: { markInstruction: 'M / CLIQUE DO MEIO: MARQUE O ALVO', markButton: 'MARCAR', markTarget: 'ALVO MARCADO', armorWeakness: 'FRAQUEZA DA ARMADURA +{{points}}', scoutTrial: 'PROVA DA BATEDORA', scoutTrialProgress: 'MARCADOS {{marked}}/{{required}}  •  FRAQUEZA {{weakness}}/1', scoutConfronted: 'BATEDORA ENFRENTADA +{{points}}' },
};
Object.entries(EXTRA_I18N).forEach(([locale, values]) => Object.assign(I18N[locale], values));
const BOSS_PHASE_I18N = {
  en: { bossPhase: 'PHASE {{phase}}' },
  tr: { bossPhase: 'FAZ {{phase}}' },
  de: { bossPhase: 'PHASE {{phase}}' },
  fr: { bossPhase: 'PHASE {{phase}}' },
  es: { bossPhase: 'FASE {{phase}}' },
  it: { bossPhase: 'FASE {{phase}}' },
  pt: { bossPhase: 'FASE {{phase}}' },
};
Object.entries(BOSS_PHASE_I18N).forEach(([locale, values]) => Object.assign(I18N[locale], values));
Object.entries(GUIDE_I18N).forEach(([locale, values]) => Object.assign(I18N[locale], values));
Object.entries(MISSION_I18N).forEach(([locale, values]) => Object.assign(I18N[locale], values));
const FORMATION_I18N = {
  en: { formationWarning: 'COORDINATED ATTACK' },
  tr: { formationWarning: 'KOORDİNELİ SALDIRI' },
  de: { formationWarning: 'KOORDINIERTER ANGRIFF' },
  fr: { formationWarning: 'ATTAQUE COORDONNÉE' },
  es: { formationWarning: 'ATAQUE COORDINADO' },
  it: { formationWarning: 'ATTACCO COORDINATO' },
  pt: { formationWarning: 'ATAQUE COORDENADO' },
};
Object.entries(FORMATION_I18N).forEach(([locale, values]) => Object.assign(I18N[locale], values));
const BOSS_VICTORY_I18N = {
  en: { realmPowerReleased: 'THE REALM BREATHES AGAIN', realmThreatBroken: 'THE REALM\'S POWER HAS BEEN BROKEN' },
  tr: { realmPowerReleased: 'DİYAR YENİDEN NEFES ALIYOR', realmThreatBroken: 'DİYARIN GÜCÜ KIRILDI' },
  de: { realmPowerReleased: 'DAS REICH ATMET WIEDER', realmThreatBroken: 'DIE MACHT DES REICHS IST GEBROCHEN' },
  fr: { realmPowerReleased: 'LE ROYAUME RESPIRE À NOUVEAU', realmThreatBroken: 'LE POUVOIR DU ROYAUME EST BRISÉ' },
  es: { realmPowerReleased: 'EL REINO VUELVE A RESPIRAR', realmThreatBroken: 'EL PODER DEL REINO HA SIDO ROTO' },
  it: { realmPowerReleased: 'IL REGNO TORNA A RESPIRARE', realmThreatBroken: 'IL POTERE DEL REGNO È SPEZZATO' },
  pt: { realmPowerReleased: 'O REINO RESPIRA NOVAMENTE', realmThreatBroken: 'O PODER DO REINO FOI QUEBRADO' },
};
Object.entries(BOSS_VICTORY_I18N).forEach(([locale, values]) => Object.assign(I18N[locale], values));
const END_RUN_I18N = {
  en: { deathRetryPrompt: 'Start again from level 1?', deathContinuePrompt: 'Your checkpoint is level {{level}}.', lossTryAgain: 'TRY AGAIN', lossContinue: 'CONTINUE LEVEL {{level}}', lossRetry: 'RESTART FROM LEVEL 1', lossClose: 'CLOSE' },
  tr: { deathRetryPrompt: '1. bölümden tekrar başlamak ister misin?', deathContinuePrompt: 'Kayıt noktan: {{level}}. bölüm.', lossTryAgain: 'TEKRAR DENE', lossContinue: '{{level}}. BÖLÜMDEN DEVAM ET', lossRetry: '1. BÖLÜMDEN BAŞLA', lossClose: 'KAPAT' },
  de: { deathRetryPrompt: 'Ab Level 1 erneut starten?', deathContinuePrompt: 'Dein Checkpoint ist Level {{level}}.', lossTryAgain: 'ERNEUT VERSUCHEN', lossContinue: 'AB LEVEL {{level}} FORTSETZEN', lossRetry: 'AB LEVEL 1 NEU STARTEN', lossClose: 'SCHLIESSEN' },
  fr: { deathRetryPrompt: 'Recommencer depuis le niveau 1 ?', deathContinuePrompt: 'Votre point de reprise est le niveau {{level}}.', lossTryAgain: 'RÉESSAYER', lossContinue: 'CONTINUER NIVEAU {{level}}', lossRetry: 'RECOMMENCER AU NIVEAU 1', lossClose: 'FERMER' },
  es: { deathRetryPrompt: '¿Empezar de nuevo desde el nivel 1?', deathContinuePrompt: 'Tu punto de control es el nivel {{level}}.', lossTryAgain: 'REINTENTAR', lossContinue: 'CONTINUAR NIVEL {{level}}', lossRetry: 'EMPEZAR EN EL NIVEL 1', lossClose: 'CERRAR' },
  it: { deathRetryPrompt: 'Ricominciare dal livello 1?', deathContinuePrompt: 'Il tuo checkpoint è il livello {{level}}.', lossTryAgain: 'RIPROVA', lossContinue: 'CONTINUA DAL LIVELLO {{level}}', lossRetry: 'RICOMINCIA DAL LIVELLO 1', lossClose: 'CHIUDI' },
  pt: { deathRetryPrompt: 'Recomeçar do nível 1?', deathContinuePrompt: 'Seu ponto de controle é o nível {{level}}.', lossTryAgain: 'TENTAR NOVAMENTE', lossContinue: 'CONTINUAR NO NÍVEL {{level}}', lossRetry: 'RECOMEÇAR NO NÍVEL 1', lossClose: 'FECHAR' },
};
Object.entries(END_RUN_I18N).forEach(([locale, values]) => Object.assign(I18N[locale], values));

const savedLanguage = readLocalStorage('kara-av-language');
let language = I18N[savedLanguage] ? savedLanguage : 'en';

function t(key, vars = {}) {
  const phrase = I18N[language]?.[key] ?? I18N.en[key] ?? key;
  return String(phrase).replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? ''));
}

function refreshStaticUi() {
  languageSelect.value = language;
  document.documentElement.lang = language;
  document.title = t('pageTitle');
  canvas.setAttribute('aria-label', t('pageTitle'));
  muteButton.setAttribute('aria-label', t('mute'));
  exitGameButton.setAttribute('aria-label', t('exitGame'));
  exitGameButton.title = t('exitGame');
  languageSelect.setAttribute('aria-label', t('language'));
  mobileShieldButton.innerHTML = `◈<br>${t('shieldButton')}`;
  mobileMarkButton.innerHTML = `⌖<br>${t('markButton')}`;
  mobileFireButton.innerHTML = `➶<br>${t('fireButton')}`;
  mobileShieldButton.setAttribute('aria-label', t('shieldButton'));
  mobileMarkButton.setAttribute('aria-label', t('markButton'));
  mobileFireButton.setAttribute('aria-label', t('fireButton'));
  muteButton.textContent = muted ? '♩' : '♫';
  muteButton.setAttribute('aria-pressed', String(muted));
  lossRetryButton.textContent = t('lossTryAgain');
  lossRestartButton.textContent = t('lossRetry');
  lossCloseButton.textContent = t('lossClose');
  lossRetryButton.setAttribute('aria-label', t('lossTryAgain'));
  lossRestartButton.setAttribute('aria-label', t('lossRetry'));
  lossCloseButton.setAttribute('aria-label', t('lossClose'));
}

function syncLossActions() {
  const checkpointLevel = getResumeLevelIndex() + 1;
  const hasCheckpoint = checkpointLevel > 1;
  lossActions.hidden = state !== 'lost';
  canvas.classList.toggle('loss-screen', state === 'lost');
  lossRetryButton.textContent = hasCheckpoint ? t('lossContinue', { level: checkpointLevel }) : t('lossTryAgain');
  lossRetryButton.setAttribute('aria-label', lossRetryButton.textContent);
  lossRestartButton.textContent = t('lossRetry');
  lossRestartButton.setAttribute('aria-label', t('lossRetry'));
  lossCloseButton.textContent = t('lossClose');
  lossCloseButton.setAttribute('aria-label', t('lossClose'));
  positionLossActions();
}

function setLanguage(nextLanguage) {
  if (!I18N[nextLanguage]) return;
  language = nextLanguage;
  writeLocalStorage('kara-av-language', language);
  refreshStaticUi();
  if (state === 'lost') syncLossActions();
}

function logProgress() {
  // Keep campaign progress local; do not send platform events that may surface as overlays.
}

languageSelect.addEventListener('change', (event) => {
  event.stopPropagation();
  const select = /** @type {HTMLSelectElement} */ (event.currentTarget);
  setLanguage(select.value);
});
refreshStaticUi();

function cleanCharacterSprite(image, animationAtlas = false) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const pixelCount = width * height;
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) return sourceCanvas;

  try {
    sourceContext.drawImage(image, 0, 0);
    const pixels = sourceContext.getImageData(0, 0, width, height);
    const data = pixels.data;
    const visited = new Uint8Array(pixelCount);
    const componentIds = new Uint32Array(pixelCount);
    const verticalSupportMap = new Uint8Array(pixelCount);
    const stack = [];
    const neighbors = [-1, 0, 1];
    let nextComponentId = 0;

    // Some generated cutouts contain long horizontal alpha bars that are
    // attached to the silhouette at one end. Erase only the thin, low-support
    // portion of a long run, then repeat so the attachment cannot leave a
    // visible stub. A sliding vertical count avoids repeatedly checking each
    // pixel's full support window and reuses one compact buffer.
    const supportRadius = animationAtlas ? 20 : 8;
    const minimumSupport = animationAtlas ? 18 : 4;
    const removedSupport = animationAtlas ? 20 : 5;
    const minimumRunWidth = animationAtlas ? Math.max(56, width * 0.06) : Math.max(24, width * 0.035);
    const lowSupportRatio = animationAtlas ? 0.56 : 0.62;

    for (let pass = 0; pass < 4; pass += 1) {
      for (let x = 0; x < width; x += 1) {
        let support = 0;
        for (let y = 0; y <= Math.min(supportRadius, height - 1); y += 1) {
          if (data[(y * width + x) * 4 + 3] >= 18) support += 1;
        }
        for (let y = 0; y < height; y += 1) {
          verticalSupportMap[y * width + x] = support;
          if (y + 1 >= height) continue;

          const leavingY = y - supportRadius;
          const enteringY = y + supportRadius + 1;
          if (leavingY >= 0 && data[(leavingY * width + x) * 4 + 3] >= 18) support -= 1;
          if (enteringY < height && data[(enteringY * width + x) * 4 + 3] >= 18) support += 1;
        }
      }

      // Record eligible rows before erasing anything so every row in this pass
      // uses the same support snapshot. The next pass rebuilds support from the
      // cleaned alpha, avoiding per-pixel vertical updates.
      const hairlineRuns = [];
      for (let y = 0; y < height; y += 1) {
        let x = 0;
        while (x < width) {
          while (x < width && data[(y * width + x) * 4 + 3] < 18) x += 1;
          const runStart = x;
          while (x < width && data[(y * width + x) * 4 + 3] >= 18) x += 1;
          const runWidth = x - runStart;
          if (runWidth < minimumRunWidth) continue;

          let lowSupportCount = 0;
          const rowOffset = y * width;
          for (let runX = runStart; runX < x; runX += 1) {
            if (verticalSupportMap[rowOffset + runX] <= minimumSupport) lowSupportCount += 1;
          }
          if (lowSupportCount / runWidth >= lowSupportRatio) hairlineRuns.push({ y, start: runStart, end: x });
        }
      }

      for (const run of hairlineRuns) {
        const rowOffset = run.y * width;
        for (let runX = run.start; runX < run.end; runX += 1) {
          if (verticalSupportMap[rowOffset + runX] > removedSupport) continue;
          data[(rowOffset + runX) * 4 + 3] = 0;
          const lastAffectedY = Math.min(height - 1, run.y + supportRadius);
          for (let affectedY = run.y + 1; affectedY <= lastAffectedY; affectedY += 1) {
            const supportIndex = affectedY * width + runX;
            if (verticalSupportMap[supportIndex] > 0) verticalSupportMap[supportIndex] -= 1;
          }
        }
      }
    }

    // Generated character cutouts can also contain detached, thin horizontal
    // light bars. Label each flood-filled component in a compact typed array;
    // this avoids building a huge JavaScript array containing every sprite
    // pixel merely to erase a handful of thin components.
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const start = y * width + x;
        if (visited[start] || data[start * 4 + 3] < 18) continue;
        const componentId = ++nextComponentId;
        visited[start] = 1;
        componentIds[start] = componentId;
        stack.length = 0;
        stack.push(start);
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;

        while (stack.length) {
          const index = stack.pop();
          const currentX = index % width;
          const currentY = Math.floor(index / width);
          minX = Math.min(minX, currentX);
          maxX = Math.max(maxX, currentX);
          minY = Math.min(minY, currentY);
          maxY = Math.max(maxY, currentY);

          for (const offsetY of neighbors) {
            for (const offsetX of neighbors) {
              if (offsetX === 0 && offsetY === 0) continue;
              const nextX = currentX + offsetX;
              const nextY = currentY + offsetY;
              if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
              const next = nextY * width + nextX;
              if (!visited[next] && data[next * 4 + 3] >= 18) {
                visited[next] = 1;
                componentIds[next] = componentId;
                stack.push(next);
              }
            }
          }
        }

        const componentWidth = maxX - minX + 1;
        const componentHeight = maxY - minY + 1;
        const isDetachedLightBar = componentWidth >= Math.max(28, width * 0.035)
          && componentHeight <= Math.max(30, height * 0.045)
          && componentWidth / componentHeight >= 3.2;
        if (isDetachedLightBar) {
          for (let clearY = minY; clearY <= maxY; clearY += 1) {
            for (let clearX = minX; clearX <= maxX; clearX += 1) {
              const index = clearY * width + clearX;
              if (componentIds[index] === componentId) data[index * 4 + 3] = 0;
            }
          }
        }
      }
    }

    sourceContext.putImageData(pixels, 0, 0);
  } catch {
    // If a browser blocks pixel inspection, keep the original sprite drawable.
  }
  return sourceCanvas;
}

function loadImage(src, cleanStrips = false) {
  if (!cleanStrips) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = src;
    return image;
  }

  const cleanedSprite = document.createElement('canvas');
  cleanedSprite.width = 1;
  cleanedSprite.height = 1;
  cleanedSprite.ready = false;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    const cleaned = cleanCharacterSprite(image);
    cleanedSprite.width = cleaned.width;
    cleanedSprite.height = cleaned.height;
    cleanedSprite.getContext('2d').drawImage(cleaned, 0, 0);
    cleanedSprite.ready = true;
  };
  image.src = src;
  return cleanedSprite;
}

function loadAnimationSheet(src, columns = 3, rows = 2, enhancedCleanup = true) {
  const sheet = document.createElement('canvas');
  sheet.width = 1;
  sheet.height = 1;
  sheet.columns = columns;
  sheet.rows = rows;
  sheet.frameCount = columns * rows;
  sheet.ready = false;
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    const cleaned = cleanCharacterSprite(image, enhancedCleanup);
    const scale = Math.min(1, 960 / cleaned.width);
    // Keep every atlas cell on integer pixel boundaries. Fractional row cuts
    // blend neighboring poses and create the very shimmer this animation needs
    // to avoid.
    sheet.frameWidth = Math.max(1, Math.round(cleaned.width * scale / columns));
    sheet.frameHeight = Math.max(1, Math.round(cleaned.height * scale / rows));
    sheet.width = sheet.frameWidth * columns;
    sheet.height = sheet.frameHeight * rows;
    const sheetContext = sheet.getContext('2d');
    if (!sheetContext) return;
    sheetContext.imageSmoothingEnabled = true;
    sheetContext.imageSmoothingQuality = 'high';
    sheetContext.drawImage(cleaned, 0, 0, sheet.width, sheet.height);
    sheet.ready = true;
  };
  image.src = src;
  return sheet;
}

function imageIsDrawable(image) {
  return Boolean(image && (image.ready === true || (image.complete === true && image.naturalWidth > 0)));
}

const art = {
  titleBackground: loadImage('assets/dragon-valley-title-screen.webp'),
  backgrounds: [
    loadImage('assets/dreadvale-background.webp'),
    loadImage('assets/bloodmoon-ruins.webp'),
    loadImage('assets/frozen-spires.webp'),
    loadImage('assets/drowned-swamp.webp'),
    loadImage('assets/obsidian-crater.webp'),
    loadImage('assets/storm-cliffs.webp'),
    loadImage('assets/haunted-forest-replacement.webp'),
    loadImage('assets/cathedral-abyss.webp'),
    loadImage('assets/ember-citadel.webp'),
    loadImage('assets/throne-of-storms.webp'),
  ],
  // Generated creature cutouts can contain detached hairline strips in their
  // transparent padding. Run the existing connected-component cleanup before
  // any enemy or boss sprite reaches the playfield.
  dragon: loadImage('assets/crimson-dragon.webp', true),
  wyvern: loadImage('assets/storm-wyvern.webp', true),
  frost: loadImage('assets/frost-dragon.webp', true),
  bone: loadImage('assets/bone-dragon.webp', true),
  magma: loadImage('assets/magma-wyvern.webp', true),
  void: loadImage('assets/void-serpent.webp', true),
  wraith: loadImage('assets/wraith-bat.webp', true),
  bossDreadheart: loadImage('assets/boss-dreadheart.webp', true),
  bossTempestCrown: loadImage('assets/boss-tempest-crown.webp', true),
  bossFrostveil: loadImage('assets/boss-frostveil.webp', true),
  bossGravewing: loadImage('assets/boss-gravewing.webp', true),
  bossCindermaw: loadImage('assets/boss-cindermaw.webp', true),
  bossCliffbreaker: loadImage('assets/boss-cliffbreaker.webp', true),
  bossNullfang: loadImage('assets/boss-nullfang.webp', true),
  bossCathedralWyrm: loadImage('assets/boss-cathedral-wyrm.webp', true),
  bossEmberTyrant: loadImage('assets/boss-ember-tyrant.webp', true),
  bossAncientSovereign: loadImage('assets/boss-ancient-sovereign.webp', true),
  knight: loadImage('assets/ranked-hunter-knight.webp', true),
  elderSage: loadImage('assets/guide-elder-sage.webp', true),
  womanWarrior: loadImage('assets/guide-woman-warrior.webp', true),
  nightScout: loadImage('assets/guide-night-scout.webp', true),
  voidOracle: loadImage('assets/guide-void-oracle.webp', true),
  crossbow: loadImage('assets/hunter-crossbow.webp'),
  crosshair: loadImage('assets/rune-crosshair.webp'),
  shield: loadImage('assets/hunter-round-ward-shield.webp'),
  // Six-frame 3×2 atlases for a slow, continuous flight cycle, breath wind-up and dive.
  // Atlas cleanup removes the long horizontal remnants before frame cropping.
  animationSheets: {
    wraith: loadAnimationSheet('assets/sheet-wraith-bat.webp', 2, 2, false),
    wyvern: loadAnimationSheet('assets/flight-atlas-storm-wyvern-v2.webp'),
    dragon: loadAnimationSheet('assets/flight-atlas-crimson-dragon-v2.webp'),
    frost: loadAnimationSheet('assets/flight-atlas-frost-dragon-v2.webp'),
    bone: loadAnimationSheet('assets/flight-atlas-bone-dragon-v2.webp'),
    magma: loadAnimationSheet('assets/flight-atlas-magma-wyvern-v2.webp'),
    void: loadAnimationSheet('assets/flight-atlas-void-dragon-v2.webp'),
    bossDreadheart: loadAnimationSheet('assets/flight-atlas-boss-dreadheart-v2.webp'),
    bossTempestCrown: loadAnimationSheet('assets/flight-atlas-boss-tempest-crown-v2.webp'),
    bossFrostveil: loadAnimationSheet('assets/flight-atlas-boss-frostveil-v2.webp'),
    bossGravewing: loadAnimationSheet('assets/flight-atlas-boss-gravewing-v2.webp'),
    bossCindermaw: loadAnimationSheet('assets/flight-atlas-boss-cindermaw-v2.webp'),
    bossCliffbreaker: loadAnimationSheet('assets/flight-atlas-boss-cliffbreaker-v2.webp'),
    bossNullfang: loadAnimationSheet('assets/flight-atlas-boss-nullfang-v2.webp'),
    bossCathedralWyrm: loadAnimationSheet('assets/flight-atlas-boss-cathedral-wyrm-v2.webp'),
    bossEmberTyrant: loadAnimationSheet('assets/flight-atlas-boss-ember-tyrant-v2.webp'),
    bossAncientSovereign: loadAnimationSheet('assets/flight-atlas-boss-ancient-sovereign-v2.webp'),
  },
};

const rankVisuals = [
  { accent: '#8fb6c7', glow: '#5ca8c4', trim: '#6d8794', marks: 1 },
  { accent: '#b8c9d4', glow: '#8ecce0', trim: '#8499a2', marks: 2 },
  { accent: '#d4b36b', glow: '#db9d52', trim: '#a27b42', marks: 3 },
  { accent: '#8ed2c3', glow: '#55b9a9', trim: '#4d887e', marks: 4 },
  { accent: '#e07855', glow: '#d94b32', trim: '#a74437', marks: 5 },
  { accent: '#82b9ea', glow: '#578de0', trim: '#4771af', marks: 6 },
  { accent: '#bf86e8', glow: '#904cd0', trim: '#6d438d', marks: 7 },
  { accent: '#e3a6d1', glow: '#d464a9', trim: '#9a4d7e', marks: 8 },
  { accent: '#f0c873', glow: '#e9983d', trim: '#a87334', marks: 9 },
  { accent: '#fff0aa', glow: '#f5c85e', trim: '#c2933e', marks: 10 },
];

const music = new Audio('assets/audio/dragon-valley-epic-hunt-theme.mp3');
const middleCampaignMusic = new Audio('assets/audio/ashen-storm-hunt-theme.mp3');
const abyssCampaignMusic = new Audio('assets/audio/abyssal-choir-hunt-theme.mp3');
const finaleCampaignMusic = new Audio('assets/audio/storm-throne-finale-theme.mp3');
const musicTracks = [music, middleCampaignMusic, abyssCampaignMusic, finaleCampaignMusic];
musicTracks.forEach((track) => {
  track.loop = true;
  track.preload = 'auto';
  track.muted = muted;
});
let activeMusicTrack = music;
let outgoingMusicTrack = null;
let musicCrossfade = 1;
const bowSound = new Audio('assets/audio/bow-release.mp3');
const hitSound = new Audio('assets/audio/monster-hit.mp3');
const dragonRoar = new Audio('assets/audio/dragon-roar.mp3');
const wyvernRoar = new Audio('assets/audio/wyvern-roar.mp3');
const hunterDeathSting = new Audio('assets/audio/hunter-death-sting.mp3');
const ammoFailureSting = new Audio('assets/audio/ammo-failure-sting.mp3');
const chapterVictorySting = new Audio('assets/audio/chapter-victory-sting.mp3');
const campaignVictorySting = new Audio('assets/audio/campaign-victory-sting.mp3');
const briefingVoices = {
  dreadvale: new Audio('assets/audio/briefing-dreadvale-sage.mp3'),
  bloodmoon: new Audio('assets/audio/briefing-bloodmoon-warrior.mp3'),
  frozen: new Audio('assets/audio/briefing-frozen-scout.mp3'),
  swamp: new Audio('assets/audio/briefing-swamp-sage.mp3'),
  obsidian: new Audio('assets/audio/briefing-obsidian-warrior.mp3'),
  storm: new Audio('assets/audio/briefing-storm-scout.mp3'),
  haunted: new Audio('assets/audio/briefing-haunted-oracle.mp3'),
  cathedral: new Audio('assets/audio/briefing-cathedral-oracle.mp3'),
  ember: new Audio('assets/audio/briefing-ember-warrior.mp3'),
  throne: new Audio('assets/audio/briefing-throne-sage.mp3'),
};
const guideReactionVoices = {
  perfect: new Audio('assets/audio/guide-praise-perfect.mp3'),
  hit: new Audio('assets/audio/guide-praise-hit.mp3'),
  miss: new Audio('assets/audio/guide-reaction-miss.mp3'),
  danger: new Audio('assets/audio/guide-reaction-danger.mp3'),
};

function setMediaVolume(media, value) {
  media.volume = Math.max(0, Math.min(1, value));
}

const TITLE_MUSIC_VOLUME = 0.2;
const BRIEFING_MUSIC_VOLUME = 0.24;
const COMBAT_MUSIC_VOLUME = 0.48;
const BOSS_MUSIC_VOLUME = 0.56;
let musicFadeTarget = TITLE_MUSIC_VOLUME;
let musicMasterVolume = TITLE_MUSIC_VOLUME;
musicTracks.forEach((track) => setMediaVolume(track, 0));
setMediaVolume(music, TITLE_MUSIC_VOLUME);
setMediaVolume(bowSound, 0.7);
setMediaVolume(hitSound, 0.65);
setMediaVolume(dragonRoar, 0.88);
setMediaVolume(wyvernRoar, 0.72);
setMediaVolume(hunterDeathSting, 0.96);
setMediaVolume(ammoFailureSting, 0.9);
setMediaVolume(chapterVictorySting, 0.94);
setMediaVolume(campaignVictorySting, 1);
Object.values(briefingVoices).forEach((voice) => setMediaVolume(voice, 0.86));
Object.values(guideReactionVoices).forEach((voice) => setMediaVolume(voice, 0.9));
let audioContext = null;
const activeAudioClips = new Set();
let activeVoice = null;

const HUD_FLIGHT_TOP = 195;
const HUD_FLIGHT_BOTTOM = 700;
const ENEMY_FIRE_WINDUP = 1.05;
const BOSS_FIRE_WINDUP = 1.26;
const ENEMY_FIRE_RECOVERY = 0.58;
const BOSS_FIRE_RECOVERY = 0.7;
const ENEMY_DIVE_RECOVERY = 0.76;
const BOSS_DIVE_RECOVERY = 0.92;
const ENEMY_DIVE_DURATION = 0.82;
const BOSS_DIVE_DURATION = 0.96;

function smoothUnit(value) {
  const progress = Math.max(0, Math.min(1, value));
  return progress * progress * (3 - 2 * progress);
}

const creatureTypes = {
  // All regular creature artwork faces right. The mouth offsets are kept in
  // sprite-local coordinates so fire always starts at the visible jaw.
  wraith: { image: 'wraith', animationSheet: 'wraith', width: 205, height: 150, radius: 64, hp: 1, speed: 155, score: 120, attack: 4.5, shotSpeed: 300, shotRadius: 20, shotColor: '#72e5dc', roar: null, spriteFacing: 1, mouthX: 0, mouthY: 0, nameKey: 'creatureWraith' },
  wyvern: { image: 'wyvern', animationSheet: 'wyvern', width: 285, height: 190, radius: 88, hp: 2, speed: 112, score: 240, attack: 5.6, shotSpeed: 330, shotRadius: 20, shotColor: '#ff682e', roar: 'wyvern', spriteFacing: 1, mouthX: 0.37, mouthY: -0.08, nameKey: 'creatureWyvern' },
  dragon: { image: 'dragon', animationSheet: 'dragon', width: 345, height: 260, radius: 108, hp: 3, speed: 78, score: 420, attack: 6.4, shotSpeed: 360, shotRadius: 27, shotColor: '#ff682e', roar: 'dragon', spriteFacing: 1, mouthX: 0.39, mouthY: -0.07, nameKey: 'creatureDragon' },
  frost: { image: 'frost', animationSheet: 'frost', width: 330, height: 285, radius: 104, hp: 4, speed: 72, score: 520, attack: 5.3, shotSpeed: 345, shotRadius: 25, shotColor: '#8edcff', roar: 'dragon', spriteFacing: 1, mouthX: 0.39, mouthY: -0.06, nameKey: 'creatureFrost' },
  bone: { image: 'bone', animationSheet: 'bone', width: 330, height: 305, radius: 101, hp: 5, speed: 66, score: 640, attack: 4.8, shotSpeed: 390, shotRadius: 24, shotColor: '#a8bdf1', roar: 'dragon', spriteFacing: 1, mouthX: 0.36, mouthY: -0.12, nameKey: 'creatureBone' },
  magma: { image: 'magma', animationSheet: 'magma', width: 325, height: 265, radius: 98, hp: 4, speed: 92, score: 580, attack: 4.7, shotSpeed: 375, shotRadius: 26, shotColor: '#ff6a2d', roar: 'wyvern', spriteFacing: 1, mouthX: 0.4, mouthY: -0.05, nameKey: 'creatureMagma' },
  void: { image: 'void', animationSheet: 'void', width: 310, height: 315, radius: 96, hp: 6, speed: 82, score: 820, attack: 4.4, shotSpeed: 410, shotRadius: 26, shotColor: '#a65cff', roar: 'dragon', spriteFacing: 1, mouthX: 0.34, mouthY: -0.12, nameKey: 'creatureVoid' },
};

const COORDINATED_FORMATION_PATTERNS = {
  crossPair: {
    color: '#9beee7',
    attackDelay: 5.2,
    members: [
      { entrySide: 'left', lane: 0.27, drift: 176 },
      { entrySide: 'right', lane: 0.73, drift: -176 },
    ],
  },
  crossingTriangle: {
    color: '#f3cb78',
    attackDelay: 5.6,
    members: [
      { entrySide: 'left', lane: 0.23, drift: 152 },
      { entrySide: 'right', lane: 0.5, drift: -18 },
      { entrySide: 'left', lane: 0.77, drift: -152 },
    ],
  },
  reversePair: {
    color: '#c5a1ff',
    attackDelay: 5.4,
    members: [
      { entrySide: 'right', lane: 0.28, drift: 164 },
      { entrySide: 'left', lane: 0.72, drift: -164 },
    ],
  },
};

const levels = [
  { nameKey: 'levelDreadvale', rankKey: 'rankNovice', roster: ['wraith', 'wraith', 'wyvern', 'wraith', 'wyvern', 'wraith'], boss: { type: 'dragon', image: 'bossDreadheart', nameKey: 'bossDreadheart', accent: '#ff6244', hpScale: 2.2, sizeScale: 1.18, flightRate: 3.2, bobAmount: 34, motionScale: 1.25, entrySide: 'left', turnMargin: 0.46, headX: 0.39, headY: -0.08, headRadius: 0.35, mouthX: 0.45, mouthY: -0.08, arenaTheme: 'ember' } },
  // Most animated dragons face right; Gravewing's flawed frontal atlas cell is skipped below.
  { nameKey: 'levelBloodmoon', rankKey: 'rankScout', shadowAmbush: true, roster: ['wraith', 'wyvern', 'wyvern', 'dragon', 'wyvern', 'wraith', 'dragon'], formationWaves: [{ pattern: 'crossPair', indices: [1, 2], delay: 2.15 }], boss: { type: 'wyvern', image: 'bossTempestCrown', nameKey: 'bossTempestCrown', animationFrameMap: [1, 2, 3, 1, 4, 5], accent: '#79dce8', hpScale: 2.35, sizeScale: 1.2, flightRate: 5.6, bobAmount: 42, motionScale: 1.4, entrySide: 'right', turnMargin: 0.46, headX: 0.39, headY: 0.02, headRadius: 0.32, mouthX: 0.43, mouthY: 0.05, arenaTheme: 'storm' } },
  { nameKey: 'levelFrozen', rankKey: 'rankMarksman', roster: ['wraith', 'wyvern', 'frost', 'dragon', 'frost', 'wyvern', 'frost'], boss: { type: 'frost', image: 'bossFrostveil', nameKey: 'bossFrostveil', accent: '#a4e9ff', hpScale: 2.25, sizeScale: 1.18, flightRate: 2.55, bobAmount: 26, motionScale: 1.12, entrySide: 'left', turnMargin: 0.46, headX: 0.39, headY: -0.08, headRadius: 0.33, mouthX: 0.44, mouthY: -0.07, arenaTheme: 'ice' } },
  { nameKey: 'levelSwamp', rankKey: 'rankWarden', roster: ['wraith', 'wraith', 'frost', 'wyvern', 'bone', 'wraith', 'bone'], boss: { type: 'bone', image: 'bossGravewing', nameKey: 'bossGravewing', animationFrameMap: [1, 2, 3, 1, 4, 5], accent: '#b5c6f0', hpScale: 2.35, sizeScale: 1.18, flightRate: 2.9, bobAmount: 36, motionScale: 1.3, entrySide: 'right', turnMargin: 0.46, headX: 0.34, headY: -0.02, headRadius: 0.3, mouthX: 0.42, mouthY: -0.02, arenaTheme: 'void' } },
  { nameKey: 'levelObsidian', rankKey: 'rankCrimson', shadowAmbush: true, roster: ['wyvern', 'magma', 'dragon', 'magma', 'bone', 'dragon', 'wyvern', 'magma'], formationWaves: [{ pattern: 'crossingTriangle', indices: [1, 2, 3], delay: 2.4 }], boss: { type: 'magma', image: 'bossCindermaw', nameKey: 'bossCindermaw', accent: '#ff944d', hpScale: 2.45, sizeScale: 1.2, flightRate: 4.8, bobAmount: 32, motionScale: 1.3, entrySide: 'left', turnMargin: 0.46, headX: 0.37, headY: -0.08, headRadius: 0.32, mouthX: 0.42, mouthY: -0.05, arenaTheme: 'lava' } },
  { nameKey: 'levelStorm', rankKey: 'rankStorm', scoutTrial: true, scoutMarksRequired: 3, roster: ['wyvern', 'frost', 'magma', 'dragon', 'bone', 'wyvern', 'frost', 'magma'], boss: { type: 'wyvern', image: 'bossCliffbreaker', nameKey: 'bossCliffbreaker', accent: '#8edcff', hpScale: 2.55, sizeScale: 1.22, flightRate: 6.3, bobAmount: 48, motionScale: 1.5, entrySide: 'right', turnMargin: 0.46, headX: 0.35, headY: -0.06, headRadius: 0.32, mouthX: 0.41, mouthY: -0.05, arenaTheme: 'storm' } },
  { nameKey: 'levelHaunted', rankKey: 'rankSoulbreaker', roster: ['wraith', 'void', 'bone', 'frost', 'magma', 'void', 'wraith', 'bone', 'void'], boss: { type: 'dragon', image: 'bossNullfang', nameKey: 'bossNullfang', accent: '#c38cff', hpScale: 2.4, sizeScale: 1.2, flightRate: 2.1, bobAmount: 54, motionScale: 1.45, entrySide: 'left', turnMargin: 0.46, headX: 0.39, headY: -0.18, headRadius: 0.3, mouthX: 0.43, mouthY: -0.19, arenaTheme: 'void' } },
  { nameKey: 'levelCathedral', rankKey: 'rankDragonslayer', shadowAmbush: true, pressure: 1.07, roster: ['bone', 'dragon', 'void', 'magma', 'frost', 'bone', 'void', 'magma', 'bone', 'void'], formationWaves: [{ pattern: 'reversePair', indices: [1, 2], delay: 2.65 }], boss: { type: 'bone', image: 'bossCathedralWyrm', nameKey: 'bossCathedralWyrm', accent: '#e0d0a3', hpScale: 2.65, sizeScale: 1.22, flightRate: 3.35, bobAmount: 30, motionScale: 1.22, speedScale: 0.94, attackScale: 0.9, entrySide: 'right', turnMargin: 0.46, headX: 0.43, headY: -0.2, headRadius: 0.29, mouthX: 0.45, mouthY: -0.18, arenaTheme: 'void' } },
  { nameKey: 'levelEmber', rankKey: 'rankCommander', pressure: 1.11, roster: ['magma', 'dragon', 'bone', 'void', 'magma', 'frost', 'dragon', 'void', 'magma', 'bone', 'dragon'], boss: { type: 'magma', image: 'bossEmberTyrant', nameKey: 'bossEmberTyrant', accent: '#ffb35a', hpScale: 2.78, sizeScale: 1.22, flightRate: 4.35, bobAmount: 38, motionScale: 1.36, speedScale: 0.97, attackScale: 0.94, entrySide: 'left', turnMargin: 0.46, headX: 0.35, headY: -0.15, headRadius: 0.32, mouthX: 0.42, mouthY: -0.14, arenaTheme: 'lava' } },
  { nameKey: 'levelThrone', rankKey: 'rankAncient', shadowAmbush: true, pressure: 1.15, roster: ['frost', 'bone', 'magma', 'void', 'dragon', 'void', 'bone', 'magma', 'frost', 'void', 'bone', 'dragon'], formationWaves: [{ pattern: 'crossingTriangle', indices: [1, 2, 3], delay: 2.8 }], boss: { type: 'dragon', image: 'bossAncientSovereign', nameKey: 'bossAncientSovereign', accent: '#fff0aa', hpScale: 3.25, sizeScale: 1.28, flightRate: 4.9, bobAmount: 44, motionScale: 1.55, speedScale: 1, attackScale: 0.98, entrySide: 'right', turnMargin: 0.46, headX: 0.41, headY: -0.18, headRadius: 0.31, mouthX: 0.46, mouthY: -0.2, arenaTheme: 'storm' } },
];

const BOSS_ANIMATION_SHEETS = {
  bossDreadheart: 'bossDreadheart',
  bossTempestCrown: 'bossTempestCrown',
  bossFrostveil: 'bossFrostveil',
  bossGravewing: 'bossGravewing',
  bossCindermaw: 'bossCindermaw',
  bossCliffbreaker: 'bossCliffbreaker',
  bossNullfang: 'bossNullfang',
  bossCathedralWyrm: 'bossCathedralWyrm',
  bossEmberTyrant: 'bossEmberTyrant',
  bossAncientSovereign: 'bossAncientSovereign',
};

const BOSS_ARENA_THEMES = {
  ember: { edge: '#ff6244', core: '#ffd27a', deep: '#8f241d' },
  storm: { edge: '#78dff4', core: '#e8fbff', deep: '#3159a0' },
  ice: { edge: '#9deaff', core: '#f3ffff', deep: '#427db6' },
  lava: { edge: '#ff743a', core: '#fff0a0', deep: '#9b241b' },
  void: { edge: '#bb82ff', core: '#f0d5ff', deep: '#4b2b88' },
};

function bossArenaTheme(enemy) {
  return BOSS_ARENA_THEMES[enemy?.arenaTheme] || BOSS_ARENA_THEMES.storm;
}

const BOSS_QA_PARAMS = new URLSearchParams(window.location.search);
const BOSS_QA_MODE = BOSS_QA_PARAMS.has('boss-qa');
const BOSS_QA_AUTO = BOSS_QA_MODE && BOSS_QA_PARAMS.has('boss-qa-auto');

function validateBossProfiles() {
  return levels.map((level, levelIndex) => {
    const boss = level.boss;
    const errors = [];
    const sourceFacing = boss?.spriteFacing ?? 1;
    const entrySide = boss?.entrySide;
    const mouthX = boss?.mouthX;
    const mouthY = boss?.mouthY;
    const headX = boss?.headX;
    const headY = boss?.headY;
    const turnMargin = boss?.turnMargin;

    if (!boss || !art[boss.image]) errors.push('missing boss or sprite');
    if (sourceFacing !== 1 && sourceFacing !== -1) errors.push('source facing must be ±1');
    if (entrySide !== 'left' && entrySide !== 'right') errors.push('entry side must be left/right');
    for (const [name, value] of [['mouthX', mouthX], ['mouthY', mouthY], ['headX', headX], ['headY', headY], ['turnMargin', turnMargin]]) {
      if (!Number.isFinite(value)) errors.push(`${name} is not finite`);
    }
    if (mouthX <= 0 || mouthX > 0.5) errors.push('mouth X is outside the sprite jaw range');
    if (headX <= 0 || headX > 0.5) errors.push('head X is outside the sprite head range');
    if (boss?.headRadius <= 0 || boss.headRadius > 0.5) errors.push('head radius is outside the readable range');
    if (turnMargin <= 0.35 || turnMargin >= 0.5) errors.push('turn margin is outside the safe screen range');

    const expectedEntryFacing = entrySide === 'left' ? 1 : -1;
    const bossWidth = (creatureTypes[boss?.type]?.width || 0) * (boss?.sizeScale || 1);
    const movementChecks = [1, -1].map((movementFacing) => ({
      movementFacing,
      renderScale: movementFacing === sourceFacing ? 1 : -1,
      mouthForward: Math.sign(movementFacing * mouthX) === movementFacing,
      headForward: Math.sign(movementFacing * headX) === movementFacing,
      turnX: movementFacing > 0 ? W - bossWidth * turnMargin : bossWidth * turnMargin,
    }));
    if (!movementChecks.every((check) => check.mouthForward && check.headForward && Number.isFinite(check.turnX))) {
      errors.push('facing-dependent mouth/head/turn mapping failed');
    }
    if (expectedEntryFacing !== 1 && expectedEntryFacing !== -1) errors.push('entry direction failed');

    return {
      level: levelIndex + 1,
      nameKey: boss?.nameKey,
      sourceFacing,
      entrySide,
      turnMargin,
      head: { x: headX, y: headY, radius: boss?.headRadius },
      mouth: { x: mouthX, y: mouthY },
      movementChecks,
      ok: errors.length === 0,
      errors,
    };
  });
}

const bossQaProfileReport = validateBossProfiles();
if (BOSS_QA_MODE) {
  const failedProfiles = bossQaProfileReport.filter((profile) => !profile.ok);
  console.info(`[Boss QA] ${bossQaProfileReport.length - failedProfiles.length}/${bossQaProfileReport.length} profiles valid`, failedProfiles);
}
/** @type {Window & { KaraAvBossQA?: { profiles: object[]; validate: () => object[]; getHistory: () => object[] } }} */
const qaWindow = window;
qaWindow.KaraAvBossQA = { profiles: bossQaProfileReport, validate: validateBossProfiles, getHistory: () => bossQaHistory, auto: BOSS_QA_AUTO };

function bossMovementFacing(enemy) {
  if (enemy.attackState === 'dive') {
    const diveDirection = Math.sign((enemy.diveTargetX || enemy.x) - (enemy.diveStartX ?? enemy.x));
    if (diveDirection) return diveDirection;
  }
  return Math.sign(enemy.vx) || 1;
}

function bossMouthPoint(enemy) {
  const facing = bossMovementFacing(enemy);
  return {
    x: enemy.x + facing * enemy.width * (enemy.mouthX ?? 0.36),
    y: enemy.y + enemy.height * (enemy.mouthY ?? -0.06),
  };
}

function bossLocalMouthPoint(enemy) {
  return {
    x: (enemy.spriteFacing || 1) * enemy.width * (enemy.mouthX ?? 0.36),
    y: enemy.height * (enemy.mouthY ?? -0.06),
  };
}

function bossHeadPoint(enemy) {
  return {
    x: enemy.x + bossMovementFacing(enemy) * enemy.width * (enemy.headX ?? 0.32),
    y: enemy.y + enemy.height * (enemy.headY ?? -0.05),
    radius: enemy.radius * (enemy.headRadius ?? 0.42),
  };
}

const GUIDE_PROFILES = {
  sage: { image: 'elderSage', nameKey: 'guideSage', accent: '#7bd6dc' },
  warrior: { image: 'womanWarrior', nameKey: 'guideWarrior', accent: '#e07855' },
  scout: { image: 'nightScout', nameKey: 'guideScout', accent: '#82b9ea' },
  oracle: { image: 'voidOracle', nameKey: 'guideOracle', accent: '#bf86e8' },
};
const LEVEL_GUIDES = ['sage', 'warrior', 'scout', 'sage', 'warrior', 'scout', 'oracle', 'oracle', 'warrior', 'sage'];
const LEVEL_VOICES = ['dreadvale', 'bloodmoon', 'frozen', 'swamp', 'obsidian', 'storm', 'haunted', 'cathedral', 'ember', 'throne'];

function currentGuide() {
  return GUIDE_PROFILES[LEVEL_GUIDES[Math.max(0, levelIndex)] || 'sage'];
}

const TOTAL_LEVELS = levels.length;
const TOTAL_SHADOW_AMBUSHES = levels.filter((level) => level.shadowAmbush).length;
const TOTAL_CHAPTER_MEDALS = TOTAL_LEVELS * 3;
const TOTAL_TARGETS = levels.reduce((total, level) => total + level.roster.length + (level.boss ? 1 : 0) + (level.shadowAmbush ? 1 : 0), 0);
const REGISTRY_STORAGE_KEY = 'kara-av-hunter-registry';

function emptyChapterMedals() {
  return Array.from({ length: TOTAL_LEVELS }, () => ({ clear: false, clean: false, perfect: false }));
}

function loadHunterRegistry() {
  const fallback = { hunts: 0, victories: 0, bestScore: 0, bestCombo: 0, levelsCleared: 0, shadowAmbushes: 0, perfectShots: 0, chapterMedals: emptyChapterMedals() };
  try {
    const saved = JSON.parse(localStorage.getItem(REGISTRY_STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    const chapterMedals = emptyChapterMedals().map((medals, index) => {
      const savedMedals = saved.chapterMedals?.[index];
      if (!savedMedals || typeof savedMedals !== 'object') return medals;
      return {
        clear: savedMedals.clear === true,
        clean: savedMedals.clean === true,
        perfect: savedMedals.perfect === true,
      };
    });
    return {
      ...fallback,
      ...saved,
      chapterMedals,
      hunts: Math.max(0, Number(saved.hunts) || 0),
      victories: Math.max(0, Number(saved.victories) || 0),
      bestScore: Math.max(0, Number(saved.bestScore) || 0),
      bestCombo: Math.max(0, Number(saved.bestCombo) || 0),
      levelsCleared: Math.max(0, Number(saved.levelsCleared) || 0),
      shadowAmbushes: Math.max(0, Number(saved.shadowAmbushes) || 0),
      perfectShots: Math.max(0, Number(saved.perfectShots) || 0),
    };
  } catch {
    return fallback;
  }
}

const hunterRegistry = loadHunterRegistry();

// A checkpoint is earned only after a chapter is fully cleared. If the hunter
// falls inside the current chapter, the next hunt resumes at that chapter;
// unfinished encounters are never skipped or partially restored.
function getResumeLevelIndex() {
  // After a death, retry the chapter where this attempt ended. The registry's
  // highest unlocked chapter remains persistent, but it must not override the
  // active loss screen (for example, dying in chapter 3 after replaying from 1
  // must not offer chapter 8).
  if (state === 'lost') return Math.max(0, Math.min(TOTAL_LEVELS - 1, lossLevelIndex));
  const cleared = Math.max(0, Math.floor(Number(hunterRegistry.levelsCleared) || 0));
  return Math.min(TOTAL_LEVELS - 1, cleared);
}

function saveHunterRegistry() {
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(hunterRegistry));
  } catch {
    // Private browsing or a full storage quota must not stop the hunt.
  }
}

function registryMedalCount() {
  return hunterRegistry.chapterMedals.reduce((total, medals) => total + Number(medals.clear) + Number(medals.clean) + Number(medals.perfect), 0);
}

function registrySummaryText() {
  return t('registrySummary', {
    medals: registryMedalCount(),
    total: TOTAL_CHAPTER_MEDALS,
    shadow: hunterRegistry.shadowAmbushes,
    perfect: hunterRegistry.perfectShots,
  });
}

function recordHunterRun(outcome) {
  if (runRecorded) return;
  runRecorded = true;
  if (outcome === 'victory') hunterRegistry.victories += 1;
  hunterRegistry.shadowAmbushes += runShadowAmbushes;
  hunterRegistry.perfectShots += runPerfectShots;
  hunterRegistry.bestScore = Math.max(hunterRegistry.bestScore, score);
  hunterRegistry.bestCombo = Math.max(hunterRegistry.bestCombo, bestCombo);
  saveHunterRegistry();
  logProgress('hunter_registry_updated', { outcome, medals: registryMedalCount(), shadowAmbushes: hunterRegistry.shadowAmbushes, perfectShots: hunterRegistry.perfectShots });
}

function awardChapterMedals() {
  if (levelIndex < 0 || levelIndex >= TOTAL_LEVELS) return;
  const medals = hunterRegistry.chapterMedals[levelIndex];
  const before = registryMedalCount();
  medals.clear = true;
  if (levelDamageTaken === 0) medals.clean = true;
  if (levelPerfectShots > 0) medals.perfect = true;
  const earned = registryMedalCount() - before;
  hunterRegistry.levelsCleared = Math.max(hunterRegistry.levelsCleared, levelIndex + 1);
  if (earned > 0) {
    const points = earned * 180;
    score += points;
    addFloater(t('medalEarned', { points }), W / 2, 245, '#f4cf73', 28);
    spawnBurst(W / 2, 280, '#f4cf73', 20);
    synthTone(420 + earned * 70, 0.32, 'triangle', 0.09, 900 + earned * 80);
  }
  saveHunterRegistry();
}

let state = 'title';

function setGameState(nextState) {
  state = nextState;
  canvas.classList.toggle('title-screen', state === 'title');
}

let chapterTransition = null;
let bossVictoryMoment = null;
let briefingTimer = 0;
let briefingExitTimer = 0;
const BRIEFING_EXIT_DURATION = 0.78;
let briefingStarted = false;
let guideReactionCooldown = 0;
let guideSpeech = null;
let enemies = [];
let arrows = [];
let hostileShots = [];
let particles = [];
let floaters = [];
let spawnQueue = [];
let shadowAmbushPending = false;
let shadowAmbushDelay = 0;
let bossPending = false;
let bossSpawned = false;
let mouse = { x: W / 2, y: H / 2 };
let charging = false;
let shielding = false;
let charge = 0;
let markCooldown = 0;
let levelMarkedTargets = 0;
let levelWeaknessHits = 0;
let scoutTrialAwarded = false;
const MAX_HEALTH = 9;
let ammo = 40;
let health = 7;
const SHIELD_MAX = 100;
let shieldEnergy = SHIELD_MAX;
let shieldRegenDelay = 0;
let shieldFlash = 0;
let hitInvulnerability = 0;
let lossReason = 'health';
let lossLevelIndex = 0;
let empoweredArrows = 0;
let empoweredArrowTime = 0;
let score = 0;
let combo = 0;
let bestCombo = 0;
let comboMilestone = 0;
let kills = 0;
let levelIndex = -1;
let levelCooldown = 0;
let currentRank = levels[0].rankKey;
let levelReward = { kind: 'started', ammo: 0, health: false };
let levelDamageBonus = 0;
let levelDamageTaken = 0;
let levelPerfectShots = 0;
let levelShadowAmbushes = 0;
let runPerfectShots = 0;
let runShadowAmbushes = 0;
let runRecorded = false;
let banner = 0;
let shake = 0;
let flash = 0;
let hitStopTimer = 0;
let lastTime = performance.now();
let windTime = 0;
let audioUnlocked = false;
let browserPausedGame = false;
let resumePointerId = null;
let bossQaTrace = null;
let bossQaHistory = [];
let bossQaAutoClock = 0;

function positionLossActions() {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / W;
  const scaleY = rect.height / H;
  const displayWidth = Number.parseFloat(canvas.style.width) || rect.width;
  const displayHeight = Number.parseFloat(canvas.style.height) || rect.height;

  if (gameContainer.classList.contains('is-rotated-mobile')) {
    const actionWidth = Math.max(0, Math.min(900 * displayWidth / W, displayWidth - 24));
    lossActions.style.position = 'absolute';
    lossActions.style.left = `${Math.max(12, Math.min(displayWidth - actionWidth - 12, 1280 * displayWidth / W - actionWidth / 2))}px`;
    lossActions.style.top = `${790 * displayHeight / H}px`;
    lossActions.style.width = `${actionWidth}px`;
    lossActions.style.gap = `${Math.max(8, 16 * displayWidth / W)}px`;
    return;
  }

  const actionWidth = Math.max(0, Math.min(900 * scaleX, window.innerWidth - 24));
  const panelCenterX = rect.left + 1280 * scaleX;
  const left = Math.max(12, Math.min(window.innerWidth - actionWidth - 12, panelCenterX - actionWidth / 2));
  lossActions.style.position = 'fixed';
  lossActions.style.left = `${left}px`;
  // This is the button row's top edge, not its center; centering here pushed
  // the DOM buttons up over the checkpoint prompt drawn at y=748 in the Canvas.
  lossActions.style.top = `${rect.top + 790 * scaleY}px`;
  lossActions.style.width = `${actionWidth}px`;
  lossActions.style.gap = `${Math.max(8, 16 * scaleX)}px`;
}

function resizeCanvas() {
  // The game runs inside a portal iframe, so size from the actual game
  // container rather than assuming the top-level browser viewport.
  const viewportWidth = Math.max(1, gameContainer.clientWidth || window.visualViewport?.width || window.innerWidth);
  const viewportHeight = Math.max(1, gameContainer.clientHeight || window.visualViewport?.height || window.innerHeight);
  const isRotatedMobile = viewportHeight > viewportWidth && viewportWidth <= 900;
  gameContainer.classList.toggle('is-rotated-mobile', isRotatedMobile);

  if (isRotatedMobile) {
    const scale = Math.min(viewportHeight / W, viewportWidth / H);
    const displayWidth = W * scale;
    const displayHeight = H * scale;
    gameContainer.style.width = `${displayWidth}px`;
    gameContainer.style.height = `${displayHeight}px`;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
  } else {
    gameContainer.style.width = '';
    gameContainer.style.height = '';
    const scale = Math.min(viewportWidth / W, viewportHeight / H);
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
  }
  positionLossActions();
}
window.addEventListener('resize', () => resizeCanvas());
window.addEventListener('orientationchange', () => resizeCanvas());
window.visualViewport?.addEventListener('resize', () => resizeCanvas());

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (gameContainer.requestFullscreen) {
      await gameContainer.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch (error) {
    console.warn('Fullscreen was not available in this browser.', error);
  }
}

function updateFullscreenButton() {
  const active = Boolean(document.fullscreenElement);
  fullscreenButton.textContent = active ? '⛶' : '⛶';
  fullscreenButton.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen');
  fullscreenButton.title = active ? 'Exit fullscreen' : 'Enter fullscreen';
  resizeCanvas();
}

fullscreenButton.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFullscreenButton);
canvas.addEventListener('dblclick', toggleFullscreen);
resizeCanvas();

function pointerPosition(event) {
  if (state === 'paused') return;
  const rect = canvas.getBoundingClientRect();
  if (gameContainer.classList.contains('is-rotated-mobile')) {
    mouse.x = Math.max(0, Math.min(W, (1 - (event.clientY - rect.top) / rect.height) * W));
    mouse.y = Math.max(0, Math.min(H, (event.clientX - rect.left) / rect.width * H));
    return;
  }
  mouse.x = (event.clientX - rect.left) * W / rect.width;
  mouse.y = (event.clientY - rect.top) * H / rect.height;
}

function unlockAudio() {
  if (audioUnlocked) {
    if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
    playMusicChannels();
    return;
  }
  audioUnlocked = true;
  const browserWindow = /** @type {{ AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }} */ (window);
  const AudioContextClass = browserWindow.AudioContext || browserWindow.webkitAudioContext;
  if (AudioContextClass) {
    try {
      audioContext = new AudioContextClass();
      const resumePromise = audioContext.resume?.();
      resumePromise?.catch(() => {});
    } catch {
      audioContext = null;
    }
  }
  playMusicChannels();
}

function playClip(source, volume = 1) {
  if (muted) return null;
  const sound = source.cloneNode();
  setMediaVolume(sound, source.volume * volume);
  activeAudioClips.add(sound);
  sound.addEventListener('ended', () => activeAudioClips.delete(sound), { once: true });
  sound.play().catch(() => activeAudioClips.delete(sound));
  return sound;
}

function stopActiveVoice() {
  if (!activeVoice) return;
  activeVoice.pause();
  activeVoice.currentTime = 0;
  activeAudioClips.delete(activeVoice);
  activeVoice = null;
}

function playGuideVoice(source, volume = 1) {
  stopActiveVoice();
  activeVoice = playClip(source, volume);
}

function playMusicChannels() {
  if (muted || state === 'paused') return;
  const channels = new Set([activeMusicTrack, outgoingMusicTrack].filter(Boolean));
  channels.forEach((track) => track.play().catch(() => {}));
}

function pauseAudio() {
  musicTracks.forEach((track) => track.pause());
  activeAudioClips.forEach((sound) => sound.pause());
  audioContext?.suspend().catch(() => {});
}

function resumeAudio() {
  if (muted) return;
  audioContext?.resume().catch(() => {});
  playMusicChannels();
  activeAudioClips.forEach((sound) => sound.play().catch(() => {}));
}

function fadeMusicTo(target) {
  musicFadeTarget = Math.max(0, Math.min(1, target));
}

function selectMusicTrack(nextTrack) {
  if (nextTrack === activeMusicTrack) return;
  if (outgoingMusicTrack) outgoingMusicTrack.pause();
  outgoingMusicTrack = activeMusicTrack;
  activeMusicTrack = nextTrack;
  musicCrossfade = 0;
  playMusicChannels();
}

function selectMusicForLevel(index) {
  if (index >= 8) selectMusicTrack(finaleCampaignMusic);
  else if (index >= 6) selectMusicTrack(abyssCampaignMusic);
  else if (index >= 3) selectMusicTrack(middleCampaignMusic);
  else selectMusicTrack(music);
}

function updateMusicFade(dt) {
  const difference = musicFadeTarget - musicMasterVolume;
  if (Math.abs(difference) < 0.002) musicMasterVolume = musicFadeTarget;
  else musicMasterVolume += difference * Math.min(1, dt * 2.8);

  if (outgoingMusicTrack) {
    musicCrossfade = Math.min(1, musicCrossfade + dt / 1.4);
    const blend = musicCrossfade * musicCrossfade * (3 - 2 * musicCrossfade);
    setMediaVolume(activeMusicTrack, musicMasterVolume * blend);
    setMediaVolume(outgoingMusicTrack, musicMasterVolume * (1 - blend));
    if (musicCrossfade >= 1) {
      outgoingMusicTrack.pause();
      outgoingMusicTrack.currentTime = 0;
      setMediaVolume(outgoingMusicTrack, 0);
      outgoingMusicTrack = null;
    }
  } else {
    setMediaVolume(activeMusicTrack, musicMasterVolume);
  }

  musicTracks.forEach((track) => {
    if (track !== activeMusicTrack && track !== outgoingMusicTrack) setMediaVolume(track, 0);
  });
}

function playCreatureRoar(typeName, volume = 1) {
  const roarKind = creatureTypes[typeName]?.roar;
  const source = roarKind === 'dragon' ? dragonRoar : roarKind === 'wyvern' ? wyvernRoar : null;
  if (source) playClip(source, volume);
}

function synthTone(frequency, duration, type = 'sine', volume = 0.08, endFrequency = frequency) {
  if (muted || !audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function requestContinueAfterLoss() {
  if (state !== 'lost') return;
  unlockAudio();
  startGame(getResumeLevelIndex());
}

muteButton.addEventListener('click', (event) => {
  event.stopPropagation();
  unlockAudio();
  muted = !muted;
  writeLocalStorage('kara-av-muted', String(muted));
  musicTracks.forEach((track) => { track.muted = muted; });
  activeAudioClips.forEach((sound) => { sound.muted = muted; });
  muteButton.textContent = muted ? '♩' : '♫';
  muteButton.setAttribute('aria-pressed', String(muted));
  if (!muted && state !== 'paused') resumeAudio();
});

function exitToTitle() {
  browserPausedGame = false;
  chapterTransition = null;
  bossVictoryMoment = null;
  enemies = [];
  arrows = [];
  hostileShots = [];
  particles = [];
  floaters = [];
  spawnQueue = [];
  clearTransientInput();
  stopActiveVoice();
  setGameState('title');
  selectMusicTrack(music);
  fadeMusicTo(TITLE_MUSIC_VOLUME);
  syncLossActions();
}

function exitCurrentHunt(event) {
  event.preventDefault();
  event.stopPropagation();
  if (state === 'title') return;
  exitToTitle();
}

exitGameButton.addEventListener('click', (event) => exitCurrentHunt(event));

function retryAfterLoss(event) {
  event.preventDefault();
  event.stopPropagation();
  requestContinueAfterLoss();
}

function restartAfterLoss(event) {
  event.preventDefault();
  event.stopPropagation();
  if (state !== 'lost') return;
  unlockAudio();
  startGame(0);
}

function closeAfterLoss(event) {
  event.preventDefault();
  event.stopPropagation();
  if (state !== 'lost') return;
  exitToTitle();
}

// Keep the DOM actions above the Canvas on touch browsers. Native click is
// retained for keyboard accessibility, while pointerdown prevents the canvas
// from receiving the same gesture underneath the loss panel.
lossActions.addEventListener('pointerdown', (event) => event.stopPropagation());
lossRetryButton.addEventListener('click', (event) => retryAfterLoss(event));
lossRestartButton.addEventListener('click', (event) => restartAfterLoss(event));
lossCloseButton.addEventListener('click', (event) => closeAfterLoss(event));

function pauseGame() {
  if (state !== 'playing') return;
  setGameState('paused');
  pauseAudio();
  mobileFireButton.classList.remove('active');
  mobileShieldButton.classList.remove('active');
}

function resumeGame() {
  if (state !== 'paused') return;
  browserPausedGame = false;
  setGameState('playing');
  if (!audioUnlocked) unlockAudio();
  else resumeAudio();
}

function clearTransientInput() {
  charging = false;
  shielding = false;
  charge = 0;
  resumePointerId = null;
  mobileFireButton.classList.remove('active');
  mobileShieldButton.classList.remove('active');
  mobileMarkButton.classList.remove('active');
}

function beginMobileGameAction(event) {
  event.preventDefault();
  event.stopPropagation();
  unlockAudio();
  const target = /** @type {Element} */ (event.currentTarget);
  target.setPointerCapture?.(event.pointerId);
  if (state === 'paused') {
    resumePointerId = event.pointerId;
    resumeGame();
    return false;
  }
  if (state === 'briefing') {
    dismissBriefing();
    return false;
  }
  if (state === 'title' || state === 'won') startGame();
  return state === 'playing';
}

mobileFireButton.addEventListener('pointerdown', (event) => {
  if (!beginMobileGameAction(event)) return;
  if (!shielding && ammo > 0) {
    charging = true;
    charge = 0;
    mobileFireButton.classList.add('active');
  }
});
mobileFireButton.addEventListener('pointerup', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.pointerId === resumePointerId) {
    resumePointerId = null;
    mobileFireButton.classList.remove('active');
    return;
  }
  if (state === 'playing' && charging) shootArrow();
  charging = false;
  mobileFireButton.classList.remove('active');
});
mobileFireButton.addEventListener('pointercancel', () => {
  charging = false;
  mobileFireButton.classList.remove('active');
});
mobileShieldButton.addEventListener('pointerdown', (event) => {
  if (!beginMobileGameAction(event)) return;
  if (shieldEnergy > 0) {
    charging = false;
    shielding = true;
    mobileShieldButton.classList.add('active');
  }
});
mobileShieldButton.addEventListener('pointerup', (event) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.pointerId === resumePointerId) {
    resumePointerId = null;
    mobileShieldButton.classList.remove('active');
    return;
  }
  shielding = false;
  mobileShieldButton.classList.remove('active');
});
mobileShieldButton.addEventListener('pointercancel', () => {
  shielding = false;
  mobileShieldButton.classList.remove('active');
});
mobileMarkButton.addEventListener('pointerdown', (event) => {
  if (!beginMobileGameAction(event)) return;
  markTargetAtCursor();
  mobileMarkButton.classList.add('active');
  window.setTimeout(() => mobileMarkButton.classList.remove('active'), 140);
});

canvas.addEventListener('pointermove', (event) => pointerPosition(event));
canvas.addEventListener('contextmenu', (event) => event.preventDefault());
canvas.addEventListener('pointerdown', (event) => {
  pointerPosition(event);
  if (event.pointerType === 'touch') {
    const target = /** @type {Element} */ (event.currentTarget);
    target.setPointerCapture?.(event.pointerId);
  }
  unlockAudio();
  if (state === 'paused') {
    if (event.button === 0) {
      event.preventDefault();
      resumePointerId = event.pointerId;
      resumeGame();
    }
    return;
  }
  if (state === 'title' || state === 'won') {
    if (event.button === 0) startGame();
    return;
  }
  if (state === 'briefing') {
    if (event.button === 0) dismissBriefing();
    return;
  }
  if (state !== 'playing') return;
  if (event.button === 1) {
    event.preventDefault();
    markTargetAtCursor();
    return;
  }
  if (event.button === 2) {
    charging = false;
    if (shieldEnergy > 0) shielding = true;
    return;
  }
  if (event.button === 0 && !shielding && ammo > 0) {
    charging = true;
    charge = 0;
  }
});
window.addEventListener('pointerup', (event) => {
  if (event.pointerId === resumePointerId) {
    resumePointerId = null;
    return;
  }
  if (event.button === 2) shielding = false;
  if (event.button === 0 && state === 'playing' && charging) shootArrow();
  if (event.button === 0) charging = false;
});
window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape') {
    event.preventDefault();
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
    return;
  }
  if (state === 'lost') {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      requestContinueAfterLoss();
    }
    return;
  }
  if (state === 'paused') {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      resumeGame();
    }
    return;
  }
  if (state === 'briefing') {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      dismissBriefing();
    }
    return;
  }
  if (event.code === 'KeyM' && state === 'playing') {
    event.preventDefault();
    unlockAudio();
    markTargetAtCursor();
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    unlockAudio();
    if (state === 'title' || state === 'won') startGame();
  }
  if ((event.code === 'ShiftLeft' || event.code === 'ShiftRight') && state === 'playing') {
    unlockAudio();
    if (shieldEnergy > 0) shielding = true;
    charging = false;
  }
});
window.addEventListener('keyup', (event) => {
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') shielding = false;
});
function pauseForBrowserInterruption() {
  clearTransientInput();
  if (state !== 'playing') return;
  browserPausedGame = true;
  pauseGame();
}

function browserPageIsActive() {
  if (document.hidden) return false;
  return typeof document.hasFocus !== 'function' || document.hasFocus();
}

function resumeAfterBrowserInterruption() {
  if (!browserPausedGame || !browserPageIsActive()) return;
  resumeGame();
}

window.addEventListener('blur', () => pauseForBrowserInterruption());
window.addEventListener('focus', () => resumeAfterBrowserInterruption());
window.addEventListener('pageshow', () => resumeAfterBrowserInterruption());
document.addEventListener('resume', () => resumeAfterBrowserInterruption());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseForBrowserInterruption();
  else resumeAfterBrowserInterruption();
});

function startGame(startLevelIndex = 0) {
  const requestedStartLevel = Math.max(0, Math.min(TOTAL_LEVELS - 1, Math.floor(Number(startLevelIndex) || 0)));
  browserPausedGame = false;
  chapterTransition = null;
  bossVictoryMoment = null;
  enemies = [];
  arrows = [];
  hostileShots = [];
  particles = [];
  floaters = [];
  spawnQueue = [];
  shadowAmbushPending = false;
  shadowAmbushDelay = 0;
  bossPending = false;
  bossSpawned = false;
  fadeMusicTo(BRIEFING_MUSIC_VOLUME);
  ammo = 40;
  health = 7;
  shieldEnergy = SHIELD_MAX;
  shieldRegenDelay = 0;
  shieldFlash = 0;
  hitInvulnerability = 0;
  hitStopTimer = 0;
  lossReason = 'health';
  empoweredArrows = 0;
  empoweredArrowTime = 0;
  shielding = false;
  score = 0;
  combo = 0;
  bestCombo = 0;
  comboMilestone = 0;
  kills = 0;
  levelIndex = requestedStartLevel - 1;
  levelCooldown = 0;
  currentRank = levels[requestedStartLevel].rankKey;
  lossLevelIndex = requestedStartLevel;
  levelReward = { kind: 'started', ammo: 0, health: false };
  levelDamageBonus = 0;
  levelDamageTaken = 0;
  levelPerfectShots = 0;
  levelShadowAmbushes = 0;
  runPerfectShots = 0;
  runShadowAmbushes = 0;
  runRecorded = false;
  bossQaTrace = null;
  bossQaHistory = [];
  bossQaAutoClock = 0;
  hunterRegistry.hunts += 1;
  saveHunterRegistry();
  charge = 0;
  charging = false;
  markCooldown = 0;
  levelMarkedTargets = 0;
  levelWeaknessHits = 0;
  scoutTrialAwarded = false;
  resumePointerId = null;
  briefingTimer = 0;
  briefingExitTimer = 0;
  briefingStarted = false;
  guideReactionCooldown = 0;
  guideSpeech = null;
  stopActiveVoice();
  setGameState('playing');
  syncLossActions();
  beginLevel();
  logProgress('hunt_started', {
    totalTargets: TOTAL_TARGETS,
    startLevel: requestedStartLevel + 1,
    resumed: requestedStartLevel > 0,
  });
}

function endRun(reason) {
  lossReason = reason;
  lossLevelIndex = Math.max(0, Math.min(TOTAL_LEVELS - 1, levelIndex));
  setGameState('lost');
  syncLossActions();
  chapterTransition = null;
  charging = false;
  shielding = false;
  arrows = [];
  hostileShots = [];
  stopActiveVoice();
  fadeMusicTo(0.045);
  playClip(reason === 'arrows' ? ammoFailureSting : hunterDeathSting, 0.96);
  recordHunterRun('defeat');
  logProgress('hunt_failed', { reason: lossReason, score, kills });
}

function startChapterVictoryTransition() {
  if (state !== 'playing') return;
  chapterTransition = {
    life: 2.4,
    maxLife: 2.4,
    nextLevelIndex: levelIndex + 1,
  };
  setGameState('transition');
  charging = false;
  shielding = false;
  arrows = [];
  hostileShots = [];
  stopActiveVoice();
  fadeMusicTo(0.08);
  playClip(chapterVictorySting, 0.92);
  synthTone(470 + levelIndex * 18, 0.5, 'triangle', 0.1, 980 + levelIndex * 20);
}

function bossVictoryFragments(enemy) {
  const fragmentCount = 18;
  const fragments = [];
  for (let index = 0; index < fragmentCount; index += 1) {
    const angle = index / fragmentCount * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
    const sweep = Math.PI / fragmentCount * (0.82 + Math.random() * 0.22);
    const innerRadius = 0.06 + Math.random() * 0.1;
    const outerRadius = 0.92 + Math.random() * 0.2;
    const pointAt = (radius, pointAngle) => ({
      x: Math.cos(pointAngle) * enemy.width * 0.64 * radius,
      y: Math.sin(pointAngle) * enemy.height * 0.64 * radius,
    });
    fragments.push({
      points: [
        pointAt(innerRadius, angle - sweep),
        pointAt(outerRadius, angle - sweep * 0.7),
        pointAt(outerRadius * (0.95 + Math.random() * 0.08), angle + sweep * 0.72),
        pointAt(innerRadius, angle + sweep),
      ],
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * (90 + Math.random() * 190) + enemy.vx * 0.06,
      vy: Math.sin(angle) * (70 + Math.random() * 145) - 24,
      rotation: 0,
      spin: (Math.random() - 0.5) * 2.2,
    });
  }
  return fragments;
}

function playBossDefeatSound(enemy) {
  playClip(hitSound, 1.14);
  playCreatureRoar(enemy.typeName, 0.78);
  const defeatTones = {
    ember: [126, 48],
    storm: [300, 74],
    ice: [470, 150],
    lava: [116, 42],
    void: [205, 58],
  };
  const [startFrequency, endFrequency] = defeatTones[enemy.arenaTheme] || defeatTones.storm;
  synthTone(startFrequency, 0.72, 'sawtooth', 0.085, endFrequency);
  synthTone(startFrequency * 1.8, 0.28, 'triangle', 0.055, startFrequency * 0.84);
}

function startBossVictoryMoment(enemy) {
  if (!enemy.isBoss || bossVictoryMoment) return;
  bossVictoryMoment = {
    life: 1.85,
    maxLife: 1.85,
    x: enemy.x,
    y: enemy.y,
    width: enemy.width,
    height: enemy.height,
    image: enemy.image,
    nameKey: enemy.nameKey,
    accent: enemy.bossAccent,
    arenaTheme: enemy.arenaTheme,
    coreColor: enemy.bossCoreColor,
    fragments: bossVictoryFragments(enemy),
  };
  enemy.dead = true;
  charging = false;
  shielding = false;
  hostileShots = [];
  arrows = [];
  setGameState('bossVictory');
  fadeMusicTo(0.045);
  playBossDefeatSound(enemy);
  spawnBurst(enemy.x, enemy.y, enemy.bossCoreColor, 46);
  addFloater(t('realmThreatBroken'), enemy.x, enemy.y - enemy.height / 2 - 74, enemy.bossAccent, 29);
  shake = Math.max(shake, 14);
  logProgress('boss_defeated', { level: levelIndex + 1, boss: t(enemy.nameKey), arenaTheme: enemy.arenaTheme });
}

function updateBossVictoryMoment(dt) {
  if (!bossVictoryMoment) return;
  const moment = bossVictoryMoment;
  moment.life -= BOSS_QA_AUTO ? moment.life : dt;
  moment.fragments.forEach((fragment) => {
    fragment.x += fragment.vx * dt;
    fragment.y += fragment.vy * dt;
    fragment.vy += 92 * dt;
    fragment.rotation += fragment.spin * dt;
  });
  if (moment.life > 0) return;
  bossVictoryMoment = null;
  setGameState('playing');
  if (levelIndex >= TOTAL_LEVELS - 1) beginLevel();
  else startChapterVictoryTransition();
}

function grantLevelAdvantage() {
  const ammoBonus = 18 + levelIndex * 2;
  const healthBonus = health < MAX_HEALTH;
  ammo += ammoBonus;
  health = Math.min(MAX_HEALTH, health + 1);
  shieldEnergy = SHIELD_MAX;
  shieldRegenDelay = 0;
  empoweredArrows = Math.max(empoweredArrows, 2);
  empoweredArrowTime = Math.max(empoweredArrowTime, 7 + levelIndex * 0.35);
  levelDamageBonus = Math.floor(levelIndex / 3);
  score += levelIndex * 125;
  levelReward = { kind: 'reward', ammo: ammoBonus, health: healthBonus };
  addFloater(`${t(currentRank)} ${t('rank')}`, W / 2, 350, '#f3cb78', 34);
  synthTone(260 + levelIndex * 18, 0.48, 'triangle', 0.1, 720 + levelIndex * 22);
}

function getLevelRewardText() {
  if (levelReward.kind === 'reward') {
    return t('reward', {
      rank: t(currentRank),
      ammo: levelReward.ammo,
      health: levelReward.health ? t('plusHealth') : '',
    });
  }
  return t('started', { rank: t(currentRank) });
}

function startLevelBriefing() {
  setGameState('briefing');
  briefingStarted = true;
  briefingTimer = 7.2;
  guideReactionCooldown = 1.5;
  guideSpeech = {
    kind: 'briefing',
    textKey: `briefingText${levelIndex + 1}`,
    life: briefingTimer,
    maxLife: briefingTimer,
  };
  const voice = briefingVoices[LEVEL_VOICES[levelIndex]];
  if (voice) playGuideVoice(voice, 1);
}

function dismissBriefing() {
  if (state !== 'briefing') return;
  stopActiveVoice();
  briefingStarted = false;
  briefingExitTimer = BRIEFING_EXIT_DURATION;
  setGameState('briefingExit');
  fadeMusicTo(COMBAT_MUSIC_VOLUME);
  if (!muted && audioUnlocked) resumeAudio();
}

function beginLevel() {
  levelIndex += 1;
  if (levelIndex >= levels.length) {
    chapterTransition = null;
    if (BOSS_QA_AUTO) console.info('[Boss QA] campaign complete', { encounters: bossQaHistory });
    setGameState('won');
    fadeMusicTo(0.025);
    playClip(campaignVictorySting, 0.98);
    recordHunterRun('victory');
    logProgress('hunt_completed', { score, bestCombo, rank: currentRank, medals: registryMedalCount() });
    synthTone(440, 0.7, 'triangle', 0.12, 880);
    return;
  }
  currentRank = levels[levelIndex].rankKey;
  selectMusicForLevel(levelIndex);
  levelDamageTaken = 0;
  levelPerfectShots = 0;
  levelShadowAmbushes = 0;
  levelMarkedTargets = 0;
  levelWeaknessHits = 0;
  scoutTrialAwarded = false;
  // Every chapter starts with a clean, full shield state. This prevents a
  // broken/held shield state from carrying across the level transition.
  shieldEnergy = SHIELD_MAX;
  shieldRegenDelay = 0;
  shieldFlash = 0;
  shielding = false;
  mobileShieldButton.classList.remove('active');
  shadowAmbushPending = Boolean(levels[levelIndex].shadowAmbush);
  shadowAmbushDelay = shadowAmbushPending ? 4.2 : 0;
  bossPending = Boolean(levels[levelIndex].boss);
  bossSpawned = false;
  fadeMusicTo(BRIEFING_MUSIC_VOLUME);
  if (levelIndex > 0) grantLevelAdvantage();
  else levelReward = { kind: 'started', ammo: 0, health: false };
  banner = 0;
  const activeLevel = levels[levelIndex];
  const formationAssignments = new Map();
  activeLevel.formationWaves?.forEach((wave, waveIndex) => {
    const pattern = COORDINATED_FORMATION_PATTERNS[wave.pattern];
    if (!pattern) return;
    wave.indices.forEach((rosterIndex, memberIndex) => {
      const member = pattern.members[memberIndex];
      if (!member) return;
      formationAssignments.set(rosterIndex, {
        ...member,
        formationId: `level-${levelIndex + 1}-wave-${waveIndex + 1}`,
        formationIndex: memberIndex,
        formationSize: wave.indices.length,
        formationColor: pattern.color,
        formationAttackDelay: pattern.attackDelay,
        formationDelay: wave.delay + memberIndex * 0.08,
      });
    });
  });
  spawnQueue = activeLevel.roster.map((type, index) => {
    const formation = formationAssignments.get(index);
    return {
      type,
      delay: formation?.formationDelay ?? 0.45 + index * 1.05,
      encounterOptions: formation || null,
    };
  });
  startLevelBriefing();
  logProgress('level_started', { level: levelIndex + 1, location: t(levels[levelIndex].nameKey), rank: currentRank });
}

function spawnEnemy(typeName, bossProfile = null, encounterOptions = null) {
  const type = creatureTypes[typeName];
  const formation = encounterOptions?.formationId ? encounterOptions : null;
  const sizeScale = bossProfile?.sizeScale || 1;
  const width = type.width * sizeScale;
  const height = type.height * sizeScale;
  const radius = type.radius * (0.92 + sizeScale * 0.08);
  const levelPressure = levels[levelIndex]?.pressure || 1;
  const difficulty = (1 + levelIndex * 0.11) * levelPressure;
  const enemyHp = Math.ceil(type.hp * difficulty * (bossProfile?.hpScale || 1));
  const baseAttack = Math.max(2.25, type.attack / (1 + levelIndex * 0.06));
  const enemyAttack = Math.max(2.05, baseAttack * levelPressure * (bossProfile?.attackScale || 1));
  const speed = type.speed * (0.94 + levelIndex * 0.025) * levelPressure * (bossProfile?.speedScale || 1);
  const fromLeft = bossProfile?.entrySide
    ? bossProfile.entrySide === 'left'
    : formation?.entrySide
      ? formation.entrySide === 'left'
      : Math.random() > 0.5;
  const bobAmount = bossProfile?.bobAmount ?? (typeName === 'wraith' ? 45 : 28);
  const flightRate = bossProfile?.flightRate ?? (typeName === 'wraith' ? 6.4 : typeName === 'void' ? 2.45 : 3.8);
  const motionScale = bossProfile?.motionScale ?? (formation ? 1.12 : 1);
  const minBaseY = HUD_FLIGHT_TOP + height / 2 + bobAmount;
  const maxBaseY = HUD_FLIGHT_BOTTOM - height / 2 - bobAmount;
  const formationBaseY = formation
    ? minBaseY + (maxBaseY - minBaseY) * formation.lane
    : null;
  const y = formationBaseY ?? minBaseY + Math.random() * Math.max(40, maxBaseY - minBaseY);
  const spriteFacing = bossProfile?.spriteFacing ?? type.spriteFacing ?? 1;
  const entryFacing = fromLeft ? 1 : -1;
  const enemy = {
    typeName,
    ...type,
    image: bossProfile?.image || type.image,
    animationSheet: bossProfile ? BOSS_ANIMATION_SHEETS[bossProfile.nameKey] || type.animationSheet : type.animationSheet,
    width,
    height,
    radius,
    hp: enemyHp,
    maxHp: enemyHp,
    nameKey: bossProfile?.nameKey || type.nameKey,
    isBoss: Boolean(bossProfile),
    bossAccent: bossProfile?.accent || '#f3cb78',
    arenaTheme: bossProfile?.arenaTheme || 'storm',
    bossCoreColor: bossArenaTheme({ arenaTheme: bossProfile?.arenaTheme }).core,
    spriteFacing,
    animationFrameMap: bossProfile?.animationFrameMap || null,
    mouthX: bossProfile?.mouthX ?? type.mouthX ?? 0.36,
    mouthY: bossProfile?.mouthY ?? type.mouthY ?? -0.06,
    headX: bossProfile?.headX ?? 0.32,
    headY: bossProfile?.headY ?? -0.05,
    headRadius: bossProfile?.headRadius ?? 0.42,
    entrySide: bossProfile?.entrySide || formation?.entrySide || (fromLeft ? 'left' : 'right'),
    turnMargin: width * (bossProfile?.turnMargin ?? 0.42),
    entryFacing,
    formationId: formation?.formationId || null,
    formationIndex: formation?.formationIndex ?? -1,
    formationSize: formation?.formationSize || 0,
    formationColor: formation?.formationColor || '#9beee7',
    formationFlash: 0,
    formationTelegraphPlayed: false,
    routeDrift: formation?.drift || 0,
    routeProgress: 0,
    turnCount: 0,
    turnFlash: 0,
    bossPhase: 1,
    phaseFlash: 0,
    speed,
    attack: enemyAttack,
    shotSpeed: type.shotSpeed * (1 + levelIndex * 0.025) * levelPressure,
    flightRate,
    bobAmount,
    motionScale,
    x: fromLeft ? -width : W + width,
    y,
    baseY: y,
    vx: entryFacing * speed * (0.9 + Math.random() * 0.2),
    phase: Math.random() * Math.PI * 2,
    age: 0,
    attackTimer: formation?.formationAttackDelay ?? enemyAttack * (0.65 + Math.random() * 0.45),
    attackState: 'flight',
    attackKind: null,
    attackWindup: 0,
    attackWindupDuration: 0,
    attackRecovery: 0,
    attackRecoveryDuration: 0,
    diveTimer: 0,
    diveDuration: 0,
    diveElapsed: 0,
    diveStartX: 0,
    diveStartY: 0,
    diveVX: 0,
    diveVY: 0,
    diveTargetX: bow.x,
    diveTargetY: bow.y - 230,
    diveRecovery: false,
    diveRecoveryStartY: 0,
    diveHitResolved: false,
    dodgeTimer: 0,
    dodgeDirection: 0,
    hitFlash: 0,
    markedUntil: 0,
    markPulse: 0,
    powerDropGranted: false,
    dead: false,
  };
  enemies.push(enemy);
  if (enemy.isBoss) {
    bossQaTrace = {
      level: levelIndex + 1,
      nameKey: enemy.nameKey,
      entrySide: enemy.entrySide,
      entryFacing,
      spawnX: enemy.x,
      turnX: entryFacing > 0 ? W - enemy.turnMargin : enemy.turnMargin,
      turnObserved: false,
      headObserved: false,
      mouthObserved: false,
      turnCount: 0,
      phasesObserved: [1],
      defeated: false,
    };
    bossQaHistory.push(bossQaTrace);
    if (BOSS_QA_MODE) console.info('[Boss QA] spawned', bossQaTrace);
  }
  if (type.roar) playCreatureRoar(typeName, bossProfile ? 0.92 : type.roar === 'dragon' ? 0.72 : 0.56);
}

function spawnChapterBoss() {
  if (state !== 'playing' || !bossPending || bossSpawned) return;
  const boss = levels[levelIndex]?.boss;
  if (!boss) {
    bossPending = false;
    return;
  }
  bossPending = false;
  bossSpawned = true;
  fadeMusicTo(BOSS_MUSIC_VOLUME);
  spawnEnemy(boss.type, { ...boss, speedScale: boss.speedScale ?? 0.88, attackScale: boss.attackScale ?? 0.82 });
  addFloater(t('bossEncounter'), W / 2, 240, boss.accent, 34);
  spawnBurst(W / 2, 390, boss.accent, 34);
  synthTone(105 - levelIndex * 3, 0.72, 'sawtooth', 0.08, 38);
}

function spawnShadowAmbush() {
  const type = creatureTypes.wraith;
  const difficulty = 1 + levelIndex * 0.11;
  const fromLeft = Math.random() > 0.5;
  const bobAmount = 45;
  const minBaseY = HUD_FLIGHT_TOP + type.height / 2 + bobAmount;
  const maxBaseY = HUD_FLIGHT_BOTTOM - type.height / 2 - bobAmount;
  const y = minBaseY + Math.random() * Math.max(40, maxBaseY - minBaseY);
  const speed = type.speed * (1.22 + levelIndex * 0.025);
  const enemyHp = Math.ceil((type.hp + 1) * difficulty);
  enemies.push({
    typeName: 'wraith',
    ...type,
    isShadowAmbush: true,
    hp: enemyHp,
    maxHp: enemyHp,
    score: type.score + 260 + levelIndex * 45,
    speed,
    attack: Math.max(2.3, type.attack / (1 + levelIndex * 0.04)),
    shotSpeed: type.shotSpeed * (1.1 + levelIndex * 0.025),
    flightRate: 8.2,
    bobAmount,
    motionScale: 1.12,
    x: fromLeft ? -type.width * 0.7 : W + type.width * 0.7,
    y,
    baseY: y,
    vx: (fromLeft ? 1 : -1) * speed,
    phase: Math.random() * Math.PI * 2,
    age: 0,
    attackTimer: 2.2,
    attackState: 'flight',
    attackKind: null,
    attackWindup: 0,
    attackWindupDuration: 0,
    attackRecovery: 0,
    attackRecoveryDuration: 0,
    diveTimer: 0,
    diveDuration: 0,
    diveElapsed: 0,
    diveStartX: 0,
    diveStartY: 0,
    diveVX: 0,
    diveVY: 0,
    diveTargetX: bow.x,
    diveTargetY: bow.y - 230,
    diveRecovery: false,
    diveRecoveryStartY: 0,
    diveHitResolved: false,
    dodgeTimer: 0,
    dodgeDirection: 0,
    hitFlash: 0,
    markedUntil: 0,
    markPulse: 0,
    powerDropGranted: false,
    dead: false,
  });
  addFloater(t('shadowAmbush'), W / 2, 240, '#b88cff', 34);
  spawnBurst(fromLeft ? 70 : W - 70, y, '#8755ce', 26);
  synthTone(150, 0.55, 'sawtooth', 0.06, 42);
}

function markTargetAtCursor() {
  if (state !== 'playing' || markCooldown > 0) return;
  let target = null;
  let closestDistance = Infinity;
  enemies.forEach((enemy) => {
    if (enemy.dead) return;
    const distance = Math.hypot(mouse.x - enemy.x, mouse.y - enemy.y);
    if (distance <= enemy.radius * 1.35 && distance < closestDistance) {
      target = enemy;
      closestDistance = distance;
    }
  });
  if (!target) return;
  const wasMarked = target.markedUntil > 0;
  target.markedUntil = 5.8;
  target.markPulse = 0.55;
  markCooldown = 0.85;
  if (wasMarked) return;
  levelMarkedTargets += 1;
  addFloater(t('markTarget'), target.x, target.y - target.height / 2 - 48, '#f3d47c', 25);
  spawnBurst(target.x, target.y, '#f3d47c', 12);
  synthTone(460, 0.18, 'triangle', 0.07, 760);
}

function awardScoutTrial() {
  const level = levels[levelIndex];
  if (!level?.scoutTrial || scoutTrialAwarded) return;
  scoutTrialAwarded = true;
  const required = level.scoutMarksRequired || 0;
  if (levelMarkedTargets < required || levelWeaknessHits < 1) return;
  const points = 520 + levelIndex * 45;
  score += points;
  addFloater(t('scoutConfronted', { points }), W / 2, 280, '#82b9ea', 28);
  spawnBurst(W / 2, 330, '#82b9ea', 22);
  synthTone(380, 0.34, 'triangle', 0.09, 920);
}

function shootArrow() {
  if (ammo <= 0) return;
  const power = Math.max(0.22, Math.min(1, charge));
  const empowered = empoweredArrows > 0 && empoweredArrowTime > 0;
  const angle = bowAimAngle();
  if (Math.sin(angle) > -0.08) return;
  const muzzle = bowMuzzlePosition(angle);
  const speed = 1050 + power * 750;
  arrows.push({
    x: muzzle.x,
    y: muzzle.y,
    px: muzzle.x,
    py: muzzle.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    life: 2.2,
    power,
    empowered,
  });
  ammo -= 1;
  if (empowered) empoweredArrows -= 1;
  charge = 0;
  playClip(bowSound);
  shake = Math.max(shake, 3);
}

function enemyFireOrigin(enemy) {
  return enemy.roar ? bossMouthPoint(enemy) : { x: enemy.x, y: enemy.y + 20 };
}

function triggerFormationTelegraph(enemy) {
  if (!enemy.formationId || enemy.formationTelegraphPlayed) return;
  const members = enemies.filter((candidate) => candidate.formationId === enemy.formationId && !candidate.dead);
  if (members.length < 2) return;
  members.forEach((member) => {
    member.formationTelegraphPlayed = true;
    member.formationFlash = 0.92;
    spawnBurst(member.x, member.y, member.formationColor, 6);
  });
  addFloater(t('formationWarning'), W / 2, 266, enemy.formationColor, 25);
  synthTone(230, 0.3, 'sawtooth', 0.05, 110);
}

function fireAtHunter(enemy) {
  const isDragonFire = Boolean(enemy.roar);
  // Fireballs begin at the profiled jaw point, not at the body center. The same
  // movement-facing helper drives the rendered mirror, hit direction and shot origin.
  const mouth = enemyFireOrigin(enemy);
  const originX = mouth.x;
  const originY = mouth.y;
  if (enemy.isBoss && BOSS_QA_MODE && bossQaTrace) bossQaTrace.mouthObserved = true;
  const angle = Math.atan2(bow.y - originY, bow.x - originX);
  const speed = enemy.shotSpeed;
  const bossPhase = enemy.bossPhase || 1;
  const isBossFire = Boolean(enemy.isBoss && isDragonFire);
  hostileShots.push({
    x: originX,
    y: originY,
    px: originX,
    py: originY,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: enemy.shotRadius * (isBossFire ? 1.22 + (bossPhase - 1) * 0.1 : 1),
    color: enemy.isBoss ? enemy.bossCoreColor : enemy.shotColor,
    isDragonFire,
    isBossFire,
    damage: isBossFire ? (bossPhase >= 3 ? 3 : 2) : 1,
    life: 5,
  });
  if (enemy.roar) playCreatureRoar(enemy.typeName, enemy.roar === 'dragon' ? 0.5 : 0.38);
  synthTone(enemy.roar === 'wyvern' ? 115 : enemy.roar === 'dragon' ? 90 : 170, 0.35, 'sawtooth', 0.045, 55);
}

function segmentCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lengthSquared));
  const x = x1 + t * dx;
  const y = y1 + t * dy;
  return Math.hypot(x - cx, y - cy) < radius;
}

function shieldVector() {
  const angle = bowAimAngle();
  return { angle, x: Math.cos(angle), y: Math.sin(angle) };
}

function shieldPlacement() {
  const direction = shieldVector();
  const muzzle = bowMuzzlePosition(direction.angle);
  return {
    direction,
    // Start from the real bolt exit, then move forward so the shield is visibly
    // held outward in front of the crossbow rather than inward over the stock.
    x: muzzle.x + direction.x * SHIELD_FORWARD_OFFSET,
    y: muzzle.y + direction.y * SHIELD_FORWARD_OFFSET,
  };
}

function shieldCanBlock(shot) {
  if (!shielding || shieldEnergy <= 0) return false;
  const { direction, x: shieldX, y: shieldY } = shieldPlacement();
  const dx = shot.x - bow.x;
  const dy = shot.y - bow.y;
  const distance = Math.hypot(dx, dy) || 1;
  const aimedAtThreat = (dx * direction.x + dy * direction.y) / distance > 0.12;
  return aimedAtThreat && segmentCircle(shot.px, shot.py, shot.x, shot.y, shieldX, shieldY, 96);
}

function blockShot(shot) {
  shot.dead = true;
  shieldEnergy = Math.max(0, shieldEnergy - 24);
  shieldRegenDelay = 1.8;
  shieldFlash = 0.28;
  score += 35;
  combo += 1;
  bestCombo = Math.max(bestCombo, combo);
  rewardComboMilestone();
  addFloater(t('shieldBlocked', { points: 35 }), shot.x, shot.y - 30, '#9beee7', 25);
  spawnBurst(shot.x, shot.y, '#9beee7', 22);
  synthTone(520, 0.2, 'triangle', 0.09, 180);
  shake = Math.max(shake, 6);
  guideReact('shield');
  if (shieldEnergy <= 0) {
    shielding = false;
    addFloater(t('shieldBroken'), bow.x, bow.y - 170, '#ff916c', 30);
  }
}

function spawnBurst(x, y, color, count = 14) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 330;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.35 + Math.random() * 0.55, maxLife: 0.9, color, size: 2 + Math.random() * 7 });
  }
}

function addFloater(text, x, y, color = '#f5d899', size = 30) {
  floaters.push({ text, x, y, color, size, life: 1, maxLife: 1 });
}

function rewardComboMilestone() {
  const reachedMilestone = Math.floor(combo / 5);
  if (reachedMilestone <= comboMilestone) return;
  comboMilestone = reachedMilestone;
  const bonusArrows = reachedMilestone % 3 === 0 ? 2 : 1;
  empoweredArrows = Math.min(6, empoweredArrows + bonusArrows);
  empoweredArrowTime = Math.max(empoweredArrowTime, 6 + Math.min(reachedMilestone, 6) * 0.5);
  const bonusScore = 50 * reachedMilestone;
  score += bonusScore;
  const visual = rankVisuals[Math.max(0, Math.min(rankVisuals.length - 1, levelIndex))];
  addFloater(t('comboSurge', { count: combo, arrows: bonusArrows }), bow.x, bow.y - 190, visual.accent, 27);
  spawnBurst(bow.x + 45, bow.y - 25, visual.glow, 18);
  synthTone(360 + reachedMilestone * 34, 0.28, 'triangle', 0.08, 760 + reachedMilestone * 28);
}

function guideReact(kind) {
  if (state !== 'playing' || briefingStarted || guideReactionCooldown > 0) return;
  const textKey = kind === 'perfect' ? 'guidePraisePerfect' : kind === 'hit' ? 'guidePraiseHit' : kind === 'miss' ? 'guideMiss' : kind === 'shield' ? 'guideShield' : 'guideDanger';
  const voiceKey = kind === 'perfect' ? 'perfect' : kind === 'hit' ? 'hit' : kind === 'miss' ? 'miss' : 'danger';
  const life = kind === 'perfect' ? 3.2 : 2.7;
  guideSpeech = { kind: 'reaction', textKey, life, maxLife: life };
  guideReactionCooldown = kind === 'perfect' ? 3.2 : 2.6;
  const voice = guideReactionVoices[voiceKey];
  if (voice) playGuideVoice(voice, kind === 'danger' ? 0.92 : 0.82);
}

function bossPhaseFor(enemy) {
  const healthRatio = Math.max(0, enemy.hp / enemy.maxHp);
  if (healthRatio <= 0.33) return 3;
  if (healthRatio <= 0.66) return 2;
  return 1;
}

function triggerBossPhase(enemy, nextPhase) {
  if (!enemy.isBoss || nextPhase <= enemy.bossPhase) return;
  enemy.bossPhase = nextPhase;
  if (bossQaTrace?.nameKey === enemy.nameKey && !bossQaTrace.phasesObserved.includes(nextPhase)) {
    bossQaTrace.phasesObserved.push(nextPhase);
  }
  enemy.phaseFlash = 1;
  const theme = bossArenaTheme(enemy);
  spawnBurst(enemy.x, enemy.y, theme.core, 30);
  addFloater(t('bossPhase', { phase: nextPhase }), enemy.x, enemy.y - enemy.height / 2 - 88, theme.core, 24);
  synthTone(120 + nextPhase * 34, 0.36, 'sawtooth', 0.055, 310 + nextPhase * 70);
  shake = Math.max(shake, 6 + nextPhase * 2);
}

function updateBossPhase(enemy) {
  if (!enemy.isBoss) return;
  const nextPhase = bossPhaseFor(enemy);
  triggerBossPhase(enemy, nextPhase);
}

function hitEnemy(enemy, arrow) {
  if (enemy.dead || state !== 'playing') return;
  const head = bossHeadPoint(enemy);
  const headDistance = Math.hypot(arrow.x - head.x, arrow.y - head.y);
  const critical = headDistance < head.radius;
  const weaknessExposed = enemy.markedUntil > 0 && headDistance < Math.max(head.radius * 1.7, enemy.radius * 0.58);
  if (enemy.isBoss && BOSS_QA_MODE && critical && bossQaTrace) bossQaTrace.headObserved = true;
  const perfect = critical && arrow.power >= 0.98;
  const damage = ((critical ? 2 : 1) + (weaknessExposed ? 1 : 0)) * (arrow.empowered ? 2 : 1) + levelDamageBonus;
  enemy.hp -= damage;
  if (enemy.hp > 0) updateBossPhase(enemy);
  enemy.hitFlash = 0.18;
  hitStopTimer = Math.max(hitStopTimer, critical ? 0.055 : 0.038);
  enemy.dodgeTimer = Math.max(enemy.dodgeTimer || 0, critical ? 0.32 : 0.22);
  enemy.dodgeDirection = -(Math.sign(enemy.vx) || 1);
  if (perfect) {
    const perfectBonus = 260 + levelIndex * 35;
    levelPerfectShots += 1;
    runPerfectShots += 1;
    ammo += 1;
    empoweredArrows = Math.min(6, empoweredArrows + 1);
    empoweredArrowTime = Math.max(empoweredArrowTime, 5.5);
    score += perfectBonus;
    addFloater(t('perfectShot', { points: perfectBonus }), arrow.x, arrow.y - 62, '#fff0a2', 29);
    spawnBurst(arrow.x, arrow.y, '#fff0a2', 20);
    synthTone(720, 0.24, 'triangle', 0.08, 1120);
  }
  if (weaknessExposed) {
    if (levels[levelIndex]?.scoutTrial) levelWeaknessHits += 1;
    const weaknessBonus = 150 + levelIndex * 22;
    score += weaknessBonus;
    addFloater(t('armorWeakness', { points: weaknessBonus }), arrow.x, arrow.y - 62, '#f3d47c', 27);
    spawnBurst(arrow.x, arrow.y, '#f3d47c', 16);
    synthTone(560, 0.2, 'triangle', 0.07, 940);
  }
  if (enemy.roar === 'dragon' && !enemy.powerDropGranted && Math.random() < 0.38) {
    enemy.powerDropGranted = true;
    empoweredArrows = 3;
    empoweredArrowTime = 8;
    addFloater(t('powerDrop'), enemy.x, enemy.y - enemy.height / 2 - 25, '#ffca70', 30);
    spawnBurst(enemy.x, enemy.y, '#ffad45', 26);
    synthTone(260, 0.45, 'triangle', 0.08, 780);
  }
  combo += 1;
  bestCombo = Math.max(bestCombo, combo);
  rewardComboMilestone();
  const gained = Math.round(enemy.score * 0.25 * (critical ? 2 : 1) * (1 + Math.min(combo, 8) * 0.08));
  score += gained;
  addFloater(t(critical ? 'critical' : 'points', { points: gained }), arrow.x, arrow.y - 25, critical ? '#ffd36a' : '#e6f0ef', critical ? 36 : 28);
  spawnBurst(arrow.x, arrow.y, critical ? '#ffd36a' : '#cf3f2e', critical ? 24 : 15);
  playClip(hitSound, critical ? 1 : 0.7);
  guideReact(perfect ? 'perfect' : 'hit');
  shake = Math.max(shake, critical ? 10 : 5);
  if (enemy.hp <= 0) {
    enemy.dead = true;
    if (enemy.isBoss && bossQaTrace?.nameKey === enemy.nameKey) {
      bossQaTrace.defeated = true;
      bossQaTrace.defeatPhase = enemy.bossPhase;
      if (BOSS_QA_MODE) console.info('[Boss QA] defeated', bossQaTrace);
    }
    kills += 1;
    const killBonus = enemy.score + combo * 15;
    score += killBonus;
    addFloater(t('defeated', { name: t(enemy.nameKey) }), enemy.x, enemy.y - enemy.height / 2, '#e8bd72', 32);
    spawnBurst(enemy.x, enemy.y, enemy.typeName === 'wraith' ? '#66dacf' : '#f04a2f', 38);
    if (enemy.isShadowAmbush) {
      const shadowBonus = 420 + levelIndex * 55;
      levelShadowAmbushes += 1;
      runShadowAmbushes += 1;
      score += shadowBonus;
      ammo += 3;
      empoweredArrows = Math.min(6, empoweredArrows + 2);
      empoweredArrowTime = Math.max(empoweredArrowTime, 8);
      addFloater(t('shadowDefeated', { points: shadowBonus }), enemy.x, enemy.y - enemy.height / 2 - 48, '#c5a1ff', 29);
      spawnBurst(enemy.x, enemy.y, '#a76cf0', 30);
      synthTone(300, 0.42, 'triangle', 0.09, 980);
    }
    if (kills % 4 === 0) {
      ammo += 2;
      addFloater(t('ammoPlus', { count: 2 }), bow.x + 180, bow.y - 90, '#d9c18f', 26);
    }
    if (enemy.isBoss) startBossVictoryMoment(enemy);
  }
}

function damageHunter(amount = 1, source = 'fire') {
  if (state !== 'playing' || hitInvulnerability > 0) return;
  const damage = Math.max(1, Math.round(amount));
  health = Math.max(0, health - damage);
  levelDamageTaken += damage;
  hitInvulnerability = 0.8;
  combo = 0;
  comboMilestone = 0;
  flash = 0.3;
  shake = 18;
  synthTone(120, 0.45, 'square', 0.09, 45);
  guideReact('danger');
  addFloater(t(source === 'dive' ? 'dragonStrike' : 'caughtInFire'), bow.x, bow.y - 150, '#ff5d48', 34);
  if (health <= 0) endRun('health');
}

function runBossQaAutomation(dt) {
  if (!BOSS_QA_AUTO || state !== 'playing') return;

  // Keep the opt-in harness focused on the ten chapter bosses. The normal hunt
  // still owns every spawn, damage, transition and render path.
  spawnQueue = [];
  shadowAmbushPending = false;
  shadowAmbushDelay = 0;
  enemies = enemies.filter((enemy) => enemy.isBoss && !enemy.dead);
  ammo = Math.max(ammo, 999);
  health = MAX_HEALTH;
  shielding = false;

  const boss = enemies.find((enemy) => enemy.isBoss && !enemy.dead);
  if (!boss) return;

  const trace = bossQaTrace?.nameKey === boss.nameKey ? bossQaTrace : null;
  if (trace && !trace.mouthObserved && boss.x > 120 && boss.x < W - 120) {
    // Force one ordinary attack while the boss is visibly in the arena so the
    // profiled jaw origin is exercised even on a very slow encounter.
    boss.attackTimer = 0;
  }
  if (!trace?.turnObserved) return;

  bossQaAutoClock -= dt;
  if (bossQaAutoClock > 0) return;
  const head = bossHeadPoint(boss);
  mouse = { x: head.x, y: head.y };
  charge = 1;
  shootArrow();
  bossQaAutoClock = 0.16;
}

function update(dt) {
  if (state === 'paused') return;
  if (hitStopTimer > 0) {
    hitStopTimer = Math.max(0, hitStopTimer - dt);
    return;
  }
  updateMusicFade(dt);
  windTime += dt;
  shake = Math.max(0, shake - dt * 35);
  flash = Math.max(0, flash - dt);
  shieldFlash = Math.max(0, shieldFlash - dt);
  hitInvulnerability = Math.max(0, hitInvulnerability - dt);
  markCooldown = Math.max(0, markCooldown - dt);
  empoweredArrowTime = Math.max(0, empoweredArrowTime - dt);
  if (empoweredArrowTime <= 0) empoweredArrows = 0;
  banner = Math.max(0, banner - dt);
  guideReactionCooldown = Math.max(0, guideReactionCooldown - dt);
  if (guideSpeech) {
    guideSpeech.life -= dt;
    if (guideSpeech.life <= 0 && state !== 'briefing') guideSpeech = null;
  }
  if (state === 'briefing') {
    if (BOSS_QA_AUTO) {
      dismissBriefing();
    } else {
      briefingTimer -= dt;
      if (briefingTimer <= 0) dismissBriefing();
      return;
    }
  }
  if (state === 'briefingExit') {
    briefingExitTimer = Math.max(0, briefingExitTimer - dt);
    if (briefingExitTimer <= 0) {
      briefingTimer = 0;
      setGameState('playing');
      banner = 2.8;
    }
    return;
  }
  if (state === 'transition') {
    if (chapterTransition) {
      chapterTransition.life -= BOSS_QA_AUTO ? chapterTransition.life : dt;
      if (chapterTransition.life <= 0) {
        chapterTransition = null;
        beginLevel();
      }
    }
    return;
  }
  if (shielding) {
    shieldEnergy = Math.max(0, shieldEnergy - dt * 30);
    shieldRegenDelay = 1.8;
    if (shieldEnergy <= 0) {
      shielding = false;
      addFloater(t('shieldBroken'), bow.x, bow.y - 170, '#ff916c', 30);
    }
  } else if (shieldRegenDelay > 0) {
    shieldRegenDelay = Math.max(0, shieldRegenDelay - dt);
  } else {
    shieldEnergy = Math.min(SHIELD_MAX, shieldEnergy + dt * 22);
  }
  if (charging) charge = Math.min(1, charge + dt * (0.78 + levelIndex * 0.035));

  particles.forEach((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.985;
    particle.vy += 240 * dt;
  });
  particles = particles.filter((particle) => particle.life > 0);
  floaters.forEach((floater) => { floater.life -= dt; floater.y -= 45 * dt; });
  floaters = floaters.filter((floater) => floater.life > 0);

  if (state === 'bossVictory') {
    updateBossVictoryMoment(dt);
    return;
  }
  if (state !== 'playing') return;

  runBossQaAutomation(dt);

  if (shadowAmbushPending) {
    shadowAmbushDelay -= dt;
    if (shadowAmbushDelay <= 0) {
      shadowAmbushPending = false;
      spawnShadowAmbush();
    }
  }
  spawnQueue.forEach((item) => { item.delay -= dt; });
  while (spawnQueue.length && spawnQueue[0].delay <= 0) {
    const nextSpawn = spawnQueue.shift();
    spawnEnemy(nextSpawn.type, null, nextSpawn.encounterOptions);
  }

  enemies.forEach((enemy) => {
    const previousX = enemy.x;
    const previousY = enemy.y;
    enemy.age += dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.phaseFlash = Math.max(0, (enemy.phaseFlash || 0) - dt);
    enemy.turnFlash = Math.max(0, (enemy.turnFlash || 0) - dt);
    enemy.formationFlash = Math.max(0, (enemy.formationFlash || 0) - dt);
    enemy.markedUntil = Math.max(0, enemy.markedUntil - dt);
    enemy.markPulse = Math.max(0, enemy.markPulse - dt);
    enemy.dodgeTimer = Math.max(0, (enemy.dodgeTimer || 0) - dt);

    const isDiving = enemy.attackState === 'dive';
    if (isDiving) {
      enemy.diveElapsed = Math.min(enemy.diveDuration, enemy.diveElapsed + dt);
      const diveProgress = Math.max(0, Math.min(1, enemy.diveElapsed / Math.max(0.1, enemy.diveDuration)));
      const diveEase = smoothUnit(diveProgress);
      const diveArc = Math.sin(diveProgress * Math.PI) * (enemy.isBoss ? 30 : 20);
      enemy.x = enemy.diveStartX + (enemy.diveTargetX - enemy.diveStartX) * diveEase;
      enemy.y = enemy.diveStartY + (enemy.diveTargetY - enemy.diveStartY) * diveEase - diveArc;
      enemy.diveTimer = Math.max(0, enemy.diveDuration - enemy.diveElapsed);
      if (!enemy.diveHitResolved && segmentCircle(previousX, previousY, enemy.x, enemy.y, bow.x, bow.y, enemy.radius * 0.44 + 72)) {
        enemy.diveHitResolved = true;
        if (shielding && shieldEnergy > 0) {
          shieldEnergy = Math.max(0, shieldEnergy - 34);
          shieldRegenDelay = 1.8;
          shieldFlash = 0.28;
          spawnBurst(bow.x, bow.y - 72, '#9beee7', 18);
          synthTone(480, 0.2, 'triangle', 0.08, 170);
          shake = Math.max(shake, 7);
          if (shieldEnergy <= 0) shielding = false;
        } else {
          damageHunter(1, 'dive');
        }
      }
      if (enemy.diveTimer <= 0) {
        const diveDirection = Math.sign(enemy.diveTargetX - enemy.diveStartX) || Math.sign(enemy.vx) || 1;
        enemy.vx = diveDirection * enemy.speed;
        enemy.attackState = 'recovery';
        enemy.attackRecoveryDuration = enemy.isBoss ? BOSS_DIVE_RECOVERY : ENEMY_DIVE_RECOVERY;
        enemy.attackRecovery = enemy.attackRecoveryDuration;
        enemy.diveRecovery = true;
        enemy.diveRecoveryStartY = enemy.y;
        enemy.attackTimer = enemy.attack * (0.8 + Math.random() * 0.45);
        enemy.dodgeTimer = Math.max(enemy.dodgeTimer, 0.24);
        enemy.dodgeDirection = -diveDirection;
      }
    } else {
      enemy.x += enemy.vx * dt;
      if (enemy.formationId && enemy.turnCount === 0) {
        enemy.routeProgress = Math.min(1, (enemy.routeProgress || 0) + Math.abs(enemy.vx) * dt / (W + enemy.width * 2));
      }
      const routeY = enemy.baseY
        + (enemy.routeDrift || 0) * (enemy.routeProgress || 0)
        // Keep the body buoyant without letting the whole sprite bob enough to
        // compete visually with the wing cycle.
        + Math.sin(enemy.age * enemy.flightRate + enemy.phase) * enemy.bobAmount * 0.38;
      const routeMinY = HUD_FLIGHT_TOP + enemy.height * 0.38;
      const routeMaxY = HUD_FLIGHT_BOTTOM - enemy.height * 0.38;
      const recoveryDuration = Math.max(0.01, enemy.attackRecoveryDuration || ENEMY_DIVE_RECOVERY);
      const recoveryProgress = enemy.diveRecovery && enemy.attackState === 'recovery'
        ? smoothUnit(1 - Math.max(0, enemy.attackRecovery - dt) / recoveryDuration)
        : 1;
      const flightY = enemy.diveRecovery && enemy.attackState === 'recovery'
        ? enemy.diveRecoveryStartY + (routeY - enemy.diveRecoveryStartY) * recoveryProgress
        : routeY;
      enemy.y = Math.max(routeMinY, Math.min(routeMaxY, flightY));
      if (enemy.dodgeTimer > 0) enemy.x += enemy.dodgeDirection * enemy.speed * (enemy.isBoss ? 1.6 : 2.1) * dt;
      const margin = enemy.turnMargin || enemy.width * 0.42;
      const reachedRightTurn = enemy.x > W - margin && enemy.vx > 0;
      const reachedLeftTurn = enemy.x < margin && enemy.vx < 0;
      if (reachedRightTurn || reachedLeftTurn) {
        enemy.vx *= -1;
        enemy.turnCount = (enemy.turnCount || 0) + 1;
        enemy.turnFlash = 0.42;
        if (enemy.isBoss && bossQaTrace?.nameKey === enemy.nameKey) {
          bossQaTrace.turnObserved = true;
          bossQaTrace.turnCount = enemy.turnCount;
          bossQaTrace.turnX = enemy.x;
          if (BOSS_QA_MODE) console.info('[Boss QA] turn observed', bossQaTrace);
        }
      }
    }

    if (enemy.attackState === 'windup') {
      enemy.attackWindup = Math.max(0, enemy.attackWindup - dt);
      if (enemy.attackWindup <= 0) {
        if (enemy.attackKind === 'dive') {
          enemy.attackState = 'dive';
          enemy.diveDuration = enemy.isBoss ? BOSS_DIVE_DURATION : ENEMY_DIVE_DURATION;
          enemy.diveElapsed = 0;
          enemy.diveTimer = enemy.diveDuration;
          enemy.diveStartX = enemy.x;
          enemy.diveStartY = enemy.y;
          enemy.diveVX = (enemy.diveTargetX - enemy.diveStartX) / enemy.diveDuration;
          enemy.diveVY = (enemy.diveTargetY - enemy.diveStartY) / enemy.diveDuration;
          enemy.diveHitResolved = false;
          spawnBurst(enemy.x, enemy.y, enemy.isBoss ? enemy.bossAccent : enemy.shotColor, enemy.isBoss ? 18 : 10);
        } else {
          fireAtHunter(enemy);
          enemy.attackState = 'recovery';
          enemy.attackRecoveryDuration = enemy.isBoss ? BOSS_FIRE_RECOVERY : ENEMY_FIRE_RECOVERY;
          enemy.attackRecovery = enemy.attackRecoveryDuration;
          enemy.attackTimer = enemy.attack * (0.8 + Math.random() * 0.45);
          enemy.dodgeTimer = Math.max(enemy.dodgeTimer, 0.24);
          enemy.dodgeDirection = -Math.sign(enemy.vx || 1);
        }
      }
    } else if (enemy.attackState === 'recovery') {
      enemy.attackRecovery = Math.max(0, enemy.attackRecovery - dt);
      if (enemy.attackRecovery <= 0) {
        enemy.attackState = 'flight';
        enemy.attackKind = null;
        enemy.attackRecoveryDuration = 0;
        enemy.diveRecovery = false;
      }
    } else if (enemy.attackState !== 'dive') {
      enemy.attackTimer -= dt;
      if (enemy.formationId && enemy.attackTimer > 0 && enemy.attackTimer <= 0.92 && enemy.x > 120 && enemy.x < W - 120) {
        triggerFormationTelegraph(enemy);
      }
      if (enemy.attackTimer <= 0 && enemy.x > 120 && enemy.x < W - 120) {
        const diveChance = enemy.typeName === 'wraith' ? 0 : enemy.isBoss ? 0.28 : 0.12;
        enemy.attackKind = Math.random() < diveChance ? 'dive' : 'fire';
        enemy.attackState = 'windup';
        enemy.attackWindupDuration = enemy.isBoss ? BOSS_FIRE_WINDUP : ENEMY_FIRE_WINDUP;
        enemy.attackWindup = enemy.attackWindupDuration;
        enemy.diveTargetX = Math.max(180, Math.min(W - 180, bow.x + (Math.random() - 0.5) * 110));
        enemy.diveTargetY = Math.min(H - 70, bow.y - (enemy.isBoss ? 58 : 44));
        enemy.diveHitResolved = false;
        enemy.diveRecovery = false;
        synthTone(enemy.attackKind === 'dive' ? 125 : 185, 0.24, 'sawtooth', 0.035, enemy.attackKind === 'dive' ? 68 : 110);
      }
    }
  });
  enemies = enemies.filter((enemy) => !enemy.dead);

  if (state === 'playing' && !shadowAmbushPending && !bossSpawned && bossPending && spawnQueue.length === 0 && enemies.length === 0) {
    spawnChapterBoss();
  }

  arrows.forEach((arrow) => {
    arrow.px = arrow.x;
    arrow.py = arrow.y;
    arrow.vy += 145 * dt;
    arrow.x += arrow.vx * dt;
    arrow.y += arrow.vy * dt;
    arrow.angle = Math.atan2(arrow.vy, arrow.vx);
    arrow.life -= dt;

    for (const shot of hostileShots) {
      if (!shot.dead && segmentCircle(arrow.px, arrow.py, arrow.x, arrow.y, shot.x, shot.y, shot.radius + 8)) {
        shot.dead = true;
        arrow.dead = true;
        score += 60;
        combo += 1;
        addFloater(t('airShot', { points: 60 }), shot.x, shot.y, '#91f3e9', 25);
        spawnBurst(shot.x, shot.y, shot.color, 18);
        synthTone(620, 0.16, 'triangle', 0.06, 260);
        break;
      }
    }
    if (arrow.dead) return;
    for (const enemy of enemies) {
      if (segmentCircle(arrow.px, arrow.py, arrow.x, arrow.y, enemy.x, enemy.y, enemy.radius)) {
        hitEnemy(enemy, arrow);
        arrow.dead = true;
        break;
      }
    }
  });
  arrows.forEach((arrow) => {
    if (!arrow.dead && (arrow.life <= 0 || arrow.x < -100 || arrow.x > W + 100 || arrow.y < -120 || arrow.y > H + 100)) {
      arrow.dead = true;
      guideReact('miss');
    }
  });
  arrows = arrows.filter((arrow) => !arrow.dead && arrow.life > 0 && arrow.x > -100 && arrow.x < W + 100 && arrow.y > -120 && arrow.y < H + 100);

  hostileShots.forEach((shot) => {
    shot.px = shot.x;
    shot.py = shot.y;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (!shot.dead && shieldCanBlock(shot)) blockShot(shot);
    if (!shot.dead && segmentCircle(shot.px, shot.py, shot.x, shot.y, bow.x, bow.y, shot.radius + 55)) {
      shot.dead = true;
      damageHunter(shot.damage || 1);
    }
  });
  hostileShots = hostileShots.filter((shot) => !shot.dead && shot.life > 0);

  if (state === 'playing' && ammo <= 0 && arrows.length === 0 && enemies.length > 0) endRun('arrows');

  if (state === 'playing' && !shadowAmbushPending && bossSpawned && spawnQueue.length === 0 && enemies.length === 0) {
    levelCooldown += dt;
    if (levelCooldown > 1.8) {
      levelCooldown = 0;
      awardScoutTrial();
      awardChapterMedals();
      if (levelIndex >= TOTAL_LEVELS - 1) beginLevel();
      else startChapterVictoryTransition();
    }
  }
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawBackdrop() {
  const sceneIndex = Math.max(0, Math.min(TOTAL_LEVELS - 1, levelIndex < 0 ? 0 : levelIndex));
  const scene = state === 'title' ? art.titleBackground : art.backgrounds[sceneIndex];
  if (imageIsDrawable(scene)) ctx.drawImage(scene, 0, 0, W, H);
  else {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, '#182032');
    gradient.addColorStop(1, '#050509');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = 'rgba(2,4,9,0.18)';
  ctx.fillRect(0, 0, W, H);

  const moonGlow = ctx.createRadialGradient(304, 150, 10, 304, 150, 300);
  moonGlow.addColorStop(0, 'rgba(210,224,232,0.20)');
  moonGlow.addColorStop(0.2, 'rgba(151,178,198,0.09)');
  moonGlow.addColorStop(1, 'rgba(100,130,160,0)');
  ctx.fillStyle = moonGlow;
  ctx.fillRect(0, 0, 640, 460);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.09;
  const moonBeam = ctx.createLinearGradient(250, 110, 950, 760);
  moonBeam.addColorStop(0, '#b9c8d7');
  moonBeam.addColorStop(0.42, 'rgba(143,164,184,0.3)');
  moonBeam.addColorStop(1, 'rgba(100,120,145,0)');
  ctx.fillStyle = moonBeam;
  ctx.beginPath();
  ctx.moveTo(210, 85);
  ctx.lineTo(385, 85);
  ctx.lineTo(1040, 790);
  ctx.lineTo(740, 790);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < 7; i += 1) {
    const x = ((i * 340 + windTime * (18 + i * 2)) % (W + 500)) - 250;
    const y = 650 + i * 46 + Math.sin(windTime + i) * 20;
    const fog = ctx.createRadialGradient(x, y, 0, x, y, 260);
    fog.addColorStop(0, 'rgba(145,160,175,0.10)');
    fog.addColorStop(1, 'rgba(100,115,130,0)');
    ctx.fillStyle = fog;
    ctx.fillRect(x - 280, y - 150, 560, 300);
  }

  // Slow distant motes and faster foreground ash imply separate parallax depths
  // while the painted realm remains a single lightweight background image.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let index = 0; index < 22; index += 1) {
    const speed = 7 + (index % 5) * 3;
    const span = W + 100;
    const x = ((index * 293 - windTime * speed) % span + span) % span - 50;
    const y = 120 + (index * 137) % 535 + Math.sin(windTime * 0.35 + index) * 8;
    ctx.globalAlpha = 0.12 + (index % 3) * 0.035;
    ctx.fillStyle = index % 4 === 0 ? '#f0c77c' : '#b8d1dc';
    ctx.beginPath();
    ctx.arc(x, y, 1.4 + (index % 3) * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#d7a56c';
  ctx.lineWidth = 2;
  for (let index = 0; index < 9; index += 1) {
    const speed = 52 + (index % 4) * 17;
    const span = W + 120;
    const x = ((index * 347 - windTime * speed) % span + span) % span - 60;
    const y = 590 + (index * 71) % 260 + Math.sin(windTime * 1.3 + index) * 12;
    ctx.globalAlpha = 0.1 + (index % 3) * 0.035;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 18 - (index % 4) * 4, y - 5);
    ctx.stroke();
  }
  ctx.restore();

  const vignette = ctx.createRadialGradient(W / 2, H / 2, 280, W / 2, H / 2, 1050);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function drawBossArenaEffect() {
  const isVictoryMoment = state === 'bossVictory';
  if (state !== 'playing' && state !== 'paused' && !isVictoryMoment) return;
  const boss = enemies.find((enemy) => enemy.isBoss && !enemy.dead);
  if (!boss && !bossVictoryMoment) return;

  const theme = isVictoryMoment ? BOSS_ARENA_THEMES[bossVictoryMoment.arenaTheme] || BOSS_ARENA_THEMES.storm : bossArenaTheme(boss);
  const phase = isVictoryMoment ? 3 : boss.bossPhase || 1;
  const phaseFlash = isVictoryMoment ? Math.max(0, bossVictoryMoment.life / bossVictoryMoment.maxLife) : boss.phaseFlash || 0;
  const pulse = 0.5 + Math.sin(windTime * (2.4 + phase * 0.35)) * 0.5;
  const victoryFade = isVictoryMoment ? Math.max(0, bossVictoryMoment.life / bossVictoryMoment.maxLife) : 1;
  const strength = Math.min(0.58, 0.12 + phase * 0.045 + phaseFlash * 0.24) * (isVictoryMoment ? 0.28 + victoryFade * 0.72 : 1);
  const tremor = phaseFlash * (1.8 + phase * 0.35);
  const arenaTheme = isVictoryMoment ? bossVictoryMoment.arenaTheme : boss.arenaTheme;

  ctx.save();
  ctx.translate(Math.sin(windTime * 36) * tremor, Math.cos(windTime * 31) * tremor * 0.55);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = strength;

  const topBand = ctx.createLinearGradient(0, 0, 0, 210);
  topBand.addColorStop(0, `${theme.edge}${Math.round((0.54 + pulse * 0.16) * 255).toString(16).padStart(2, '0')}`);
  topBand.addColorStop(1, `${theme.edge}00`);
  ctx.fillStyle = topBand;
  ctx.fillRect(0, 0, W, 210);

  const bottomBand = ctx.createLinearGradient(0, H, 0, H - 185);
  bottomBand.addColorStop(0, `${theme.deep}${Math.round((0.36 + phase * 0.05) * 255).toString(16).padStart(2, '0')}`);
  bottomBand.addColorStop(1, `${theme.deep}00`);
  ctx.fillStyle = bottomBand;
  ctx.fillRect(0, H - 185, W, 185);

  if (arenaTheme === 'storm') {
    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 3 + phase;
    ctx.globalAlpha = strength * (0.62 + pulse * 0.25);
    for (let index = 0; index < 10; index += 1) {
      const x = ((index * 214 + windTime * (110 + phase * 18)) % (W + 220)) - 110;
      const y = 72 + (index % 4) * 42 + Math.sin(windTime * 2.2 + index) * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 78, y - 28);
      ctx.lineTo(x + 122, y - 18);
      ctx.stroke();
    }
    if (phaseFlash > 0) {
      ctx.globalAlpha = phaseFlash * 0.58;
      ctx.strokeStyle = theme.core;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(W - 280, 80);
      ctx.lineTo(W - 325, 172);
      ctx.lineTo(W - 265, 154);
      ctx.lineTo(W - 300, 250);
      ctx.stroke();
    }
  } else if (arenaTheme === 'lava' || arenaTheme === 'ember') {
    ctx.globalAlpha = strength * (0.62 + pulse * 0.28);
    ctx.fillStyle = theme.core;
    for (let index = 0; index < 15; index += 1) {
      const x = (index * 149 + Math.sin(windTime * 1.5 + index) * 38) % W;
      const y = H - 34 - ((windTime * (44 + index * 3) + index * 71) % 155);
      const size = 2 + (index % 3) * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size * (0.7 + pulse * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 4 + phase;
    ctx.globalAlpha = strength * 0.62;
    ctx.beginPath();
    ctx.moveTo(0, H - 92);
    ctx.quadraticCurveTo(W * 0.22, H - 126 - pulse * 28, W * 0.48, H - 82);
    ctx.quadraticCurveTo(W * 0.75, H - 42 + pulse * 22, W, H - 105);
    ctx.stroke();
  } else if (arenaTheme === 'ice') {
    ctx.strokeStyle = theme.core;
    ctx.lineWidth = 3;
    ctx.globalAlpha = strength * 0.82;
    for (let index = 0; index < 9; index += 1) {
      const x = 70 + index * 226;
      const y = 34 + (index % 3) * 30;
      const size = 28 + (index % 3) * 12 + phase * 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + size * 0.34, y + size);
      ctx.lineTo(x - size * 0.12, y + size * 0.7);
      ctx.lineTo(x - size * 0.42, y + size * 1.25);
      ctx.stroke();
    }
    ctx.fillStyle = theme.edge;
    ctx.globalAlpha = strength * 0.18;
    ctx.fillRect(0, 0, 90, H);
    ctx.fillRect(W - 90, 0, 90, H);
  } else {
    const cornerRadius = 260 + phase * 32;
    for (const corner of [[0, 0], [W, 0], [0, H], [W, H]]) {
      const cornerGlow = ctx.createRadialGradient(corner[0], corner[1], 12, corner[0], corner[1], cornerRadius);
      cornerGlow.addColorStop(0, `${theme.edge}42`);
      cornerGlow.addColorStop(0.5, `${theme.deep}1c`);
      cornerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cornerGlow;
      ctx.fillRect(corner[0] ? W - cornerRadius : 0, corner[1] ? H - cornerRadius : 0, cornerRadius, cornerRadius);
    }
    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 2 + phase;
    ctx.globalAlpha = strength * (0.56 + pulse * 0.2);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 310 + Math.sin(windTime * 1.7) * 22, windTime * 0.24, windTime * 0.24 + Math.PI * 1.28);
    ctx.arc(W / 2, H / 2, 420 + Math.sin(windTime * 1.3) * 28, -windTime * 0.18, -windTime * 0.18 + Math.PI * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBossQaOverlay(enemy) {
  if (!BOSS_QA_MODE || !enemy.isBoss) return;
  const head = bossHeadPoint(enemy);
  const mouth = bossMouthPoint(enemy);
  const trace = bossQaTrace?.nameKey === enemy.nameKey ? bossQaTrace : null;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.92;
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = '#fff0a2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(enemy.x, enemy.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = '#ff9a62';
  ctx.beginPath();
  ctx.moveTo(enemy.x, enemy.y);
  ctx.lineTo(mouth.x, mouth.y);
  ctx.stroke();
  ctx.fillStyle = '#fff0a2';
  ctx.beginPath();
  ctx.arc(head.x, head.y, Math.max(12, head.radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9a62';
  ctx.beginPath();
  ctx.arc(mouth.x, mouth.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.font = '800 16px Inter, sans-serif';
  ctx.fillStyle = '#fff0a2';
  ctx.fillText(`QA ${t(enemy.nameKey)}  •  giriş: ${enemy.entrySide}  •  dönüş: ${trace?.turnObserved ? 'OK' : 'bekleniyor'}`, 34, 224);
  ctx.fillStyle = '#ffbf8b';
  ctx.fillText(`kafa ${trace?.headObserved ? 'OK' : 'izleniyor'}  •  ağız ${trace?.mouthObserved ? 'OK' : 'izleniyor'}  •  yön: ${bossMovementFacing(enemy) > 0 ? '→' : '←'}`, 34, 248);
  ctx.restore();
}

function drawFormationFeedback() {
  const formationGroups = new Map();
  enemies.forEach((enemy) => {
    if (!enemy.formationId || enemy.dead) return;
    if (!formationGroups.has(enemy.formationId)) formationGroups.set(enemy.formationId, []);
    formationGroups.get(enemy.formationId).push(enemy);
  });

  // Formation members are intentionally marked independently. Never draw a
  // path between them: even dashed paths can become thread-like artifacts when
  // two flyers cross or sit close together in chapters 2 and 8.
  formationGroups.forEach((members) => {
    if (members.length < 2) return;
    const color = members[0].formationColor || '#9beee7';
    const pulse = 0.5 + Math.sin(windTime * 7.5) * 0.5;
    members.forEach((member) => {
      const isTelegraphing = member.formationFlash > 0
        || (member.attackTimer > 0 && member.attackTimer <= 1.05);
      const origin = enemyFireOrigin(member);
      const markerY = member.y - member.height / 2 - 38;

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = isTelegraphing ? 0.18 + pulse * 0.1 : 0.08 + pulse * 0.04;
      ctx.fillStyle = isTelegraphing ? '#ffb36b' : color;
      ctx.beginPath();
      ctx.arc(member.x, member.y, member.radius * (1.12 + pulse * 0.06), 0, Math.PI * 2);
      ctx.fill();

      if (isTelegraphing) {
        ctx.globalAlpha = 0.34 + pulse * 0.18;
        ctx.strokeStyle = '#ffb36b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 8 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = isTelegraphing ? 0.95 : 0.76;
      ctx.fillStyle = '#080b12e8';
      ctx.beginPath();
      ctx.arc(member.x, markerY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isTelegraphing ? '#ffb36b' : color;
      ctx.lineWidth = isTelegraphing ? 3 : 2;
      ctx.stroke();
      ctx.fillStyle = isTelegraphing ? '#fff0b0' : '#e8f3ed';
      ctx.textAlign = 'center';
      ctx.font = '900 15px Inter, sans-serif';
      ctx.fillText(String(member.formationIndex + 1), member.x, markerY + 5);
      ctx.restore();
    });
  });
}

function drawEnemySpriteFrame(enemy, frameIndex) {
  const sheet = art.animationSheets?.[enemy.animationSheet];
  if (!imageIsDrawable(sheet)) {
    const fallback = art[enemy.image];
    if (!imageIsDrawable(fallback)) return false;
    ctx.drawImage(fallback, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
    return true;
  }

  const columns = sheet.columns || 3;
  const rows = sheet.rows || 2;
  const frameCount = sheet.frameCount || columns * rows;
  const logicalFrame = Math.max(0, Math.min(frameCount - 1, Math.floor(frameIndex)));
  const mappedFrame = Math.max(0, Math.min(frameCount - 1, enemy.animationFrameMap?.[logicalFrame] ?? logicalFrame));
  const frameWidth = sheet.frameWidth || sheet.width / columns;
  const frameHeight = sheet.frameHeight || sheet.height / rows;
  const sourceX = (mappedFrame % columns) * frameWidth;
  const sourceY = Math.floor(mappedFrame / columns) * frameHeight;
  ctx.drawImage(sheet, sourceX, sourceY, frameWidth, frameHeight, -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
  return true;
}

function enemyAnimationPose(enemy) {
  const isWraith = enemy.typeName === 'wraith';
  const flightFrameCount = isWraith ? 2 : 4;
  // Atlas poses are discrete drawings, not blendable animation layers. Advance
  // through the four wing poses at a steady, readable flap cadence and give
  // each creature a stable phase offset.
  const wingCyclesPerSecond = isWraith ? 1.9 : enemy.isBoss ? 1.18 : enemy.typeName === 'void' ? 1.08 : 1.38;
  const phaseOffset = (enemy.phase || 0) / (Math.PI * 2);
  const wingCycle = ((enemy.age * wingCyclesPerSecond + phaseOffset) % 1 + 1) % 1;
  const flightFrame = Math.min(flightFrameCount - 1, Math.floor(wingCycle * flightFrameCount));
  const wingBeat = Math.sin(wingCycle * Math.PI * 2);
  const fireFrame = isWraith ? 3 : 4;
  const diveFrame = isWraith ? 2 : 5;
  let attackFrame = null;
  let attackWeight = 0;

  if (enemy.attackState === 'windup' && enemy.attackKind) {
    const duration = Math.max(0.01, enemy.attackWindupDuration || (enemy.isBoss ? BOSS_FIRE_WINDUP : ENEMY_FIRE_WINDUP));
    const progress = smoothUnit(1 - enemy.attackWindup / duration);
    attackFrame = enemy.attackKind === 'dive' ? diveFrame : fireFrame;
    attackWeight = enemy.attackKind === 'dive' ? 0.12 + progress * 0.88 : progress;
  } else if (enemy.attackState === 'dive') {
    attackFrame = diveFrame;
    attackWeight = 1;
  } else if (enemy.attackState === 'recovery' && enemy.attackKind) {
    const duration = Math.max(0.01, enemy.attackRecoveryDuration || ENEMY_FIRE_RECOVERY);
    const recoveryProgress = 1 - Math.max(0, Math.min(1, enemy.attackRecovery / duration));
    attackFrame = enemy.attackKind === 'dive' ? diveFrame : fireFrame;
    attackWeight = 1 - smoothUnit(recoveryProgress);
  }

  return { flightFrame, flightFrameCount, attackFrame, attackWeight, wingBeat };
}

function drawEnemyAnimationPose(enemy, pose) {
  // Never crossfade two separately framed silhouettes: their slight atlas
  // alignment differences read as a trembling dragon. A clean pose switch
  // keeps attacks sharp while the flight cycle itself continues between them.
  const useAttackPose = pose.attackFrame !== null && pose.attackWeight >= 0.5;
  return drawEnemySpriteFrame(enemy, useAttackPose ? pose.attackFrame : pose.flightFrame);
}

function drawEnemyAttackTelegraph(enemy) {
  if (enemy.attackState !== 'windup' && enemy.attackState !== 'dive') return;
  const isDive = enemy.attackKind === 'dive';
  const warningColor = enemy.isBoss ? enemy.bossAccent : enemy.shotColor;
  const pulse = 0.5 + Math.sin(windTime * 15 + enemy.phase) * 0.5;
  const windupDuration = enemy.attackWindupDuration || (enemy.isBoss ? BOSS_FIRE_WINDUP : ENEMY_FIRE_WINDUP);
  const urgency = enemy.attackState === 'dive' ? 1 : 1 - Math.max(0, enemy.attackWindup) / windupDuration;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.42 + urgency * 0.34 + pulse * 0.12;
  ctx.strokeStyle = warningColor;
  ctx.fillStyle = warningColor;
  ctx.lineWidth = enemy.isBoss ? 5 : 3;
  if (isDive) {
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.lineTo(enemy.diveTargetX, enemy.diveTargetY);
    ctx.stroke();
    const markerRadius = 44 + pulse * 15 + urgency * 12;
    ctx.beginPath();
    ctx.arc(enemy.diveTargetX, enemy.diveTargetY, markerRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(enemy.diveTargetX, enemy.diveTargetY, markerRadius * 0.52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha *= 0.72;
    ctx.beginPath();
    ctx.moveTo(enemy.diveTargetX - markerRadius - 18, enemy.diveTargetY);
    ctx.lineTo(enemy.diveTargetX + markerRadius + 18, enemy.diveTargetY);
    ctx.moveTo(enemy.diveTargetX, enemy.diveTargetY - markerRadius - 18);
    ctx.lineTo(enemy.diveTargetX, enemy.diveTargetY + markerRadius + 18);
    ctx.stroke();
  } else {
    const mouth = enemyFireOrigin(enemy);
    const warningBeam = ctx.createLinearGradient(mouth.x, mouth.y, bow.x, bow.y);
    warningBeam.addColorStop(0, `${warningColor}b0`);
    warningBeam.addColorStop(1, `${warningColor}12`);
    ctx.strokeStyle = warningBeam;
    ctx.lineWidth = (enemy.isBoss ? 8 : 5) + pulse * 3;
    ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = -windTime * 48;
    ctx.beginPath();
    ctx.moveTo(mouth.x, mouth.y);
    ctx.lineTo(bow.x, bow.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.55 + pulse * 0.25;
    ctx.beginPath();
    ctx.arc(bow.x, bow.y, 46 + pulse * 12, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemy(enemy) {
  if (enemy.dead) return;
  const image = art[enemy.image];
  const altitude = Math.max(0, Math.min(1, (enemy.y - 170) / 450));
  const shadowY = 785 + altitude * 68;
  const shadowWidth = enemy.width * (0.42 - altitude * 0.08);
  ctx.save();
  ctx.translate(enemy.x - enemy.vx * 0.08, shadowY);
  ctx.scale(1, 0.22);
  const castShadow = ctx.createRadialGradient(0, 0, 8, 0, 0, shadowWidth);
  castShadow.addColorStop(0, `rgba(0,0,0,${0.22 - altitude * 0.07})`);
  castShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = castShadow;
  ctx.beginPath();
  ctx.ellipse(0, 0, shadowWidth, shadowWidth * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (enemy.isBoss) {
    const bossPulse = 0.5 + Math.sin(enemy.age * 4.2) * 0.5;
    const phase = enemy.bossPhase || 1;
    const phaseFlash = enemy.phaseFlash || 0;
    const theme = bossArenaTheme(enemy);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.16 + bossPulse * 0.1 + phase * 0.025 + phaseFlash * 0.12;
    const bossAura = ctx.createRadialGradient(enemy.x, enemy.y, enemy.radius * 0.25, enemy.x, enemy.y, enemy.radius * (2.1 + phase * 0.12));
    bossAura.addColorStop(0, enemy.bossAccent);
    bossAura.addColorStop(0.46, `${theme.edge}35`);
    bossAura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bossAura;
    ctx.fillRect(enemy.x - enemy.radius * 2.2, enemy.y - enemy.radius * 2.2, enemy.radius * 4.4, enemy.radius * 4.4);
    ctx.globalAlpha = 0.5 + bossPulse * 0.22 + phaseFlash * 0.18;
    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 5 + phase;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius * (1.28 + bossPulse * 0.07 + phase * 0.025), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  const motionScale = enemy.motionScale || 1;
  const movementFacing = bossMovementFacing(enemy);
  const spriteFacing = enemy.spriteFacing || 1;
  const animationPose = enemyAnimationPose(enemy);
  const animationSheet = art.animationSheets?.[enemy.animationSheet];
  const hasSprite = imageIsDrawable(animationSheet) || imageIsDrawable(image);
  // A tiny lift supports the downstroke, but the body remains stable so the
  // wing poses—not whole-sprite warping or duplicate trails—sell the flight.
  const bodyLift = Math.min(5, enemy.height * 0.012) * animationPose.wingBeat;
  ctx.translate(enemy.x, enemy.y - bodyLift);
  if (movementFacing !== spriteFacing) ctx.scale(-1, 1);

  if (hasSprite) {
    ctx.globalAlpha = 1;
    drawEnemyAnimationPose(enemy, animationPose);
    // Lift the painted midtones with a restrained screen pass so silhouettes
    // remain legible against the night; skeletal bone dragons get extra rim-like light.
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = enemy.typeName === 'bone' ? 0.3 : enemy.isBoss ? 0.16 : 0.1;
    drawEnemyAnimationPose(enemy, animationPose);
    ctx.restore();
    if (enemy.hitFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = Math.min(0.66, enemy.hitFlash / 0.18 * 0.52);
      drawEnemyAnimationPose(enemy, animationPose);
      ctx.restore();
    }
  }

  if (enemy.isBoss && enemy.turnFlash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(0.72, enemy.turnFlash / 0.42 * 0.72);
    ctx.strokeStyle = enemy.bossAccent;
    ctx.lineWidth = 5 + enemy.turnFlash * 4;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1.34 + enemy.turnFlash * 0.18), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  const wakePulse = 0.5 + animationPose.wingBeat * 0.5;
  const trailDirection = -(enemy.spriteFacing || 1);
  // Keep the motion cue as separate glints. Connected wake curves can read as
  // thin threads between nearby dragons, especially in formation waves.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = (0.04 + Math.max(0, wakePulse) * 0.08)
    * (enemy.isBoss ? 1.35 : enemy.formationId ? 1.2 : 1);
  ctx.fillStyle = enemy.isBoss ? enemy.bossAccent : enemy.formationId ? enemy.formationColor : enemy.shotColor;
  for (let wakeIndex = 0; wakeIndex < 3; wakeIndex += 1) {
    const wakeProgress = 0.38 + wakeIndex * 0.11;
    const wakeY = (wakeIndex - 1) * enemy.height * 0.13 + Math.sin(enemy.age * 3.4 + wakeIndex) * 3;
    const wakeRadius = (enemy.isBoss ? 5 : 3.5) * (0.72 + wakePulse * 0.28);
    ctx.beginPath();
    ctx.arc(trailDirection * enemy.width * wakeProgress, wakeY, wakeRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const breathPulse = 0.5 + Math.sin(enemy.age * (2.2 + motionScale * 0.35) + enemy.phase) * 0.5;
  const localMouth = bossLocalMouthPoint(enemy);
  const breathX = localMouth.x;
  const breathY = localMouth.y;
  const bossCore = enemy.isBoss ? enemy.bossCoreColor : enemy.shotColor;
  const bossPhase = enemy.bossPhase || 1;
  const breathRadius = enemy.radius * (0.1 + breathPulse * 0.07) * (enemy.isBoss ? 1.5 + bossPhase * 0.08 : 1);
  const breathGlow = ctx.createRadialGradient(breathX, breathY, 0, breathX, breathY, breathRadius * 3.8);
  breathGlow.addColorStop(0, bossCore);
  breathGlow.addColorStop(0.32, `${bossCore}99`);
  breathGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.16 + breathPulse * (enemy.isBoss ? 0.22 + bossPhase * 0.025 : 0.1);
  ctx.fillStyle = breathGlow;
  ctx.beginPath();
  ctx.arc(breathX, breathY, breathRadius * 3.8, 0, Math.PI * 2);
  ctx.fill();
  if (enemy.isBoss) {
    ctx.globalAlpha = 0.7 + breathPulse * 0.22;
    ctx.strokeStyle = bossCore;
    ctx.lineWidth = 3 + bossPhase;
    ctx.beginPath();
    ctx.arc(breathX, breathY, breathRadius * (1.25 + breathPulse * 0.28), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#fffbe1';
    ctx.beginPath();
    ctx.arc(breathX, breathY, breathRadius * (0.28 + breathPulse * 0.18), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  if (enemy.isShadowAmbush) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.28 + Math.sin(enemy.age * 9) * 0.08;
    ctx.strokeStyle = '#b988ff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius * (1.22 + Math.sin(enemy.age * 5) * 0.08), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.48;
    ctx.strokeStyle = '#6d3cb7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-enemy.radius * 0.75, 0);
    ctx.lineTo(enemy.radius * 0.75, 0);
    ctx.moveTo(0, -enemy.radius * 0.75);
    ctx.lineTo(0, enemy.radius * 0.75);
    ctx.stroke();
  }
  ctx.restore();
  drawEnemyAttackTelegraph(enemy);

  if (enemy.markedUntil > 0) {
    const pulse = 0.5 + Math.sin(windTime * 8 + enemy.phase) * 0.5;
    const ringRadius = enemy.radius * (1.18 + pulse * 0.1);
    const head = bossHeadPoint(enemy);
    const headX = head.x;
    const headY = head.y;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.64 + pulse * 0.24;
    ctx.strokeStyle = '#f3d47c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI / 2 + windTime * 0.35;
      const inner = ringRadius + 8;
      const outer = ringRadius + 22;
      ctx.beginPath();
      ctx.moveTo(enemy.x + Math.cos(angle) * inner, enemy.y + Math.sin(angle) * inner);
      ctx.lineTo(enemy.x + Math.cos(angle) * outer, enemy.y + Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.96;
    ctx.fillStyle = '#fff0a2';
    ctx.beginPath();
    ctx.moveTo(headX, headY - 13);
    ctx.lineTo(headX + 13, headY);
    ctx.lineTo(headX, headY + 13);
    ctx.lineTo(headX - 13, headY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (enemy.maxHp > 1 && enemy.hp < enemy.maxHp) {
    const width = 120;
    ctx.fillStyle = '#100d10cc';
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.height / 2 - 25, width, 9);
    ctx.fillStyle = enemy.typeName === 'dragon' ? '#da4b2d' : '#61b8cf';
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.height / 2 - 25, width * enemy.hp / enemy.maxHp, 9);
  }
  if (enemy.isBoss) {
    const width = 390;
    const barY = enemy.y - enemy.height / 2 - 58;
    const panelX = Math.max(18, Math.min(W - width - 18, enemy.x - width / 2));
    const panelCenter = panelX + width / 2;
    const phase = enemy.bossPhase || 1;
    const phaseFlash = enemy.phaseFlash || 0;
    const theme = bossArenaTheme(enemy);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#080b12e8';
    roundedRect(panelX, barY - 38, width, 78, 14);
    ctx.fill();
    ctx.strokeStyle = `${theme.edge}cc`;
    ctx.lineWidth = 3 + phaseFlash * 2;
    ctx.stroke();
    ctx.fillStyle = '#f4e4bb';
    let bossNameSize = 20;
    const bossName = t(enemy.nameKey);
    while (bossNameSize > 12) {
      ctx.font = `900 ${bossNameSize}px Cinzel, serif`;
      if (ctx.measureText(bossName).width <= width - 118) break;
      bossNameSize -= 1;
    }
    ctx.fillText(bossName, panelCenter - 32, barY - 9);

    ctx.textAlign = 'right';
    ctx.fillStyle = theme.core;
    ctx.font = '800 12px Inter, sans-serif';
    for (let index = 0; index < 3; index += 1) {
      const segmentX = panelX + width - 72 + index * 18;
      ctx.fillStyle = index < phase ? theme.core : '#3a3039';
      roundedRect(segmentX, barY - 14, 12, 5, 2);
      ctx.fill();
    }

    ctx.fillStyle = '#20161a';
    ctx.fillRect(panelX + 18, barY + 10, width - 36, 11);
    ctx.fillStyle = enemy.bossAccent;
    ctx.fillRect(panelX + 18, barY + 10, (width - 36) * Math.max(0, enemy.hp / enemy.maxHp), 11);
    ctx.globalAlpha = 0.58 + phaseFlash * 0.35;
    ctx.strokeStyle = theme.core;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX + 18, barY + 10, width - 36, 11);
    ctx.restore();
  }
  drawBossQaOverlay(enemy);
}

function drawArrow(arrow) {
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle);
  if (arrow.empowered) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffd06a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-55, 0);
    ctx.lineTo(28, 0);
    ctx.stroke();
  }
  ctx.strokeStyle = arrow.empowered ? '#fff0a2' : '#e7d2a2';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-38, 0);
  ctx.lineTo(20, 0);
  ctx.stroke();
  ctx.fillStyle = '#d9e1e6';
  ctx.beginPath();
  ctx.moveTo(28, 0);
  ctx.lineTo(14, -7);
  ctx.lineTo(14, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8b3428';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(-46, -8);
  ctx.moveTo(-34, 0);
  ctx.lineTo(-46, 8);
  ctx.stroke();
  ctx.restore();
}

function drawHostileShot(shot) {
  const angle = Math.atan2(shot.vy, shot.vx);
  const glow = ctx.createRadialGradient(shot.x, shot.y, 2, shot.x, shot.y, shot.radius * 2.6);
  glow.addColorStop(0, '#ffffff');
  glow.addColorStop(0.25, shot.color);
  glow.addColorStop(1, 'rgba(255,60,20,0)');

  if (shot.isDragonFire) {
    const fireScale = shot.isBossFire ? 1.14 : 1;
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, shot.radius * 2.6 * fireScale, 0, Math.PI * 2);
    ctx.fill();

    const trail = ctx.createLinearGradient(-shot.radius * 4.6 * fireScale, 0, shot.radius * 0.7, 0);
    trail.addColorStop(0, 'rgba(255,70,24,0)');
    trail.addColorStop(0.55, shot.color);
    trail.addColorStop(1, '#fff7c2');
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-shot.radius * 4.8 * fireScale, 0);
    ctx.quadraticCurveTo(-shot.radius * 2.2 * fireScale, -shot.radius * 0.85 * fireScale, shot.radius * 0.45, -shot.radius * 0.52);
    ctx.quadraticCurveTo(shot.radius * 0.9, 0, shot.radius * 0.45, shot.radius * 0.52);
    ctx.quadraticCurveTo(-shot.radius * 2.2 * fireScale, shot.radius * 0.85 * fireScale, -shot.radius * 4.8 * fireScale, 0);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath();
    ctx.arc(0, 0, shot.radius * (shot.isBossFire ? 0.82 : 0.72), 0, Math.PI * 2);
    ctx.fill();
    if (shot.isBossFire) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = shot.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, shot.radius * 1.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(shot.x, shot.y, shot.radius * 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shot.color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(shot.x, shot.y);
  ctx.lineTo(shot.x - shot.vx * 0.16, shot.y - shot.vy * 0.16);
  ctx.stroke();
}

function drawShield() {
  if (!shielding && shieldFlash <= 0) return;
  const { x: shieldX, y: shieldY } = shieldPlacement();
  const active = shielding && shieldEnergy > 0;
  const visual = rankVisuals[Math.max(0, Math.min(rankVisuals.length - 1, levelIndex))];
  const pulse = 0.5 + Math.sin(windTime * (3.2 + Math.max(0, levelIndex) * 0.16)) * 0.5;
  const levelPower = 0.72 + Math.max(0, levelIndex) * 0.045;
  const imageAlpha = active ? 0.98 : Math.max(0, shieldFlash / 0.28) * 0.9;
  const shieldSize = 178;

  ctx.save();
  // The face is presented outward toward the threat. The placement follows the
  // muzzle line, while the round shield itself remains front-facing and cannot
  // accidentally appear upside down or turned toward the hunter.
  ctx.translate(shieldX, shieldY);

  if (active) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const auraRadius = 94 + pulse * (6 + levelIndex * 1.2);
    const aura = ctx.createRadialGradient(0, 0, 18, 0, 0, auraRadius);
    aura.addColorStop(0, `${visual.glow}${Math.round((0.18 + pulse * 0.08) * 255).toString(16).padStart(2, '0')}`);
    aura.addColorStop(0.48, `${visual.accent}${Math.round((0.06 + levelPower * 0.035) * 255).toString(16).padStart(2, '0')}`);
    aura.addColorStop(1, `${visual.glow}00`);
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (imageIsDrawable(art.shield)) {
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = imageAlpha;
    ctx.drawImage(art.shield, -shieldSize / 2, -shieldSize / 2, shieldSize, shieldSize);
    ctx.restore();
  }

  if (active) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.5 + pulse * 0.18 + levelIndex * 0.012;
    ctx.fillStyle = visual.accent;
    ctx.beginPath();
    ctx.arc(0, 0, 7 + pulse * (2 + levelIndex * 0.35), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.max(0, shieldFlash / 0.28) * 0.55;
    ctx.fillStyle = '#ff9c6b';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawBow() {
  const angle = bowAimAngle();
  const draw = charging ? charge : 0;
  const rankVisual = rankVisuals[Math.max(0, Math.min(rankVisuals.length - 1, levelIndex))];
  ctx.save();
  ctx.translate(bow.x, bow.y);
  ctx.rotate(angle);
  ctx.shadowColor = rankVisual.glow;
  ctx.shadowBlur = 14 + levelIndex * 1.5 + draw * 12;
  if (imageIsDrawable(art.crossbow)) {
    ctx.drawImage(art.crossbow, -112, -92, 224, 185);

    // The painted crossbow keeps its original detail; rank identity is added
    // with a colored edge aura, metal rune, and muzzle core.
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.18 + levelIndex * 0.012;
    ctx.strokeStyle = rankVisual.trim;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-30, 3);
    ctx.lineTo(72, 3);
    ctx.stroke();
    ctx.globalAlpha = 0.62;
    ctx.strokeStyle = rankVisual.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(BOW_MUZZLE_LOCAL.x - 8, BOW_MUZZLE_LOCAL.y, 12 + draw * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    if (charging) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.2 + draw * 0.38;
      ctx.fillStyle = rankVisual.glow;
      ctx.beginPath();
      ctx.arc(BOW_MUZZLE_LOCAL.x - 8, BOW_MUZZLE_LOCAL.y, 32 + draw * 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.rotate(Math.PI / 2);
    ctx.strokeStyle = rankVisual.trim;
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.arc(0, 0, 110, -1.15, 1.15);
    ctx.stroke();
    ctx.strokeStyle = rankVisual.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-101, -45);
    ctx.lineTo(0, 15 + draw * 58);
    ctx.lineTo(101, -45);
    ctx.stroke();
    if (charging) {
      ctx.strokeStyle = rankVisual.glow;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 25 + draw * 58);
      ctx.lineTo(0, -115);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawRankKnight(rankIndex, x, y, height, showBadge = true, opacity = 1) {
  const visual = rankVisuals[Math.max(0, Math.min(rankVisuals.length - 1, rankIndex))];
  const image = art.knight;
  const imageReady = imageIsDrawable(image);
  if (!imageReady) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.9 * opacity;
    ctx.fillStyle = `${visual.glow}44`;
    ctx.beginPath();
    ctx.arc(0, -height * 0.37, height * 0.085, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `${visual.trim}cc`;
    ctx.beginPath();
    ctx.moveTo(-height * 0.16, height * 0.28);
    ctx.lineTo(-height * 0.1, -height * 0.2);
    ctx.lineTo(0, -height * 0.28);
    ctx.lineTo(height * 0.1, -height * 0.2);
    ctx.lineTo(height * 0.16, height * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }
  const width = height * image.width / image.height;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.18 * opacity;
  const aura = ctx.createRadialGradient(0, -height * 0.12, 10, 0, -height * 0.12, height * 0.72);
  aura.addColorStop(0, visual.glow);
  aura.addColorStop(0.42, `${visual.glow}66`);
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, -height * 0.12, height * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = opacity;
  ctx.shadowColor = visual.glow;
  ctx.shadowBlur = 24 * opacity;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  // Keep the painted armor clean: a rectangular source-atop tint made the
  // transparent sprite artifacts read as a hard light beam.
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = opacity;
  ctx.shadowBlur = 0;
  // Interstitial guides can visually dominate the frame at narrow scales. Keep
  // the hunter's face anchored with a restrained head halo so the rank figure
  // remains readable beside every scout and guide portrait.
  const headY = -height * 0.39;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = (showBadge ? 0.14 : 0.22) * opacity;
  ctx.strokeStyle = visual.accent;
  ctx.lineWidth = Math.max(2, height * 0.006);
  ctx.beginPath();
  ctx.arc(0, headY, height * 0.085, Math.PI * 0.08, Math.PI * 0.92);
  ctx.stroke();
  ctx.restore();
  if (showBadge) {
    const badgeY = -height * 0.29;
    const badgeWidth = Math.min(225, height * 0.58);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = '#080b10e8';
    roundedRect(-badgeWidth / 2, badgeY - 24, badgeWidth, 48, 14);
    ctx.fill();
    ctx.strokeStyle = visual.accent;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = visual.accent;
    ctx.font = '900 22px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText('◆'.repeat(visual.marks), 0, badgeY + 8);
  }
  ctx.restore();
}

function drawChapterMedals(chapterIndex, x, y, scale = 1) {
  const medals = hunterRegistry.chapterMedals[chapterIndex] || { clear: false, clean: false, perfect: false };
  const earned = [medals.clear, medals.clean, medals.perfect];
  const colors = ['#d7b36b', '#8ed2c3', '#fff0a2'];
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.max(11, 15 * scale)}px Inter, sans-serif`;
  earned.forEach((active, index) => {
    const medalX = x + index * 64 * scale;
    ctx.globalAlpha = active ? 1 : 0.34;
    ctx.fillStyle = active ? colors[index] : '#6f737b';
    ctx.strokeStyle = active ? colors[index] : '#4a4d54';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    ctx.arc(medalX, y, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = active ? '#17131a' : '#242630';
    ctx.font = `900 ${Math.max(12, 16 * scale)}px Cinzel, serif`;
    ctx.fillText(index === 2 ? '✦' : String(index + 1), medalX, y + 6 * scale);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawRegistrySummary(x, y, align = 'center') {
  ctx.save();
  ctx.textAlign = align;
  ctx.fillStyle = '#c7b98f';
  ctx.font = '700 17px Inter, sans-serif';
  ctx.fillText(`${t('registry')}  •  ${registrySummaryText().replace(/^.*?•  /, '')}`, x, y);
  ctx.restore();
}

function drawHud() {
  ctx.save();
  const activeLevel = levels[Math.max(0, levelIndex)];
  ctx.fillStyle = '#090b10d9';
  roundedRect(45, 38, 650, 154, 16);
  ctx.fill();
  ctx.strokeStyle = '#7c6c50';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = '700 24px Cinzel, serif';
  ctx.fillStyle = '#c8b68e';
  ctx.fillText(`${t('level')} ${levelIndex + 1} / ${TOTAL_LEVELS}`, 72, 77);
  ctx.font = '900 36px Cinzel, serif';
  ctx.fillStyle = '#f1dfb2';
  ctx.fillText(`${t('hunt')} ${kills} / ${TOTAL_TARGETS}`, 72, 121);
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillStyle = '#a99a7e';
  ctx.fillText(`${t(activeLevel.nameKey)}  •  ${t(currentRank)}`, 72, 151);
  if (activeLevel.scoutTrial) {
    ctx.font = '800 14px Inter, sans-serif';
    ctx.fillStyle = '#f3d47c';
    ctx.fillText(`${t('scoutTrial')}  •  ${t('scoutTrialProgress', { marked: levelMarkedTargets, required: activeLevel.scoutMarksRequired, weakness: Math.min(1, levelWeaknessHits) })}`, 72, 177);
  }
  ctx.textAlign = 'right';
  ctx.font = '700 20px Inter, sans-serif';
  ctx.fillStyle = '#a99a7e';
  ctx.fillText(t('score'), 665, 76);
  ctx.font = '800 36px Inter, sans-serif';
  ctx.fillStyle = '#eee3ca';
  ctx.fillText(score.toLocaleString(language), 665, 121);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#090b10d9';
  roundedRect(45, H - 125, 510, 80, 16);
  ctx.fill();
  ctx.strokeStyle = '#7c6c50';
  ctx.stroke();
  ctx.font = '700 24px Inter, sans-serif';
  ctx.fillStyle = '#cdbb94';
  ctx.fillText(t('health'), 72, H - 76);
  for (let i = 0; i < MAX_HEALTH; i += 1) {
    const heartX = 153 + i * 39;
    ctx.fillStyle = i < health ? '#b83e32' : '#2c2426';
    ctx.beginPath();
    ctx.moveTo(heartX, H - 91);
    ctx.arc(heartX + 9, H - 91, 10, Math.PI, 0);
    ctx.arc(heartX + 19, H - 91, 10, Math.PI, 0);
    ctx.lineTo(heartX + 14, H - 61);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#090b10d9';
  roundedRect(W - 710, H - 125, 360, 80, 16);
  ctx.fill();
  ctx.strokeStyle = shielding ? '#8be9e1' : '#7c6c50';
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = shielding ? '#a9fff4' : '#cdbb94';
  ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText(t('shield'), W - 680, H - 89);
  ctx.fillStyle = '#211c20';
  ctx.fillRect(W - 680, H - 70, 220, 14);
  ctx.fillStyle = shieldEnergy < 25 ? '#df684f' : '#62c9c4';
  ctx.fillRect(W - 680, H - 70, 220 * shieldEnergy / SHIELD_MAX, 14);
  ctx.strokeStyle = '#c5d7ce';
  ctx.lineWidth = 1;
  ctx.strokeRect(W - 680, H - 70, 220, 14);
  ctx.fillStyle = '#bfc8c0';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText(shielding ? t('active') : t('shieldHint'), W - 448, H - 58);

  ctx.fillStyle = '#090b10d9';
  roundedRect(W - 315, H - 125, 270, 80, 16);
  ctx.fill();
  ctx.strokeStyle = '#7c6c50';
  ctx.stroke();
  ctx.fillStyle = '#cdbb94';
  ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText(t('arrows'), W - 285, H - 77);
  ctx.fillStyle = ammo <= 3 ? '#ff6b4d' : '#f1dfb2';
  ctx.font = '900 42px Cinzel, serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(ammo), W - 75, H - 70);

  if (empoweredArrows > 0 && empoweredArrowTime > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#090b10e8';
    roundedRect(W - 710, H - 220, 360, 70, 14);
    ctx.fill();
    ctx.strokeStyle = '#d8994e';
    ctx.stroke();
    ctx.fillStyle = '#ffd06a';
    ctx.font = '800 19px Inter, sans-serif';
    ctx.fillText(t('strongArrows', { count: empoweredArrows }), W - 685, H - 180);
    ctx.fillStyle = '#c7b99f';
    ctx.font = '600 17px Inter, sans-serif';
    ctx.fillText(t('seconds', { value: empoweredArrowTime.toFixed(1) }), W - 430, H - 180);
  }

  if (combo > 1) {
    const comboVisual = rankVisuals[Math.max(0, Math.min(rankVisuals.length - 1, levelIndex))];
    const comboPulse = 1 + Math.sin(windTime * 7) * Math.min(0.08, combo * 0.006);
    ctx.save();
    ctx.translate(W / 2, 80);
    ctx.scale(comboPulse, comboPulse);
    ctx.textAlign = 'center';
    ctx.shadowColor = comboVisual.glow;
    ctx.shadowBlur = combo >= 5 ? 18 : 8;
    ctx.fillStyle = combo >= 5 ? comboVisual.accent : '#f3cb78';
    ctx.font = `900 ${combo >= 10 ? 36 : 30}px Cinzel, serif`;
    ctx.fillText(t('combo', { count: combo }), 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

function drawCrosshair() {
  if (state === 'paused') return;
  const size = charging ? 106 + charge * 18 : 96;
  ctx.save();
  ctx.translate(mouse.x, mouse.y);
  ctx.rotate(windTime * 0.18);
  ctx.globalAlpha = state === 'playing' ? 0.92 : 0.55;
  if (imageIsDrawable(art.crosshair)) ctx.drawImage(art.crosshair, -size / 2, -size / 2, size, size);
  else {
    ctx.strokeStyle = '#e4c782';
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  if (charging) {
    ctx.strokeStyle = charge >= 0.98 ? '#fff1a8' : '#cf9d58';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * charge);
    ctx.stroke();
  }
}

function drawWrappedText(text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  const visibleLines = lines.slice(0, maxLines);
  visibleLines.forEach((lineText, index) => ctx.fillText(lineText, x, y + index * lineHeight));
  return visibleLines.length;
}

function drawGuidePortrait(profile, x, bottomY, height, alpha = 1) {
  const image = art[profile.image];
  ctx.save();
  ctx.globalAlpha = alpha;
  if (imageIsDrawable(image)) {
    const width = height * image.width / image.height;
    ctx.drawImage(image, x - width / 2, bottomY - height, width, height);
  } else {
    ctx.fillStyle = `${profile.accent}55`;
    ctx.beginPath();
    ctx.arc(x, bottomY - height * 0.58, height * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGuideReactionBubble() {
  if (!guideSpeech || guideSpeech.kind !== 'reaction' || charging || arrows.length > 0) return;
  const profile = currentGuide();
  const alpha = Math.min(1, guideSpeech.life * 2, (guideSpeech.maxLife - guideSpeech.life) * 5);
  // Reactions are a compact top toast now. It stays away from the bow line and
  // disappears while a shot is being charged or is still in flight.
  const panelX = 820;
  const panelY = 205;
  const panelWidth = 1040;
  const panelHeight = 96;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha) * 0.78;
  ctx.fillStyle = '#080b12d9';
  roundedRect(panelX, panelY, panelWidth, panelHeight, 16);
  ctx.fill();
  ctx.strokeStyle = profile.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e4c982';
  ctx.font = '800 16px Cinzel, serif';
  ctx.fillText(t(profile.nameKey), panelX + 26, panelY + 29);
  ctx.fillStyle = '#f1eee5';
  ctx.font = '600 20px Inter, sans-serif';
  drawWrappedText(t(guideSpeech.textKey), panelX + 26, panelY + 64, panelWidth - 52, 25, 2);
  ctx.restore();
}

function drawBriefingOverlay(opacity = 1) {
  const profile = currentGuide();
  const level = levels[levelIndex];
  const alpha = Math.min(1, (7.2 - briefingTimer) * 4, briefingTimer * 2) * opacity;
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = '#02040ad9';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#080b13f2';
  roundedRect(190, 115, 1540, 820, 30);
  ctx.fill();
  ctx.strokeStyle = `${profile.accent}aa`;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = Math.max(0, alpha) * 0.28;
  ctx.fillStyle = profile.accent;
  ctx.beginPath();
  ctx.arc(440, 525, 310, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = Math.max(0, alpha);
  drawGuidePortrait(profile, 445, 890, 650, Math.max(0, alpha));
  // Keep the hunter's head below the dialogue card instead of letting the card
  // mask the face on narrow chapter briefing layouts.
  drawRankKnight(levelIndex, 1550, 910, 510, false, Math.max(0, alpha));

  ctx.textAlign = 'left';
  ctx.fillStyle = profile.accent;
  ctx.font = '700 24px Cinzel, serif';
  ctx.fillText(t('chapterBriefing'), 745, 205);
  ctx.fillStyle = '#f3dfac';
  ctx.font = '900 52px Cinzel, serif';
  drawWrappedText(t('levelBanner', { level: levelIndex + 1 }), 745, 275, 850, 58, 1);
  ctx.fillStyle = '#bda879';
  ctx.font = '700 23px Inter, sans-serif';
  ctx.fillText(t(level.nameKey), 748, 320);

  const bubbleX = 720;
  const bubbleY = 365;
  const bubbleWidth = 760;
  const bubbleHeight = 250;
  ctx.fillStyle = '#111722f5';
  roundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 24);
  ctx.fill();
  ctx.strokeStyle = profile.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = profile.accent;
  ctx.beginPath();
  ctx.moveTo(bubbleX, bubbleY + 120);
  ctx.lineTo(bubbleX - 55, bubbleY + 155);
  ctx.lineTo(bubbleX, bubbleY + 185);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e7c878';
  ctx.font = '800 23px Cinzel, serif';
  ctx.fillText(t(profile.nameKey), bubbleX + 38, bubbleY + 48);
  ctx.fillStyle = '#f4f1e8';
  ctx.font = '600 27px Inter, sans-serif';
  drawWrappedText(t(guideSpeech?.textKey || `briefingText${levelIndex + 1}`), bubbleX + 38, bubbleY + 105, bubbleWidth - 76, 39, 4);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c7b98f';
  ctx.font = '600 17px Inter, sans-serif';
  ctx.fillText(t('briefingHint'), W / 2, 885);
  ctx.restore();
}

function drawBriefingExitOverlay() {
  const progress = Math.max(0, Math.min(1, 1 - briefingExitTimer / BRIEFING_EXIT_DURATION));
  const panelFadeEnd = 0.42;
  if (progress < panelFadeEnd) {
    drawBriefingOverlay(1 - progress / panelFadeEnd);
    return;
  }

  const reveal = (progress - panelFadeEnd) / (1 - panelFadeEnd);
  ctx.fillStyle = `rgba(2, 4, 10, ${Math.max(0, 1 - reveal)})`;
  ctx.fillRect(0, 0, W, H);
}


function drawChapterTransitionOverlay() {
  if (!chapterTransition) return;
  const progress = Math.max(0, Math.min(1, 1 - chapterTransition.life / chapterTransition.maxLife));
  const fadeIn = Math.min(1, progress * 4);
  const fadeOut = Math.min(1, chapterTransition.life * 2.2);
  const alpha = Math.min(fadeIn, fadeOut);
  const nextIndex = chapterTransition.nextLevelIndex;
  const currentVisual = rankVisuals[Math.max(0, Math.min(rankVisuals.length - 1, levelIndex))];
  const nextLevel = levels[nextIndex];
  const sweep = Math.sin(windTime * 3.4) * 0.5 + 0.5;

  ctx.save();
  ctx.globalAlpha = 0.76 * alpha;
  ctx.fillStyle = '#02040bd9';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(W / 2, 470, 40, W / 2, 470, 680);
  glow.addColorStop(0, `${currentVisual.glow}28`);
  glow.addColorStop(0.5, `${currentVisual.glow}0c`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = currentVisual.accent;
  ctx.globalAlpha = alpha * (0.3 + sweep * 0.25);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(170, 540);
  ctx.lineTo(760, 540);
  ctx.moveTo(1160, 540);
  ctx.lineTo(1750, 540);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#f3cb78';
  ctx.font = '900 66px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦', W / 2, 505);

  drawRankKnight(levelIndex, 430, 795, 430, false);
  if (nextLevel) drawRankKnight(nextIndex, 1490, 795, 430, false);

  ctx.fillStyle = '#d3bb88';
  ctx.font = '700 23px Cinzel, serif';
  ctx.fillText(t('chapterVictory'), W / 2, 285);
  ctx.fillStyle = '#f2dfb3';
  ctx.font = '900 54px Cinzel, serif';
  ctx.fillText(t('levelBanner', { level: levelIndex + 1 }), 430, 360);
  if (nextLevel) ctx.fillText(t('levelBanner', { level: nextIndex + 1 }), 1490, 360);
  ctx.fillStyle = '#bda879';
  ctx.font = '700 22px Inter, sans-serif';
  ctx.fillText(t(levels[levelIndex].nameKey), 430, 405);
  if (nextLevel) ctx.fillText(t(nextLevel.nameKey), 1490, 405);
  ctx.fillStyle = '#f3cb78';
  ctx.font = '800 25px Cinzel, serif';
  ctx.fillText('→', W / 2, 585);
  ctx.fillStyle = '#c7b98f';
  ctx.font = '700 18px Inter, sans-serif';
  ctx.fillText(nextLevel ? t('nextChapter') : t('transitionHint'), W / 2, 650);
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillStyle = '#9d9b98';
  ctx.fillText(t('transitionHint'), W / 2, 690);
  ctx.restore();
}

function drawBossVictoryMoment() {
  if (!bossVictoryMoment) return;
  const moment = bossVictoryMoment;
  const progress = Math.max(0, Math.min(1, 1 - moment.life / moment.maxLife));
  const fade = Math.max(0, moment.life / moment.maxLife);
  const theme = BOSS_ARENA_THEMES[moment.arenaTheme] || BOSS_ARENA_THEMES.storm;
  const image = art[moment.image];
  const flare = Math.max(0, 1 - progress * 2.8);
  const textAlpha = Math.min(1, progress * 5) * Math.min(1, moment.life * 2.2);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.22 * fade + flare * 0.2;
  const releaseGlow = ctx.createRadialGradient(moment.x, moment.y, 14, moment.x, moment.y, moment.width * 1.9);
  releaseGlow.addColorStop(0, `${theme.core}aa`);
  releaseGlow.addColorStop(0.22, `${moment.accent}44`);
  releaseGlow.addColorStop(0.64, `${theme.edge}16`);
  releaseGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = releaseGlow;
  ctx.fillRect(moment.x - moment.width * 2, moment.y - moment.height * 2, moment.width * 4, moment.height * 4);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = `rgba(2,4,10,${0.12 + progress * 0.52})`;
  ctx.fillRect(0, 0, W, H);
  if (imageIsDrawable(image)) {
    ctx.save();
    ctx.translate(moment.x, moment.y);
    ctx.globalAlpha = 0.3 * fade;
    ctx.filter = 'brightness(0.08) saturate(0)';
    ctx.drawImage(image, -moment.width / 2, -moment.height / 2, moment.width, moment.height);
    ctx.filter = 'none';
    ctx.restore();

    moment.fragments.forEach((fragment) => {
      ctx.save();
      ctx.translate(fragment.x, fragment.y);
      ctx.rotate(fragment.rotation);
      ctx.globalAlpha = 0.96 * Math.min(1, fade + 0.16);
      ctx.filter = 'brightness(0.12) saturate(0.12)';
      ctx.beginPath();
      fragment.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(image, -moment.width / 2, -moment.height / 2, moment.width, moment.height);
      ctx.restore();
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.45 * fade;
      ctx.strokeStyle = theme.edge;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    });
  }

  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.78 * fade + flare * 0.22;
  ctx.strokeStyle = theme.core;
  ctx.lineWidth = 3;
  for (let index = 0; index < 11; index += 1) {
    const angle = index / 11 * Math.PI * 2 + windTime * 0.25;
    const length = moment.radius || Math.max(moment.width, moment.height) * (0.54 + (index % 3) * 0.12);
    ctx.beginPath();
    ctx.moveTo(moment.x + Math.cos(angle) * 24, moment.y + Math.sin(angle) * 24);
    ctx.lineTo(moment.x + Math.cos(angle) * length, moment.y + Math.sin(angle) * length);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f3cb78';
  ctx.font = '800 22px Inter, sans-serif';
  ctx.fillText(t('realmPowerReleased'), W / 2, 272);
  ctx.fillStyle = '#f2dfb3';
  ctx.font = '900 42px Cinzel, serif';
  ctx.fillText(t('realmThreatBroken'), W / 2, 326);
  ctx.fillStyle = moment.accent;
  ctx.font = '700 23px Cinzel, serif';
  ctx.fillText(t(moment.nameKey), W / 2, 370);
  ctx.restore();
}

function drawFallenHunter() {
  const visual = rankVisuals[Math.max(0, Math.min(rankVisuals.length - 1, levelIndex))];
  ctx.save();
  ctx.translate(445, 745);
  ctx.rotate(-0.26);
  ctx.globalAlpha = 0.92;
  drawRankKnight(levelIndex, 0, 0, 490, false);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.34 + Math.sin(windTime * 5) * 0.06;
  const aura = ctx.createRadialGradient(440, 690, 20, 440, 690, 390);
  aura.addColorStop(0, `${visual.glow}26`);
  aura.addColorStop(1, 'rgba(130,20,25,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(80, 300, 720, 650);
  ctx.restore();
}

function drawEmptyQuiver() {
  const pulse = 0.7 + Math.sin(windTime * 5) * 0.12;
  ctx.save();
  ctx.translate(440, 690);
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = '#c8473d';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-155, -120);
  ctx.lineTo(155, 120);
  ctx.moveTo(155, -120);
  ctx.lineTo(-155, 120);
  ctx.stroke();
  ctx.strokeStyle = '#d3bb88';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-130, -15);
  ctx.lineTo(110, -15);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-130, -15);
  ctx.lineTo(-168, -34);
  ctx.moveTo(-130, -15);
  ctx.lineTo(-168, 4);
  ctx.stroke();
  ctx.fillStyle = '#0b0d14e8';
  roundedRect(-115, -230, 230, 62, 18);
  ctx.fill();
  ctx.strokeStyle = '#c8473d';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#edb76b';
  ctx.font = '900 28px Cinzel, serif';
  ctx.textAlign = 'center';
  ctx.fillText('0', 0, -188);
  ctx.restore();
}

function drawOverlay() {
  if (state === 'paused') {
    ctx.fillStyle = 'rgba(2,3,7,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0a0d14f2';
    roundedRect(W / 2 - 420, 300, 840, 470, 24);
    ctx.fill();
    ctx.strokeStyle = '#9f8054';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d5b16d';
    ctx.font = '700 25px Cinzel, serif';
    ctx.fillText(t('hunt'), W / 2, 390);
    ctx.fillStyle = '#f2dfb3';
    ctx.font = '900 68px Cinzel, serif';
    ctx.fillText(t('pausedTitle'), W / 2, 485);
    ctx.fillStyle = '#c6c3bc';
    ctx.font = '500 25px Inter, sans-serif';
    ctx.fillText(t('pausedMessage'), W / 2, 545);
    ctx.fillStyle = '#171a22';
    roundedRect(W / 2 - 245, 590, 490, 86, 14);
    ctx.fill();
    ctx.strokeStyle = '#d5b16d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f3cb78';
    ctx.font = '800 27px Cinzel, serif';
    ctx.fillText(t('resume'), W / 2, 645);
    ctx.fillStyle = '#aaa79f';
    ctx.font = '500 19px Inter, sans-serif';
    ctx.fillText(t('pauseHint'), W / 2, 720);
    return;
  }
  if (state === 'briefing') {
    drawBriefingOverlay();
    return;
  }
  if (state === 'briefingExit') {
    drawBriefingExitOverlay();
    return;
  }
  if (state === 'transition') {
    drawChapterTransitionOverlay();
    return;
  }
  if (state === 'bossVictory') {
    drawBossVictoryMoment();
    return;
  }
  if (state === 'playing') {
    if (banner > 0) {
      // Keep the promotion visible without covering the playfield. The hunt
      // continues underneath this compact, edge-mounted notification.
      const alpha = Math.min(1, banner * 1.8, (2.8 - banner) * 2.5);
      const panelX = 820;
      const panelY = 34;
      const panelWidth = 1050;
      const panelHeight = 154;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha) * 0.9;
      ctx.fillStyle = '#05070ce8';
      roundedRect(panelX, panelY, panelWidth, panelHeight, 20);
      ctx.fill();
      ctx.strokeStyle = '#7f6a47';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = Math.max(0, alpha);
      drawRankKnight(levelIndex, 1752, 112, 148, false);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#d3bb88';
      ctx.font = '600 16px Cinzel, serif';
      ctx.fillText(t('rankPromotion'), panelX + 34, panelY + 28);
      ctx.fillStyle = '#f4e4bb';
      ctx.font = '900 30px Cinzel, serif';
      ctx.fillText(t('levelBanner', { level: levelIndex + 1 }), panelX + 34, panelY + 66);
      ctx.fillStyle = '#d7c5a1';
      ctx.font = '700 18px Inter, sans-serif';
      ctx.fillText(t(levels[levelIndex].nameKey), panelX + 34, panelY + 95);
      ctx.fillStyle = '#f3cb78';
      ctx.font = '800 18px Inter, sans-serif';
      ctx.fillText(t(currentRank), panelX + 34, panelY + 126);
      ctx.fillStyle = '#c6c3bc';
      ctx.font = '600 13px Inter, sans-serif';
      ctx.fillText(getLevelRewardText(), panelX + 34, panelY + 146);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#cdbb94';
      ctx.font = '700 13px Inter, sans-serif';
      ctx.fillText(t('chapterMedal'), panelX + 730, panelY + 29);
      drawChapterMedals(levelIndex, panelX + 665, panelY + 88, 0.78);
      ctx.restore();
    }
    if (guideSpeech?.kind === 'reaction') drawGuideReactionBubble();
    if (ammo <= 3) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff8a65';
      ctx.font = '800 22px Inter, sans-serif';
      ctx.fillText(t('lowAmmo'), W / 2, H - 48);
    }
    return;
  }

  ctx.fillStyle = 'rgba(2,3,7,0.66)';
  ctx.fillRect(0, 0, W, H);
  const panel = ctx.createLinearGradient(0, 250, 0, 850);
  panel.addColorStop(0, 'rgba(8,10,16,0.2)');
  panel.addColorStop(0.5, 'rgba(8,10,16,0.92)');
  panel.addColorStop(1, 'rgba(8,10,16,0.2)');
  ctx.fillStyle = panel;
  ctx.fillRect(0, 230, W, 650);
  ctx.textAlign = 'center';

  if (state === 'title') {
    ctx.fillStyle = '#b59863';
    ctx.font = '600 25px Cinzel, serif';
    ctx.fillText(t('valley'), W / 2, 330);
    ctx.fillStyle = '#f2dfb3';
    ctx.font = '900 96px Cinzel, serif';
    ctx.fillText(t('title'), W / 2, 445);
    ctx.fillStyle = '#c6c3bc';
    ctx.font = '400 26px Inter, sans-serif';
    ctx.fillText(t('subtitle'), W / 2, 505);
    ctx.fillStyle = '#0e1118e8';
    roundedRect(W / 2 - 315, 560, 630, 150, 18);
    ctx.fill();
    ctx.strokeStyle = '#7f6a47';
    ctx.stroke();
    ctx.fillStyle = '#e7d5ab';
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillText(t('aim'), W / 2, 610);
    ctx.font = '400 22px Inter, sans-serif';
    ctx.fillStyle = '#aaa79f';
    ctx.fillText(t('fireInstruction'), W / 2, 656);
    ctx.font = '600 17px Inter, sans-serif';
    ctx.fillStyle = '#d7b36b';
    ctx.fillText(t('markInstruction'), W / 2, 689);
    ctx.fillStyle = '#d5b16d';
    ctx.font = '800 26px Cinzel, serif';
    ctx.fillText(t('start'), W / 2, 785);
    drawRegistrySummary(W / 2, 838);
  } else {
    if (state === 'won') {
      drawRankKnight(TOTAL_LEVELS - 1, 470, 635, 500);
      const finalTextX = 850;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#d1ae66';
      ctx.font = '600 24px Cinzel, serif';
      ctx.fillText(t('valleySilent'), finalTextX, 315);
      ctx.fillStyle = '#f2dfb3';
      ctx.font = '900 70px Cinzel, serif';
      ctx.fillText(t('huntComplete'), finalTextX, 420);
      ctx.fillStyle = '#d3bb88';
      ctx.font = '700 24px Cinzel, serif';
      ctx.fillText(t('rankPromotion'), finalTextX, 500);
      ctx.fillStyle = '#f3cb78';
      ctx.font = '900 39px Cinzel, serif';
      ctx.fillText(t(currentRank), finalTextX, 555);
      ctx.fillStyle = '#d4cec2';
      ctx.font = '700 27px Inter, sans-serif';
      ctx.fillText(`${t('score')}  ${score.toLocaleString(language)}    •    ${t('combo', { count: bestCombo })}`, finalTextX, 625);
      ctx.font = '400 22px Inter, sans-serif';
      ctx.fillStyle = '#aaa79f';
      ctx.fillText(`${t('creaturesHunted', { kills, total: TOTAL_TARGETS })}  •  ${t('levelsCount', { levels: TOTAL_LEVELS })}`, finalTextX, 670);
      drawRegistrySummary(finalTextX, 715, 'left');
      ctx.fillStyle = '#d5b16d';
      ctx.font = '800 26px Cinzel, serif';
      ctx.fillText(t('restart'), finalTextX, 770);
      return;
    }
    const ranOutOfArrows = lossReason === 'arrows';
    if (ranOutOfArrows) drawEmptyQuiver();
    else drawFallenHunter();

    ctx.fillStyle = '#080b12e8';
    roundedRect(790, 255, 980, 610, 26);
    ctx.fill();
    ctx.strokeStyle = '#9f4c42';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c8473d';
    ctx.font = '700 24px Cinzel, serif';
    ctx.fillText(ranOutOfArrows ? t('ammoDepleted') : t('huntInterrupted'), 850, 340);
    ctx.fillStyle = '#f2dfb3';
    ctx.font = '900 70px Cinzel, serif';
    drawWrappedText(ranOutOfArrows ? t('arrowsDepleted') : t('hunterDeath'), 850, 445, 820, 78, 2);
    ctx.fillStyle = '#d4cec2';
    ctx.font = '700 29px Inter, sans-serif';
    ctx.fillText(`${t('score')}  ${score.toLocaleString(language)}    •    ${t('combo', { count: bestCombo })}`, 850, 560);
    ctx.font = '700 24px Cinzel, serif';
    ctx.fillStyle = '#f3cb78';
    ctx.fillText(t('finalRank', { rank: t(currentRank) }), 850, 610);
    ctx.font = '400 23px Inter, sans-serif';
    ctx.fillStyle = '#aaa79f';
    ctx.fillText(`${t('creaturesHunted', { kills, total: TOTAL_TARGETS })}  •  ${t('levelsCount', { levels: TOTAL_LEVELS })}`, 850, 652);
    drawRegistrySummary(850, 700, 'left');
    ctx.fillStyle = '#d5b16d';
    ctx.font = '800 22px Cinzel, serif';
    const checkpointLevel = getResumeLevelIndex() + 1;
    ctx.fillText(checkpointLevel > 1
      ? t('deathContinuePrompt', { level: checkpointLevel })
      : t('deathRetryPrompt'), 850, 748);
  }
}

function draw() {
  ctx.save();
  const sx = shake ? (Math.random() - 0.5) * shake : 0;
  const sy = shake ? (Math.random() - 0.5) * shake : 0;
  ctx.translate(sx, sy);
  drawBackdrop();
  drawBossArenaEffect();
  drawFormationFeedback();
  enemies.forEach(drawEnemy);
  hostileShots.forEach(drawHostileShot);
  arrows.forEach(drawArrow);
  particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  if (state === 'playing' || state === 'paused') drawBow();
  // The shield is the foreground guard, so it must cover the crossbow when held.
  if (state === 'playing' || state === 'paused') drawShield();
  floaters.forEach((floater) => {
    ctx.globalAlpha = Math.max(0, floater.life / floater.maxLife);
    ctx.textAlign = 'center';
    ctx.font = `800 ${floater.size}px Inter, sans-serif`;
    ctx.fillStyle = floater.color;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;
    ctx.fillText(floater.text, floater.x, floater.y);
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  if (state === 'playing' || state === 'paused') drawHud();
  drawOverlay();
  if (state === 'playing') drawCrosshair();
  if (flash > 0) {
    ctx.fillStyle = `rgba(180,20,10,${flash * 0.8})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function frame(now) {
  // Some embedded ad players return focus without reliably dispatching focus
  // or visibility events. Retry recovery from the live frame loop as well.
  if (browserPausedGame) resumeAfterBrowserInterruption();
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}
if (BOSS_QA_AUTO) {
  window.setTimeout(() => {
    if (state === 'title') {
      unlockAudio();
      startGame();
    }
  }, 180);
}
requestAnimationFrame(frame);
