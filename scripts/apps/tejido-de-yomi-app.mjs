import { maybeSeedTejidoDeYomiWorld, getTejidoDocIndex, promptInstallTejidoDeYomiWorld } from "./tejido-de-yomi-seed.mjs";
import { applySavedWindowOptions, persistWindowGeometry, flushWindowGeometry } from "../ui/window-state.mjs";
import { ApplicationV1 } from "../compat/foundry-compat.mjs";

const ADVENTURE_URL = "systems/ocho-lanzas/assets/adventures/el_tejido_de_yomi.html";

export class OchoLanzasTejidoDeYomiApp extends ApplicationV1 {
  constructor(options = {}) { super(applySavedWindowOptions("yomiDirector", options)); }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ocho-lanzas-tejido-de-yomi",
      template: "systems/ocho-lanzas/templates/apps/tejido-de-yomi.hbs",
      classes: ["ocho-lanzas", "ol-yomi-shell-app"],
      popOut: true,
      resizable: true,
      minimizable: true,
      width: 1420,
      height: 920,
      title: game?.i18n?.localize?.("OCHO.Yomi.Title") || "El Tejido de Yomi"
    });
  }

  async getData() {
    return { htmlPath: ADVENTURE_URL, title: game.i18n.localize("OCHO.Yomi.Title"), isGM: game.user?.isGM };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='reload']").on("click", () => this.reloadAdventure());
    html.find("[data-action='seedWorld']").on("click", async () => {
      await promptInstallTejidoDeYomiWorld({ force: true });
      this.reloadAdventure();
    });
  }

  setPosition(options = {}) {
    const position = super.setPosition(options);
    if (this.rendered) persistWindowGeometry(this, "yomiDirector");
    return position;
  }

  async close(options = {}) {
    await flushWindowGeometry(this, "yomiDirector");
    return super.close(options);
  }

  get frameElement() { return this.element?.find?.(".ol-yomi-frame")?.get?.(0) ?? null; }
  reloadAdventure() {
    const frame = this.frameElement;
    if (frame?.contentWindow?.location) frame.contentWindow.location.reload();
  }

  static open(options = {}) {
    if (!game.user?.isGM) {
      ui.notifications?.warn?.(game.i18n.localize("OCHO.Yomi.GMOnly"));
      return null;
    }
    game.ochoLanzas ??= {};
    game.ochoLanzas.apps ??= {};
    const existing = game.ochoLanzas.apps.tejidoDeYomi;
    if (existing?.rendered) {
      existing.render(true, options);
      existing.bringToTop?.();
      return existing;
    }
    const app = new OchoLanzasTejidoDeYomiApp(options);
    game.ochoLanzas.apps.tejidoDeYomi = app;
    app.render(true);
    return app;
  }
}

async function openByUuid(uuid) {
  if (!uuid) return false;
  const doc = await fromUuid(uuid).catch(() => null);
  if (!doc) return false;
  if (doc.documentName === "Macro") return doc.execute();
  if (doc.documentName === "Scene") return doc.view();
  doc.sheet?.render?.(true);
  return true;
}

async function syncTejidoScenePlaylist(scene) {
  if (!game.user?.isGM || !scene) return false;
  const playlistUuid = scene.getFlag("ocho-lanzas", "tejidoPlaylistUuid");
  if (!playlistUuid) return false;
  const target = await fromUuid(playlistUuid).catch(() => null);
  if (!target) return false;
  const tagged = game.playlists.filter((p) => p.getFlag("ocho-lanzas", "tejidoPlaylist"));
  for (const playlist of tagged) {
    const shouldPlay = playlist.id === target.id;
    const isPlaying = playlist.sounds.some((s) => s.playing);
    if (shouldPlay && !isPlaying) await playlist.playAll().catch(() => {});
    if (!shouldPlay && isPlaying) await playlist.stopAll().catch(() => {});
  }
  return true;
}

export function registerTejidoDeYomiIntegration() {
  game.ochoLanzas ??= {};
  game.ochoLanzas.apps ??= {};
  game.ochoLanzas.openTejidoDeYomi = () => OchoLanzasTejidoDeYomiApp.open();
  game.ochoLanzas.promptInstallTejidoDeYomi = (opts = {}) => promptInstallTejidoDeYomiWorld(opts);
  game.ochoLanzas.openTejidoLink = async (slug) => {
    const uuid = getTejidoDocIndex()?.[slug]?.uuid ?? null;
    if (!uuid) {
      ui.notifications?.warn?.(game.i18n.format("OCHO.Yomi.MissingElement", { slug }));
      return false;
    }
    return openByUuid(uuid);
  };

  Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user?.isGM || !controls || typeof controls !== "object") return;

    // Foundry V13 and V14 both expose Scene controls as Record<string, SceneControl>.
    // Keep a single unobtrusive system entry in the existing Token controls;
    // Yomi remains optional and is reached from the Ocho Lanzas welcome window.
    const tokenControl = controls.tokens;
    if (!tokenControl?.tools || tokenControl.tools["ocho-lanzas"]) return;

    tokenControl.tools["ocho-lanzas"] = {
      name: "ocho-lanzas",
      title: game.i18n.localize("OCHO.Welcome.Open"),
      icon: "fa-solid fa-torii-gate",
      order: Object.keys(tokenControl.tools).length,
      button: true,
      visible: true,
      onChange: () => game.ochoLanzas?.openWelcome?.()
    };
  });

  Hooks.on("canvasReady", () => syncTejidoScenePlaylist(canvas?.scene));
  Hooks.once("ready", async () => { await maybeSeedTejidoDeYomiWorld(); });
}