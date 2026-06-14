export function registerHelpers() {
  Handlebars.registerHelper("olChecked", function (collection, value) {
    if (collection instanceof Set) return collection.has(value) ? "checked" : "";
    if (Array.isArray(collection)) return collection.includes(value) ? "checked" : "";
    return "";
  });

  // Curse pips helper
  Handlebars.registerHelper("olPipClass", function (count, n) {
    const c = Number(count ?? 0);
    const v = Number(n ?? 0);
    return c >= v ? "filled" : "";
  });
}

export async function preloadTemplates() {
  const loadTemplates = foundry.applications.handlebars.loadTemplates;
  return loadTemplates([
    "systems/ocho-lanzas/templates/actors/character.hbs",
    "systems/ocho-lanzas/templates/actors/npc.hbs",
    "systems/ocho-lanzas/templates/items/item.hbs",
    "systems/ocho-lanzas/templates/dialogs/roll-dialog.hbs",
    "systems/ocho-lanzas/templates/dialogs/purify-dialog.hbs",
    "systems/ocho-lanzas/templates/chat/roll-card.hbs",
    "systems/ocho-lanzas/templates/chat/curse-card.hbs",
    "systems/ocho-lanzas/templates/chat/purify-card.hbs",
    "systems/ocho-lanzas/templates/apps/tejido-de-yomi.hbs"
  ]);
}


export function registerSettings() {
  game.settings.register("ocho-lanzas", "tejidoDeYomiWindow", {
    name: "Ventana El Tejido de Yomi",
    scope: "client",
    config: false,
    type: String,
    default: ""
  });
  game.settings.register("ocho-lanzas", "tejidoDeYomiSeededVersion", {
    name: "Seed version Tejido de Yomi",
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
  game.settings.register("ocho-lanzas", "tejidoDeYomiDocIndex", {
    name: "Índice Tejido de Yomi",
    scope: "world",
    config: false,
    type: String,
    default: "{}"
  });
  game.settings.register("ocho-lanzas", "tejidoDeYomiInstallPromptDismissed", {
    name: "No volver a mostrar la sugerencia de instalación de El Tejido de Yomi",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });
}
