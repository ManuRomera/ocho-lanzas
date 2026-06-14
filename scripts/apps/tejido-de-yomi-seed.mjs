const DATA_VERSION = "2.0.0";
const STARTER_WORLD_IDS = ["ocho-lanzas-tejido-de-yomi"];

const ICONS = {
  macro: "icons/svg/book.svg",
  complication: "icons/svg/d20-black.svg",
  names: "icons/svg/scroll.svg",
  ritual: "icons/svg/book.svg",
  gear: "icons/svg/item-bag.svg",
  weapon: "icons/svg/sword.svg"
};

function p(path) { return `systems/ocho-lanzas/el_tejido_de_yomi_pack_v10/assets/${path}`; }
function flagData(slug) { return { "ocho-lanzas": { tejidoSlug: slug, tejidoDataVersion: DATA_VERSION } }; }
function getTejidoDocIndexRaw() {
  try { return JSON.parse(game.settings.get("ocho-lanzas", "tejidoDeYomiDocIndex") || "{}"); }
  catch (_err) { return {}; }
}
export function getTejidoDocIndex() { return getTejidoDocIndexRaw(); }
function setTejidoDocIndex(index) { return game.settings.set("ocho-lanzas", "tejidoDeYomiDocIndex", JSON.stringify(index)); }
function currentSeedVersion() { return game.settings.get("ocho-lanzas", "tejidoDeYomiSeededVersion") || ""; }
function installPromptDismissed() { return !!game.settings.get("ocho-lanzas", "tejidoDeYomiInstallPromptDismissed"); }
function setInstallPromptDismissed(value) { return game.settings.set("ocho-lanzas", "tejidoDeYomiInstallPromptDismissed", !!value); }
function isStarterWorld() { return STARTER_WORLD_IDS.includes(game.world.id); }

export async function promptInstallTejidoDeYomiWorld({ force = true, dismiss = false } = {}) {
  if (!game.user.isGM) return false;
  const content = `<p>${game.i18n.localize("OCHO.Yomi.InstallBody")}</p><p><em>${game.i18n.localize("OCHO.Yomi.InstallHint")}</em></p>`;
  const confirmed = await Dialog.confirm({
    title: game.i18n.localize("OCHO.Yomi.InstallTitle"),
    content,
    yes: async () => true,
    no: () => false,
    defaultYes: true
  });
  if (!confirmed) return false;
  await setInstallPromptDismissed(false).catch(() => {});
  return seedTejidoDeYomiWorld({ force, notify: true });
}

async function promptInstallForEmptyWorld() {
  if (!game.user.isGM) return false;
  return new Promise((resolve) => {
    new Dialog({
      title: game.i18n.localize("OCHO.Yomi.PromptTitle"),
      content: `<p>${game.i18n.localize("OCHO.Yomi.PromptBody")}</p>`,
      buttons: {
        install: {
          icon: '<i class="fa-solid fa-box-open"></i>',
          label: game.i18n.localize("OCHO.Yomi.PromptInstall"),
          callback: async () => {
            await seedTejidoDeYomiWorld({ force: true, notify: true });
            resolve(true);
          }
        },
        later: {
          icon: '<i class="fa-regular fa-clock"></i>',
          label: game.i18n.localize("OCHO.Yomi.PromptLater"),
          callback: () => resolve(false)
        },
        never: {
          icon: '<i class="fa-regular fa-eye-slash"></i>',
          label: game.i18n.localize("OCHO.Yomi.PromptNever"),
          callback: async () => {
            await setInstallPromptDismissed(true);
            resolve(false);
          }
        }
      },
      default: "install",
      close: () => resolve(false)
    }).render(true);
  });
}

async function ensureFolder({ name, type, parent = null, color = null, sorting = "a" }) {
  let folder = game.folders.find(f => f.type === type && f.name === name && ((f.folder?.id ?? null) === (parent?.id ?? null)));
  if (folder) return folder;
  folder = await Folder.create({ name, type, folder: parent?.id ?? null, color, sorting, flags: flagData(`folder-${type}-${name}`) });
  return folder;
}
async function ensureDoc({ collection, type, name, folder = null, slug, createData }) {
  let doc = collection.find(d => d.name === name && ((d.folder?.id ?? null) === (folder?.id ?? null)));
  if (doc) {
    if (slug && !doc.getFlag("ocho-lanzas", "tejidoSlug")) await doc.setFlag("ocho-lanzas", "tejidoSlug", slug).catch(() => {});
    return doc;
  }
  const data = foundry.utils.mergeObject({ name, folder: folder?.id ?? null, flags: flagData(slug) }, createData || {});
  const map = { Actor, Item, JournalEntry, RollTable, Macro, Scene, Folder };
  return map[type].create(data);
}
function journalHtml(title, body) {
  return `<section class="ol-yomi-journal"><h1>${title}</h1>${body}</section>`;
}
function pageData(title, content) {
  return [{ name: title, type: "text", title: { show: true, level: 1 }, text: { format: 1, content } }];
}
function L(index, slug, label) {
  const uuid = index?.[slug]?.uuid;
  return uuid ? `@UUID[${uuid}]{${label ?? index[slug].name}}` : (label ?? slug);
}
function actorToken(img) {
  return {
    texture: { src: img, scaleX: 1, scaleY: 1 },
    disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
    displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
    visionMode: "basic"
  };
}
async function embedItems(actor, items) {
  if (!items?.length) return;
  const existing = new Set(actor.items.map(i => i.name));
  const toCreate = items.filter(i => !existing.has(i.name));
  if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);
}

