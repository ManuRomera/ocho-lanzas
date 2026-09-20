import { loadTemplates } from "./compat/foundry-compat.mjs";
export function registerHelpers() {
  Handlebars.registerHelper("olChecked", function (collection, value) {
    if (collection instanceof Set) return collection.has(value) ? "checked" : "";
    if (Array.isArray(collection)) return collection.includes(value) ? "checked" : "";
    return "";
  });
  Handlebars.registerHelper("olPipClass", function (count, n) {
    return Number(count ?? 0) >= Number(n ?? 0) ? "filled" : "";
  });
}

export async function preloadTemplates() {
  return loadTemplates([
    "systems/ocho-lanzas/templates/actors/character.hbs",
    "systems/ocho-lanzas/templates/actors/npc.hbs",
    "systems/ocho-lanzas/templates/actors/bakemono.hbs",
    "systems/ocho-lanzas/templates/items/item.hbs",
    "systems/ocho-lanzas/templates/dialogs/roll-dialog.hbs",
    "systems/ocho-lanzas/templates/dialogs/purify-dialog.hbs",
    "systems/ocho-lanzas/templates/chat/roll-card.hbs",
    "systems/ocho-lanzas/templates/chat/curse-card.hbs",
    "systems/ocho-lanzas/templates/chat/purify-card.hbs",
    "systems/ocho-lanzas/templates/apps/tejido-de-yomi.hbs",
    "systems/ocho-lanzas/templates/apps/welcome.hbs"
  ]);
}

function setting(key, data) {
  game.settings.register("ocho-lanzas", key, { config: false, ...data });
}

export function registerSettings() {
  setting("windowLayout", { name: "Disposición de ventanas", scope: "client", type: String, default: "" });
  setting("welcomeSeenVersion", { name: "Versión de bienvenida vista", scope: "client", type: String, default: "" });
  setting("systemDataVersion", { name: "Versión de datos Ocho Lanzas", scope: "world", type: String, default: "" });

  // Kept for one migration cycle so existing client/world preferences continue safely.
  setting("tejidoDeYomiWindow", { name: "Ventana El Tejido de Yomi (legado)", scope: "client", type: String, default: "" });
  setting("tejidoDeYomiSeededVersion", { name: "Versión de datos El Tejido de Yomi", scope: "world", type: String, default: "" });
  setting("tejidoDeYomiDocIndex", { name: "Índice El Tejido de Yomi", scope: "world", type: String, default: "{}" });
  setting("tejidoDeYomiInstallPromptDismissed", { name: "Preferencia de instalación Yomi (legado)", scope: "world", type: Boolean, default: false });
}