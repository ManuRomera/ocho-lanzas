import { applySavedWindowOptions, persistWindowGeometry, flushWindowGeometry, resetWindowLayout } from "../ui/window-state.mjs";
import { ApplicationV1, dialogV2 } from "../compat/foundry-compat.mjs";

const WELCOME_VERSION = "0.6";

async function createActorOfType(type) {
  try {
    const doc = await Actor.createDialog({}, {}, { types: [type] });
    if (doc?.sheet) doc.sheet.render(true);
    return doc;
  } catch (_err) {
    const fallbackNames = {
      character: game.i18n.localize("TYPES.Actor.character"),
      npc: game.i18n.localize("TYPES.Actor.npc"),
      bakemono: game.i18n.localize("TYPES.Actor.bakemono")
    };
    const doc = await Actor.create({ name: fallbackNames[type] || "Nuevo actor", type });
    doc?.sheet?.render?.(true);
    return doc;
  }
}

export class OchoLanzasWelcomeApp extends ApplicationV1 {
  constructor(options = {}) {
    super(applySavedWindowOptions("welcome", options));
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ocho-lanzas-welcome",
      template: "systems/ocho-lanzas/templates/apps/welcome.hbs",
      classes: ["ocho-lanzas", "ol-welcome-app"],
      popOut: true,
      resizable: true,
      minimizable: true,
      width: 760,
      height: 640,
      title: "Ocho Lanzas"
    });
  }

  async getData() {
    return {
      isGM: game.user?.isGM,
      version: game.system.version
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find("[data-action='create-character']").on("click", () => createActorOfType("character"));
    html.find("[data-action='create-npc']").on("click", () => createActorOfType("npc"));
    html.find("[data-action='create-bakemono']").on("click", () => createActorOfType("bakemono"));
    html.find("[data-action='open-yomi']").on("click", () => game.ochoLanzas?.openTejidoDeYomi?.());
    html.find("[data-action='prepare-yomi']").on("click", () => game.ochoLanzas?.promptInstallTejidoDeYomi?.({ force: true }));
    html.find("[data-action='reset-layout']").on("click", async () => {
      const yes = await dialogV2().confirm({
        window: { title: game.i18n.localize("OCHO.Config.WindowLayoutReset") },
        content: `<p>${game.i18n.localize("OCHO.Config.WindowLayoutResetConfirm")}</p>`,
        rejectClose: false
      });
      if (yes) await resetWindowLayout();
    });
  }

  setPosition(options = {}) {
    const pos = super.setPosition(options);
    if (this.rendered) persistWindowGeometry(this, "welcome");
    return pos;
  }

  async close(options = {}) {
    await game.settings.set("ocho-lanzas", "welcomeSeenVersion", WELCOME_VERSION).catch(() => {});
    await flushWindowGeometry(this, "welcome");
    return super.close(options);
  }

  static open(options = {}) {
    game.ochoLanzas ??= {};
    game.ochoLanzas.apps ??= {};
    const existing = game.ochoLanzas.apps.welcome;
    if (existing?.rendered) {
      existing.render(true, options);
      existing.bringToTop?.();
      return existing;
    }
    const app = new OchoLanzasWelcomeApp(options);
    game.ochoLanzas.apps.welcome = app;
    app.render(true);
    return app;
  }
}

export function registerWelcomeIntegration() {
  game.ochoLanzas ??= {};
  game.ochoLanzas.openWelcome = (options = {}) => OchoLanzasWelcomeApp.open(options);
}

export function maybeShowWelcome() {
  if (!game.user) return;
  const seen = String(game.settings.get("ocho-lanzas", "welcomeSeenVersion") ?? "");
  if (seen !== WELCOME_VERSION) OchoLanzasWelcomeApp.open();
}