const WORLD_ITEMS = [
  { slug: "item-katana", type: "weapon", name: "Katana sin vaina", img: ICONS.weapon, system: { quantity: 1, equipped: true, tags: ["Ronin", "Precisa"], description: "Katana envuelta en tela negra. La lleva Kanemoto Ryū." } },
  { slug: "item-tablillas", type: "ritual", name: "Tablillas de escritura roja", img: ICONS.ritual, system: { quantity: 1, equipped: true, tags: ["Exorcismo", "Onmyōji"], description: "Tablillas de madera utilizadas por Shizuku para contener y pronunciar nombres verdaderos." } },
  { slug: "item-cuenco", type: "ritual", name: "Cuenco de bronce vibrante", img: ICONS.ritual, system: { quantity: 1, equipped: true, tags: ["Resonancia", "Espiritual"], description: "Cuenco de bronce de Mitsuru. Vibra cerca de lo sobrenatural." } },
  { slug: "item-cuenta-funeraria", type: "gear", name: "Cuenta funeraria negra", img: ICONS.gear, system: { quantity: 1, equipped: false, tags: ["Pista", "Yomi"], description: "Cuenta de madera negra hallada en el umbral del santuario." } },
  { slug: "item-llave-okiya", type: "gear", name: "Llave de repuesto de Okiya", img: ICONS.gear, system: { quantity: 1, equipped: false, tags: ["Acceso", "Casa de Okiya"], description: "Jiro conserva una llave de repuesto por si la tejedora la necesitaba." } },
  { slug: "item-sal", type: "gear", name: "Saco de sal", img: ICONS.gear, system: { quantity: 1, equipped: false, tags: ["Protección", "Ritual"], description: "Sal común, útil para ahuyentar presencias y trazar límites provisionales." } },
  { slug: "item-huso-negro", type: "ritual", name: "Huso negro", img: ICONS.ritual, system: { quantity: 1, equipped: false, tags: ["Yomi", "Ancla"], description: "Objeto ritual hallado por Okiya en el bosque. Sostiene al Tsuchigumo en este mundo." } },
  { slug: "item-fuego-sal", type: "ritual", name: "Fuego de sal", img: ICONS.ritual, system: { quantity: 1, equipped: false, tags: ["Purificación", "Final"], description: "Mezcla ritual improvisada con sal, aceite y yesca. Puede destruir el Tapiz de Yomi." } }
];

const ACTORS = [
  {
    slug: "actor-ryu", folderKey: "agents", type: "character", name: "Kanemoto Ryū", img: p("images/characters/kanemoto-ryu.png"),
    system: { concept: "Ronin · El Espejo Roto", occupation: "Samurái sin señor (Ronin)", curse: "Ve sombras con forma de su antiguo señor al borde del sueño.", curseCount: 1, backgrounds: ["Soldado"], prides: ["Código"], onmyoujis: [], bondsText: "Protege a Shizuku aunque ella no lo pida. Mira a Mitsuru con respeto cauteloso.", eventsText: "Mató a su señor cuando la Maldición lo volvió monstruoso. Nadie le creyó salvo Las Ocho Lanzas.", equipmentText: "Katana sin vaina atada en tela negra. Ropa de viaje. Manta de campaña.", haikaText: "El miedo informa. La duda mata. La hoja recuerda.", notes: "Rasgo visible: cicatriz diagonal de ceja a barbilla. Frases: 'Ya vi esto una vez.' / 'El miedo es información.'" },
    items: [{ type: "weapon", name: "Katana sin vaina", img: ICONS.weapon, system: { quantity: 1, equipped: true, tags: ["Ronin", "Precisa"], description: "Katana personal de Ryū." } }]
  },
  {
    slug: "actor-shizuku", folderKey: "agents", type: "character", name: "Shizuku", img: p("images/characters/shizuku.png"),
    system: { concept: "Onmyōji · La Voz del Velo", occupation: "Onmyoji (divina y exorcista)", curse: "Ha sentido el borde de Yomi desde la desaparición de su maestro Hiroshi.", curseCount: 3, backgrounds: ["Erudito", "Investigador"], prides: ["Fe"], onmyoujis: ["Exorcizar", "Espiritismo"], bondsText: "Sabe que Ryū carga una culpa inmensa. Cree que Mitsuru escucha cosas que ella todavía no entiende.", eventsText: "Aprendió bajo Hiroshi, desaparecido hace dos años. Busca respuestas sobre Yomi en cada misión.", equipmentText: "Tablillas con escritura roja. Pincel ritual. Pañuelo blanco en la muñeca izquierda.", haikaText: "Los nombres atan. El velo tiembla. La palabra hiere.", notes: "Inteligente y analítica. El Tsuchigumo reacciona con violencia especial cuando escucha un nombre verdadero pronunciado con certeza." },
    items: [{ type: "ritual", name: "Tablillas de escritura roja", img: ICONS.ritual, system: { quantity: 1, equipped: true, tags: ["Exorcismo", "Nombre verdadero"], description: "Foco ritual de Shizuku." } }]
  },
  {
    slug: "actor-mitsuru", folderKey: "agents", type: "character", name: "Fujiwara Mitsuru", img: p("images/characters/fujiwara-mitsuru.png"),
    system: { concept: "Yamabushi · El Monte que Camina", occupation: "Yamabushi (asceta de montaña)", curse: "Las montañas le hablan con claridad inquietante cuando la Maldición está cerca.", curseCount: 2, backgrounds: ["Investigador", "Jornalero"], prides: ["Fe", "Obligación"], onmyoujis: ["Clarividencia"], bondsText: "Intenta mantener unidos a Ryū y Shizuku. Mira a ambos como hermanos menores marcados por fuerzas distintas.", eventsText: "Treinta años de peregrinación. Se unió a Las Ocho Lanzas para que alguien siguiera recordando los viejos límites del mundo.", equipmentText: "Bastón de peregrino con campanillas. Cuenco de bronce que vibra cerca de lo sobrenatural.", haikaText: "La nieve escucha. La senda advierte. El bronce responde.", notes: "Sereno, paciente y muy atento a los cambios del entorno." },
    items: [{ type: "ritual", name: "Cuenco de bronce vibrante", img: ICONS.ritual, system: { quantity: 1, equipped: true, tags: ["Resonancia", "Meditación"], description: "Instrumento ritual de Mitsuru." } }]
  },
  { slug: "npc-jiro", folderKey: "npcs", type: "npc", name: "Jiro", img: p("images/npcs/jiro.png"), system: { concept: "Anciano del pueblo · El Que Recuerda", occupation: "Exlabrador y anciano de Shimokawa", curse: "Miedo cansado, pero no cobarde.", curseCount: 1, notes: "Conoce a Okiya desde niña. Tiene sal abundante y una llave de repuesto. Quiere la verdad y que todo esto termine." } },
  { slug: "npc-kenji", folderKey: "npcs", type: "npc", name: "Kenji", img: p("images/npcs/kenji.png"), system: { concept: "Niño testigo · Los Ojos que Vieron", occupation: "Aprendiz de tejedor", curse: "Tiene una marca creciente en la palma tras mirar demasiado el tapiz.", curseCount: 1, notes: "Vio el tapiz moverse y un gato negro atravesar una pared. Quiere que alguien le crea." } },
  { slug: "npc-okiya", folderKey: "npcs", type: "npc", name: "Okiya", img: p("images/npcs/okiya.png"), system: { concept: "Tejedora atrapada · Anfitriona del bakemono", occupation: "Maestra tejedora de Shimokawa", curse: "El Tsuchigumo usa su cuerpo como telar y voz.", curseCount: 4, notes: "Sesenta y ocho años. Viuda. Cuando el Tsuchigumo la controla, sus ojos se vuelven negros hasta el borde." } },
  { slug: "npc-sosuke", folderKey: "npcs", type: "npc", name: "Tanaka Sōsuke", img: p("images/npcs/tanaka-sosuke.png"), system: { concept: "Mensajero atrapado en el sueño", occupation: "Agente auxiliar de Las Ocho Lanzas", curse: "Está medio tejido al tapiz y murmura desde el sueño de Yomi.", curseCount: 3, notes: "Puede revelar pistas, el nombre verdadero o el ritmo del tapiz si se logra despertarlo o escuchar sus susurros." } },
  { slug: "bakemono-tsuchigumo", folderKey: "bakemono", type: "npc", name: "Tsuchigumo de Yomi", img: p("images/bakemonos/tsuchigumo-yomi.png"), system: { concept: "Bakemono mayor · La Tejedora de Almas", occupation: "Demonio araña nacido en Yomi", curse: "No puede mantenerse en este mundo sin un ancla y un anfitrión.", curseCount: 6, notes: "Amenazas: tejer a un ser vivo al tapiz, inmovilizar con hilos, forzar tiradas de Maldición al manifestarse. Debilidades: nombre verdadero, destrucción del tapiz y anzuelo inverso." } },
  { slug: "bakemono-kaibyo", folderKey: "bakemono", type: "npc", name: "Kaibyō", img: p("images/bakemonos/kaibyo-gatos-sombra.png"), system: { concept: "Bakemono menor · Los Gatos-Sombra", occupation: "Extensiones inconscientes del tapiz", curse: "Observan y delatan, rara vez atacan directamente.", curseCount: 2, notes: "Lo que ven, lo ve el Tsuchigumo. Pueden ahuyentarse con fuego, sal o campanillas." } }
];

function makeTables() {
  return [
    { slug: "table-complicaciones", name: "El Tejido de Yomi · Complicaciones", description: `<p>Úsala cuando la sesión pierda ritmo o quieras tensar el avance del tapiz.</p>`, formula: "1d6", results: [
      "Un Kaibyō aparece junto a uno de los personajes, mirando fijamente hacia la casa de Okiya. Si lo siguen, descubren una nueva pista.",
      "Kenji desaparece de casa de Jiro. Sus huellas van hacia la casa de Okiya y la marca de su palma ha crecido.",
      "Tanaka Sōsuke murmura en su sueño el nombre verdadero del Tsuchigumo. Solo hay unos segundos para entenderlo.",
      "Los hilos negros del exterior empiezan a contraerse. El avance del tapiz aumenta +2.",
      "La luz de la casa de Okiya se apaga por completo durante un minuto. El Tsuchigumo actúa desde la oscuridad.",
      "Jiro llega corriendo: Okiya está diciendo en voz alta el nombre del personaje con mayor Maldición."
    ] },
    { slug: "table-nombres", name: "El Tejido de Yomi · Nombres Verdaderos", description: `<p>Escoge o lanza cuando Shizuku logre identificar la forma en que el bakemono se nombra a sí mismo.</p>`, formula: "1d4", results: [
      "Kumo-no-Yomi — Araña de Yomi",
      "Itokami — El que teje el aliento",
      "Kurohoshi-no-Tsuchi — Tierra de la estrella negra",
      "Amanohari — El hilo que desciende del cielo vacío"
    ] }
  ];
}

function makeJournals(index) {
  return [
    { slug: "guide-index", folderKey: "guide", name: "El Tejido de Yomi · Índice del World", content: journalHtml("El Tejido de Yomi", `
      <p>Este world queda preparado para dirigir la aventura desde el minuto cero. Usa la app integrada o navega directamente por los documentos del director.</p>
      <ul>
        <li><strong>Agentes:</strong> ${L(index, "actor-ryu", "Kanemoto Ryū")}, ${L(index, "actor-shizuku", "Shizuku")} y ${L(index, "actor-mitsuru", "Fujiwara Mitsuru")}.</li>
        <li><strong>PNJ:</strong> ${L(index, "npc-jiro", "Jiro")}, ${L(index, "npc-kenji", "Kenji")}, ${L(index, "npc-okiya", "Okiya")} y ${L(index, "npc-sosuke", "Tanaka Sōsuke")}.</li>
        <li><strong>Bakemonos:</strong> ${L(index, "bakemono-tsuchigumo", "Tsuchigumo de Yomi")}, ${L(index, "bakemono-kaibyo", "Kaibyō")} y ${L(index, "journal-tapiz-yomi", "El Tapiz de Yomi")}.</li>
        <li><strong>Localizaciones:</strong> ${L(index, "journal-shimokawa", "Shimokawa")}, ${L(index, "journal-santuario-camino", "Santuario del Camino")}, ${L(index, "journal-casa-jiro", "Casa de Jiro")}, ${L(index, "journal-casa-okiya", "Casa de Okiya")} y ${L(index, "journal-bosque-norte", "Bosque del Norte")}.</li>
        <li><strong>Escenas:</strong> ${L(index, "scene-prologo", "Prólogo")}, ${L(index, "scene-shimokawa", "Llegada a Shimokawa")}, ${L(index, "scene-conversaciones", "Conversaciones en la oscuridad")}, ${L(index, "scene-umbral", "El Umbral de Okiya")}, ${L(index, "scene-okiya-habla", "Okiya Habla")}, ${L(index, "scene-tapiz", "Destruir el Tapiz")} y ${L(index, "scene-amanecer", "El Amanecer de Shimokawa")}.</li>
        <li><strong>Tablas:</strong> ${L(index, "table-complicaciones", "Tabla de complicaciones")} y ${L(index, "table-nombres", "Nombres verdaderos del Tsuchigumo")}.</li>
      </ul>
      <p>Macros de acceso rápido: ${L(index, "macro-open-yomi", "Abrir El Tejido de Yomi")} y ${L(index, "macro-reseed-yomi", "Reparar / Reimportar El Tejido de Yomi")}.</p>
    `) },
    { slug: "journal-shimokawa", folderKey: "locations", name: "Shimokawa", content: journalHtml("Shimokawa", `
      <p>Aldea de montaña conocida por sus tejidos de lino. Lleva tres semanas aislada y asustada. La mayoría de casas están cerradas, sin humo ni voces.</p>
      <p><strong>Lo que transmite:</strong> silencio, nieve, respiraciones contenidas detrás de la madera, una sola luz extraña viniendo del norte.</p>
      <p><strong>Pistas inmediatas:</strong> todas las huellas van hacia dentro; ninguna sale. La aldea ya siente el tirón del ${L(index, "journal-tapiz-yomi", "Tapiz de Yomi")}.</p>
      <p><strong>Documentos relacionados:</strong> ${L(index, "scene-shimokawa", "Escena de llegada")}, ${L(index, "npc-jiro", "Jiro")}, ${L(index, "npc-kenji", "Kenji")}.</p>
    `) },
    { slug: "journal-santuario-camino", folderKey: "locations", name: "Santuario del Camino", content: journalHtml("Santuario del Camino", `
      <p>Pequeño santuario junto al sendero de montaña donde los agentes reciben la misión. La nieve amortigua todo salvo la voz del mensajero.</p>
      <p>Aquí aparece por primera vez la ${L(index, "item-cuenta-funeraria", "cuenta funeraria negra")}, señal material de que algo de Yomi ha tocado el mundo.</p>
      <p><strong>Úsalo para:</strong> presentación del grupo, recordar la misión anterior, fijar el tono y sembrar la primera sensación de anormalidad.</p>
    `) },
    { slug: "journal-casa-jiro", folderKey: "locations", name: "Casa de Jiro", content: journalHtml("Casa de Jiro", `
      <p>La única casa con una linterna visible en el umbral. Refugio provisional para ${L(index, "npc-kenji", "Kenji")} y punto de anclaje humano de la aventura.</p>
      <p><strong>Recursos:</strong> ${L(index, "item-llave-okiya", "llave de repuesto de Okiya")}, ${L(index, "item-sal", "sal")}, verdad práctica y recuerdos de la aldea.</p>
      <p><strong>Escena relacionada:</strong> ${L(index, "scene-conversaciones", "Conversaciones en la oscuridad")}.</p>
    `) },
    { slug: "journal-casa-okiya", folderKey: "locations", name: "Casa de Okiya", content: journalHtml("Casa de Okiya", `
      <p>Casa silenciosa al borde del pueblo. El umbral ya está invadido por hilos negros. Dentro, el aire es húmedo, la temperatura desciende y el telar parece respirar.</p>
      <p><strong>Elementos clave:</strong> ${L(index, "npc-okiya", "Okiya")}, ${L(index, "npc-sosuke", "Tanaka Sōsuke")}, ${L(index, "journal-tapiz-yomi", "Tapiz de Yomi")} y el ${L(index, "item-huso-negro", "huso negro")} oculto bajo el telar.</p>
      <p><strong>Escenas relacionadas:</strong> ${L(index, "scene-umbral", "El Umbral de Okiya")} y ${L(index, "scene-okiya-habla", "Okiya Habla")}.</p>
    `) },
    { slug: "journal-bosque-norte", folderKey: "locations", name: "Bosque del Norte y santuario local", content: journalHtml("Bosque del Norte", `
      <p>El bosque mira a la aldea desde arriba. Entre los árboles se encuentra el santuario local, ahora profanado por una ofrenda invertida y una luz enfermiza.</p>
      <p>Sirve para introducir huellas imposibles, apariciones de ${L(index, "bakemono-kaibyo", "Kaibyō")} y recuerdos de cuándo Okiya halló el ${L(index, "item-huso-negro", "huso negro")}.</p>
    `) },
    { slug: "journal-tapiz-yomi", folderKey: "locations", name: "El Tapiz de Yomi", content: journalHtml("El Tapiz de Yomi", `
      <p>Puerta tejida entre el mundo y Yomi. Cada hilo representa un vínculo, una memoria o una vida atrapada.</p>
      <p><strong>Efectos:</strong> dormir personajes, inmovilizar con hilos, alimentar al ${L(index, "bakemono-tsuchigumo", "Tsuchigumo")} y acelerar el amanecer.</p>
      <p><strong>Destruirlo:</strong> con ${L(index, "item-fuego-sal", "fuego de sal")}, un exorcismo con nombre verdadero o sacrificando el hilo que une a la víctima con el ancla.</p>
    `) },
    { slug: "scene-prologo", folderKey: "scenes", name: "Prólogo · La Misión en el Santuario del Camino", content: journalHtml("Prólogo", `
      <p>Los agentes se reúnen en el ${L(index, "journal-santuario-camino", "Santuario del Camino")}. El mensajero les entrega un pergamino y la ${L(index, "item-cuenta-funeraria", "cuenta funeraria negra")}.</p>
      <p><strong>Saben esto:</strong> ${L(index, "journal-shimokawa", "Shimokawa")} lleva tres semanas incomunicada, ${L(index, "npc-okiya", "Okiya")} vive sola al borde del pueblo y un agente de Las Ocho Lanzas ha dejado de responder.</p>
      <p><strong>Objetivo de escena:</strong> presentar al grupo, fijar una última misión compartida y sembrar las primeras anomalías del bosque.</p>
    `) },
    { slug: "scene-shimokawa", folderKey: "scenes", name: "Acto I · Las Puertas Cerradas de Shimokawa", content: journalHtml("Las Puertas Cerradas de Shimokawa", `
      <p>La aldea aparece entre los árboles cuando el sol ya no tiene fuerza. Todo está cerrado. Solo una luz vieja viene del norte.</p>
      <p><strong>Opciones inmediatas:</strong> llamar a la ${L(index, "journal-casa-jiro", "casa de Jiro")}, investigar las huellas, seguir la luz o rodear la aldea para medir el alcance de los hilos.</p>
      <p><strong>Complicación natural:</strong> un ${L(index, "bakemono-kaibyo", "Kaibyō")} observa desde un tejado y delata los movimientos del grupo.</p>
    `) },
    { slug: "scene-conversaciones", folderKey: "scenes", name: "Acto I · Conversaciones en la Oscuridad", content: journalHtml("Conversaciones en la Oscuridad", `
      <p>En la ${L(index, "journal-casa-jiro", "casa de Jiro")}, el grupo cruza la primera barrera de miedo. ${L(index, "npc-jiro", "Jiro")} ofrece verdad práctica. ${L(index, "npc-kenji", "Kenji")} ofrece la verdad imposible.</p>
      <ul>
        <li>Jiro confirma que Okiya sigue ahí dentro y que algo la usa.</li>
        <li>Kenji describe el tapiz moviéndose y la marca en su palma.</li>
        <li>Pueden conseguir ${L(index, "item-llave-okiya", "la llave")}, ${L(index, "item-sal", "la sal")} y una línea emocional clara para salvar a Okiya.</li>
      </ul>
    `) },
    { slug: "scene-umbral", folderKey: "scenes", name: "Acto II · El Umbral de Okiya", content: journalHtml("El Umbral de Okiya", `
      <p>La ${L(index, "journal-casa-okiya", "casa de Okiya")} está hilvanada por hilos negros. Entrar no es solo forzar una puerta: es aceptar que dentro la casa ya no obedece al mundo.</p>
      <p><strong>Dentro esperan:</strong> pasillos húmedos, telar en marcha, respiración donde no debería haber nadie y ${L(index, "npc-sosuke", "Tanaka Sōsuke")} atrapado en el sueño.</p>
      <p><strong>Hallazgos:</strong> el ${L(index, "journal-tapiz-yomi", "tapiz")}, el ancla del ${L(index, "item-huso-negro", "huso negro")} y la certeza de que el amanecer será la derrota si no actúan.</p>
    `) },
    { slug: "scene-okiya-habla", folderKey: "scenes", name: "Acto II · Okiya Habla", content: journalHtml("Okiya Habla", `
      <p>${L(index, "npc-okiya", "Okiya")} habla con la voz del ${L(index, "bakemono-tsuchigumo", "Tsuchigumo de Yomi")}. La conversación es un combate de voluntad, información y símbolos.</p>
      <p><strong>Qué puede revelar:</strong> la dependencia del ancla, la utilidad del nombre verdadero, el deseo del bakemono por cruzar al amanecer y el precio de salvar a la tejedora.</p>
      <p><strong>Recurso del DJ:</strong> si el grupo se atasca, usa ${L(index, "table-nombres", "la tabla de nombres verdaderos")} o un murmullo de ${L(index, "npc-sosuke", "Sōsuke") }.</p>
    `) },
    { slug: "scene-tapiz", folderKey: "scenes", name: "Acto III · Destruir el Tapiz", content: journalHtml("Destruir el Tapiz", `
      <p>La resolución admite tres caminos claros: exorcismo con nombre verdadero, sacrificio del hilo o fuerza bruta sabiamente ritualizada.</p>
      <ul>
        <li><strong>Camino A:</strong> ${L(index, "actor-shizuku", "Shizuku")} pronuncia el nombre verdadero y sella la brecha.</li>
        <li><strong>Camino B:</strong> alguien acepta cargar con el hilo para arrancarlo de ${L(index, "npc-okiya", "Okiya")}.</li>
        <li><strong>Camino C:</strong> fuego, sal y violencia contra el ancla usando ${L(index, "item-fuego-sal", "fuego de sal") }.</li>
      </ul>
      <p>Sea cual sea el camino, el ${L(index, "bakemono-tsuchigumo", "Tsuchigumo")} debe quedar sin ancla antes del amanecer.</p>
    `) },
    { slug: "scene-amanecer", folderKey: "scenes", name: "Epílogo · El Amanecer de Shimokawa", content: journalHtml("El Amanecer de Shimokawa", `
      <p>La nieve deja de caer y la aldea respira por primera vez en semanas. El cierre depende de si ${L(index, "npc-okiya", "Okiya")} sobrevive, de cuánta Maldición han cargado los agentes y de qué han tenido que sacrificar.</p>
      <p><strong>Preguntas de cierre:</strong> ¿qué se llevan de Shimokawa?, ¿qué nombre no volverán a pronunciar?, ¿qué parte de Yomi se ha quedado prendida a cada uno?</p>
    `) },
    { slug: "guide-director", folderKey: "guide", name: "El Tejido de Yomi · Panel del Director", content: journalHtml("Panel del Director", `
      <p>Úsalo junto a la app integrada. Mantén visible el avance del tapiz, consulta ${L(index, "table-complicaciones", "la tabla de complicaciones")} cuando el ritmo decaiga y deja a mano ${L(index, "table-nombres", "los nombres verdaderos")}.</p>
      <p><strong>Ritmo recomendado:</strong> 10-15 min de prólogo, 40-50 min de investigación, 40-50 min para la casa de Okiya y 30-40 min de resolución.</p>
      <p><strong>Claves de tono:</strong> silencio, humedad, hilo, aceite viejo, frío impropio y conversaciones que parecen empezar antes de que alguien hable.</p>
    `) }
  ];
}


const SCENES = [
  { slug: "scene-prologo", name: "Prólogo · Santuario del camino", navName: "Yomi · Prólogo", img: p("images/scenes/00-santuario-camino.png"), journalSlug: "scene-prologo", playlistSlug: "playlist-prologo", note: "Entrega de las cenizas, mensaje del compañero adelantado y primera señal de que Shimokawa ya no está en calma." },
  { slug: "scene-shimokawa", name: "Acto I · Llegada a Shimokawa", navName: "Yomi · Shimokawa", img: p("images/scenes/01-shimokawa-llegada.png"), journalSlug: "journal-shimokawa", playlistSlug: "playlist-shimokawa", note: "La aldea nevada, el silencio imposible y el rastro de desapariciones." },
  { slug: "scene-jiro-kenji", name: "Acto I · Casa de Jiro y Kenji", navName: "Yomi · Jiro y Kenji", img: p("images/scenes/02-jiro-y-kenji.png"), journalSlug: "journal-casa-jiro", playlistSlug: "playlist-jiro-kenji", note: "Primer refugio, testimonios, llave de Okiya y miedo tangible." },
  { slug: "scene-santuario-invertido", name: "Acto I · Santuario invertido", navName: "Yomi · Santuario", img: p("images/scenes/03-santuario-invertido.png"), journalSlug: "journal-bosque-norte", playlistSlug: "playlist-santuario-invertido", note: "Cruce de umbral sobrenatural y señales de Yomi en el bosque." },
  { slug: "scene-pozo-nodo", name: "Acto I · Nodo físico del pozo y taller", navName: "Yomi · Nodo físico", img: p("images/scenes/04-pozo-y-sendero.png"), journalSlug: "journal-shimokawa", playlistSlug: "playlist-pozo-nodo", note: "Pista general para la investigación física del pueblo." },
  { slug: "scene-pozo-sendero", name: "Acto I · Pozo y sendero", navName: "Yomi · Pozo", img: p("images/scenes/04-pozo-y-sendero.png"), journalSlug: "journal-shimokawa", playlistSlug: "playlist-pozo-sendero", note: "El pozo, huellas truncadas y una salida que no lleva a ninguna parte." },
  { slug: "scene-taller-tenido", name: "Acto I · Taller de teñido", navName: "Yomi · Taller", img: p("images/scenes/05-taller-tenido.png"), journalSlug: "journal-shimokawa", playlistSlug: "playlist-taller-tenido", note: "Color, humedad y trabajo detenido justo antes del horror." },
  { slug: "scene-casa-okiya-umbral", name: "Acto II · Umbral de la casa de Okiya", navName: "Yomi · Umbral", img: p("images/scenes/06-casa-okiya-umbral.png"), journalSlug: "journal-casa-okiya", playlistSlug: "playlist-casa-okiya-umbral", note: "La casa ya no obedece a este mundo." },
  { slug: "scene-huso", name: "Acto II · Bajo el telar", navName: "Yomi · Huso", img: p("images/scenes/07-huso-bajo-telar.png"), journalSlug: "journal-tapiz-yomi", playlistSlug: "playlist-huso", note: "Descubrimiento del ancla y elección del precio a pagar." },
  { slug: "scene-okiya", name: "Acto II · Okiya y el Tsuchigumo", navName: "Yomi · Okiya", img: p("images/scenes/08-okiya-tsuchigumo.png"), journalSlug: "scene-okiya-habla", playlistSlug: "playlist-okiya", note: "Confrontación con Okiya, el tapiz y la voz del bakemono." },
  { slug: "scene-climax", name: "Acto III · Clímax general", navName: "Yomi · Clímax", img: p("images/scenes/08-okiya-tsuchigumo.png"), journalSlug: "scene-tapiz", playlistSlug: "playlist-climax", note: "Escena base para cualquiera de las resoluciones." },
  { slug: "scene-exorcismo", name: "Acto III · Exorcismo completo", navName: "Yomi · Exorcismo", img: p("images/scenes/09-exorcismo-completo.png"), journalSlug: "scene-tapiz", playlistSlug: "playlist-exorcismo", note: "Cierre ritual mediante el nombre verdadero." },
  { slug: "scene-purga", name: "Acto III · Purga brutal", navName: "Yomi · Purga", img: p("images/scenes/10-purga-brutal.png"), journalSlug: "scene-tapiz", playlistSlug: "playlist-purga", note: "Destrucción del ancla con violencia y fuego de sal." },
  { slug: "scene-sacrificio", name: "Acto III · Sacrificio de vínculo", navName: "Yomi · Sacrificio", img: p("images/scenes/11-sacrificio-vinculo.png"), journalSlug: "scene-tapiz", playlistSlug: "playlist-sacrificio", note: "Alguien carga el hilo para arrancarlo de Okiya." },
  { slug: "scene-negociacion", name: "Acto III · Negociación terrible", navName: "Yomi · Negociación", img: p("images/scenes/12-negociacion-terrible.png"), journalSlug: "scene-tapiz", playlistSlug: "playlist-negociacion", note: "La peor paz posible." },
  { slug: "scene-amanecer", name: "Epílogo · Amanecer en Shimokawa", navName: "Yomi · Amanecer", img: p("images/scenes/13-amanecer-shimokawa.png"), journalSlug: "scene-amanecer", playlistSlug: "playlist-amanecer", note: "Consecuencias, duelo y restos de Yomi." }
];

const PLAYLISTS = [
  { slug: "playlist-prologo", name: "Yomi · Prólogo", tracks: [p("audio/scenes/00-santuario-camino.mp3")] },
  { slug: "playlist-shimokawa", name: "Yomi · Llegada a Shimokawa", tracks: [p("audio/scenes/01-shimokawa-llegada.mp3")] },
  { slug: "playlist-jiro-kenji", name: "Yomi · Jiro y Kenji", tracks: [p("audio/scenes/02-jiro-y-kenji.mp3")] },
  { slug: "playlist-santuario-invertido", name: "Yomi · Santuario invertido", tracks: [p("audio/scenes/03-santuario-invertido.mp3")] },
  { slug: "playlist-pozo-nodo", name: "Yomi · Nodo físico", tracks: [p("audio/scenes/04-pozo-taller-nodo.mp3")] },
  { slug: "playlist-pozo-sendero", name: "Yomi · Pozo y sendero", tracks: [p("audio/scenes/05-pozo-y-sendero.mp3")] },
  { slug: "playlist-taller-tenido", name: "Yomi · Taller de teñido", tracks: [p("audio/scenes/06-taller-tenido.mp3")] },
  { slug: "playlist-casa-okiya-umbral", name: "Yomi · Umbral de Okiya", tracks: [p("audio/scenes/07-casa-okiya-umbral.mp3")] },
  { slug: "playlist-huso", name: "Yomi · Bajo el telar", tracks: [p("audio/scenes/08-huso-bajo-telar.mp3")] },
  { slug: "playlist-okiya", name: "Yomi · Okiya y Tsuchigumo", tracks: [p("audio/scenes/09-okiya-tsuchigumo.mp3")] },
  { slug: "playlist-climax", name: "Yomi · Clímax general", tracks: [p("audio/scenes/10-climax-general.mp3")] },
  { slug: "playlist-exorcismo", name: "Yomi · Exorcismo completo", tracks: [p("audio/scenes/11-exorcismo-completo.mp3")] },
  { slug: "playlist-purga", name: "Yomi · Purga brutal", tracks: [p("audio/scenes/12-purga-brutal.mp3")] },
  { slug: "playlist-sacrificio", name: "Yomi · Sacrificio de vínculo", tracks: [p("audio/scenes/13-sacrificio-vinculo.mp3")] },
  { slug: "playlist-negociacion", name: "Yomi · Negociación terrible", tracks: [p("audio/scenes/14-negociacion-terrible.mp3")] },
  { slug: "playlist-amanecer", name: "Yomi · Amanecer", tracks: [p("audio/scenes/15-amanecer-shimokawa.mp3")] }
];

const HANDOUTS = [
  { slug: "handout-mapa-shimokawa-croquis", name: "Mapa · Shimokawa (croquis)", img: p("images/tools/mapa-shimokawa-croquis.png"), text: "Croquis rápido de investigación para el Director." },
  { slug: "handout-mapa-shimokawa-general", name: "Mapa · Shimokawa (general)", img: p("images/tools/mapa-shimokawa-general.png"), text: "Vista general de la aldea y sus accesos." },
  { slug: "handout-mapa-casa-jiro", name: "Mapa · Casa de Jiro y Kenji", img: p("images/tools/mapa-casa-jiro-kenji.png"), text: "Plano rápido del refugio de Jiro y Kenji." },
  { slug: "handout-mapa-casa-okiya", name: "Mapa · Casa de Okiya", img: p("images/tools/mapa-casa-okiya.png"), text: "Plano de apoyo para la exploración de la casa de Okiya." }
];

async function ensurePlaylist({ name, folder, slug, tracks }) {
  let playlist = game.playlists.find(p => p.name === name && ((p.folder?.id ?? null) === (folder?.id ?? null)));
  const sounds = tracks.map((path, i) => ({ name: `${name} · ${i + 1}`, path, repeat: false, playing: false, pausedTime: null, volume: 0.5, sort: i * 10 }));
  if (!playlist) {
    playlist = await Playlist.create({ name, folder: folder?.id ?? null, mode: CONST.PLAYLIST_MODES.SEQUENTIAL, sorting: CONST.PLAYLIST_SORT_MODES.MANUAL, sounds, flags: { ...flagData(slug), "ocho-lanzas": { ...(flagData(slug)["ocho-lanzas"] || {}), tejidoPlaylist: true } } });
  } else if (!playlist.sounds.size) {
    await playlist.createEmbeddedDocuments("PlaylistSound", sounds);
  }
  return playlist;
}

async function ensureScene({ name, folder, slug, navName, img, journal, playlist, note }) {
  let scene = game.scenes.find(s => s.name === name && ((s.folder?.id ?? null) === (folder?.id ?? null)));
  const data = {
    name,
    navName,
    folder: folder?.id ?? null,
    background: { src: img },
    width: 1920,
    height: 1080,
    padding: 0.05,
    tokenVision: false,
    grid: { type: CONST.GRID_TYPES.GRIDLESS, size: 100, distance: 1, units: "" },
    notes: journal ? [{ x: 140, y: 140, entryId: journal.id, icon: 'icons/svg/book.svg', iconSize: 48, text: note || journal.name, fontSize: 20, textAnchor: CONST.TEXT_ANCHOR_POINTS.CENTER }] : [],
    flags: { ...flagData(slug), "ocho-lanzas": { ...(flagData(slug)["ocho-lanzas"] || {}), tejidoPlaylistUuid: playlist?.uuid ?? null } }
  };
  if (!scene) scene = await Scene.create(data);
  return scene;
}

async function makeMacro(folder, slug, name, command) {
  return ensureDoc({ collection: game.macros, type: "Macro", name, folder, slug, createData: { type: "script", img: ICONS.macro, command } });
}

export async function seedTejidoDeYomiWorld({ force = false, notify = false } = {}) {
  if (!game.user.isGM) return false;
  if (!force && currentSeedVersion() === DATA_VERSION) return false;

  const rootActor = await ensureFolder({ name: "El Tejido de Yomi · Actores", type: "Actor", color: "#8b1a1a" });
  const rootItem = await ensureFolder({ name: "El Tejido de Yomi · Objetos", type: "Item", color: "#8b1a1a" });
  const rootJournal = await ensureFolder({ name: "El Tejido de Yomi · Diario", type: "JournalEntry", color: "#8b1a1a" });
  const rootTable = await ensureFolder({ name: "El Tejido de Yomi · Tablas", type: "RollTable", color: "#8b1a1a" });
  const rootMacro = await ensureFolder({ name: "El Tejido de Yomi · Macros", type: "Macro", color: "#8b1a1a" });
  const rootScene = await ensureFolder({ name: "El Tejido de Yomi · Escenas", type: "Scene", color: "#8b1a1a" });
  const rootPlaylist = await ensureFolder({ name: "El Tejido de Yomi · Playlists", type: "Playlist", color: "#8b1a1a" });

  const folders = {
    agents: await ensureFolder({ name: "Agentes", type: "Actor", parent: rootActor }),
    npcs: await ensureFolder({ name: "PNJ", type: "Actor", parent: rootActor }),
    bakemono: await ensureFolder({ name: "Bakemono", type: "Actor", parent: rootActor }),
    locations: await ensureFolder({ name: "Localizaciones", type: "JournalEntry", parent: rootJournal }),
    scenes: await ensureFolder({ name: "Escenas", type: "JournalEntry", parent: rootJournal }),
    guide: await ensureFolder({ name: "Guías", type: "JournalEntry", parent: rootJournal }),
    handouts: await ensureFolder({ name: "Mapas y ayudas", type: "JournalEntry", parent: rootJournal })
  };

  const index = {};
  for (const itemData of WORLD_ITEMS) {
    const item = await ensureDoc({ collection: game.items, type: "Item", name: itemData.name, folder: rootItem, slug: itemData.slug, createData: { type: itemData.type, img: itemData.img, system: itemData.system } });
    index[itemData.slug] = { uuid: item.uuid, name: item.name, type: "Item" };
  }

  for (const actorData of ACTORS) {
    const actor = await ensureDoc({ collection: game.actors, type: "Actor", name: actorData.name, folder: folders[actorData.folderKey], slug: actorData.slug, createData: { type: actorData.type, img: actorData.img, prototypeToken: actorToken(actorData.img), system: actorData.system } });
    await embedItems(actor, actorData.items || []);
    index[actorData.slug] = { uuid: actor.uuid, name: actor.name, type: "Actor" };
  }

  const openMacro = await makeMacro(rootMacro, "macro-open-yomi", "Abrir El Tejido de Yomi", "game.ochoLanzas?.openTejidoDeYomi?.();");
  index["macro-open-yomi"] = { uuid: openMacro.uuid, name: openMacro.name, type: "Macro" };
  const reseedMacro = await makeMacro(rootMacro, "macro-reseed-yomi", "Reparar / Reimportar El Tejido de Yomi", "await game.ochoLanzas?.seedTejidoDeYomi?.({ force: true, notify: true });");
  index["macro-reseed-yomi"] = { uuid: reseedMacro.uuid, name: reseedMacro.name, type: "Macro" };

  for (const tableData of makeTables()) {
    const table = await ensureDoc({ collection: game.tables, type: "RollTable", name: tableData.name, folder: rootTable, slug: tableData.slug, createData: { description: tableData.description, formula: tableData.formula, replacement: true, displayRoll: true, results: tableData.results.map((text, i) => ({ type: CONST.TABLE_RESULT_TYPES.TEXT, text, weight: 1, range: [i + 1, i + 1], drawn: false, img: ICONS.complication })) } });
    index[tableData.slug] = { uuid: table.uuid, name: table.name, type: "RollTable" };
  }

  for (const journalData of makeJournals(index)) {
    const journal = await ensureDoc({ collection: game.journal, type: "JournalEntry", name: journalData.name, folder: folders[journalData.folderKey], slug: journalData.slug, createData: { pages: pageData(journalData.name, journalData.content) } });
    index[journalData.slug] = { uuid: journal.uuid, name: journal.name, type: "JournalEntry" };
  }



  for (const handout of HANDOUTS) {
    const journal = await ensureDoc({ collection: game.journal, type: "JournalEntry", name: handout.name, folder: folders.handouts, slug: handout.slug, createData: { pages: [
      { name: handout.name, type: "image", src: handout.img, title: { show: true, level: 1 }, image: { caption: handout.text } },
      { name: `${handout.name} · Texto`, type: "text", title: { show: true, level: 2 }, text: { format: 1, content: `<p>${handout.text}</p><p><em>${handout.img}</em></p>` } }
    ] } });
    index[handout.slug] = { uuid: journal.uuid, name: journal.name, type: "JournalEntry" };
  }

  const playlistsBySlug = {};
  for (const playlistData of PLAYLISTS) {
    const playlist = await ensurePlaylist({ name: playlistData.name, folder: rootPlaylist, slug: playlistData.slug, tracks: playlistData.tracks });
    playlistsBySlug[playlistData.slug] = playlist;
    index[playlistData.slug] = { uuid: playlist.uuid, name: playlist.name, type: "Playlist" };
  }

  for (const sceneData of SCENES) {
    const journalUuid = index[sceneData.journalSlug]?.uuid;
    const journal = journalUuid ? await fromUuid(journalUuid).catch(() => null) : null;
    const scene = await ensureScene({ name: sceneData.name, folder: rootScene, slug: sceneData.slug, navName: sceneData.navName, img: sceneData.img, journal, playlist: playlistsBySlug[sceneData.playlistSlug], note: sceneData.note });
    index[sceneData.slug] = { uuid: scene.uuid, name: scene.name, type: "Scene" };
  }

  await setTejidoDocIndex(index);
  await game.settings.set("ocho-lanzas", "tejidoDeYomiSeededVersion", DATA_VERSION);
  if (notify) ui.notifications.info(game.i18n?.localize?.("OCHO.Yomi.InstallDone") || "El world ha sido preparado con todo el contenido de El Tejido de Yomi.");
  return true;
}

export async function maybeSeedTejidoDeYomiWorld() {
  game.ochoLanzas ??= {};
  game.ochoLanzas.seedTejidoDeYomi = (opts = {}) => seedTejidoDeYomiWorld(opts);
  game.ochoLanzas.promptInstallTejidoDeYomi = (opts = {}) => promptInstallTejidoDeYomiWorld(opts);
  if (!game.user.isGM) return false;
  if (isStarterWorld()) return seedTejidoDeYomiWorld({ force: false, notify: true });
  if (currentSeedVersion()) return false;
  if (installPromptDismissed()) return false;
  return promptInstallForEmptyWorld();
}
