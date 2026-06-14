import { maybeSeedTejidoDeYomiWorld, seedTejidoDeYomiWorld, getTejidoDocIndex, promptInstallTejidoDeYomiWorld } from "./tejido-de-yomi-seed.mjs";

function parseWindowSetting() {
  try {
    const raw = game.settings.get("ocho-lanzas", "tejidoDeYomiWindow");
    if (!raw) return {};
    const data = JSON.parse(raw);
    return typeof data === "object" && data ? data : {};
  } catch (_err) {
    return {};
  }
}
function persistWindowSetting(app) {
  try {
    const pos = app.position ?? {};
    game.settings.set("ocho-lanzas", "tejidoDeYomiWindow", JSON.stringify({ left: pos.left, top: pos.top, width: pos.width, height: pos.height }));
  } catch (_err) {}
}
function getAdventureUrl() {
  return "systems/ocho-lanzas/el_tejido_de_yomi_pack_v10/el_tejido_de_yomi_rehecho_v10.html";
}
function makeSidebarButton({ cls, icon, label, onClick }) {
  const button = $(`<button type="button" class="${cls} ol-yomi-tool"><i class="${icon}"></i><span>${label}</span></button>`);
  button.on("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.();
  });
  return button;
}
function injectSidebarButtons(html, placement = "append") {
  if (!html?.find) return;
  if (!html.find(".ol-yomi-launcher").length) {
    const openBtn = makeSidebarButton({
      cls: "ol-yomi-launcher",
      icon: "fa-solid fa-scroll",
      label: game.i18n.localize("OCHO.Yomi.Open"),
      onClick: () => OchoLanzasTejidoDeYomiApp.open()
    });
    if (placement === "prepend") html.prepend(openBtn); else html.append(openBtn);
  }
  if (game.user?.isGM && !html.find(".ol-yomi-installer").length) {
    const installBtn = makeSidebarButton({
      cls: "ol-yomi-installer",
      icon: "fa-solid fa-box-open",
      label: game.i18n.localize("OCHO.Yomi.Install"),
      onClick: () => promptInstallTejidoDeYomiWorld({ force: true, dismiss: false })
    });
    if (placement === "prepend") html.prepend(installBtn); else html.append(installBtn);
  }
}

export class OchoLanzasTejidoDeYomiApp extends Application {
  constructor(options = {}) {
    const saved = parseWindowSetting();
    super(foundry.utils.mergeObject({ left: saved.left, top: saved.top, width: saved.width, height: saved.height }, options));
  }
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
  async getData(_options = {}) {
    return { htmlPath: getAdventureUrl(), title: game.i18n.localize("OCHO.Yomi.Title"), isGM: game.user.isGM };
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='reload']").on("click", () => this.reloadAdventure());
    html.find("[data-action='openExternal']").on("click", () => this.openExternal());
    html.find("[data-action='resetState']").on("click", () => this.resetAdventureState());
    html.find("[data-action='seedWorld']").on("click", async () => {
      await promptInstallTejidoDeYomiWorld({ force: true, dismiss: false });
      this.reloadAdventure();
    });
  }
  async render(force = false, options = {}) { return super.render(force, foundry.utils.mergeObject(parseWindowSetting(), options)); }
  setPosition(options = {}) { const position = super.setPosition(options); if (this.rendered) persistWindowSetting(this); return position; }
  async close(options = {}) { persistWindowSetting(this); return super.close(options); }
  get frameElement() { return this.element?.find?.('.ol-yomi-frame')?.get?.(0) ?? null; }
  reloadAdventure() { const frame = this.frameElement; if (frame?.contentWindow?.location) frame.contentWindow.location.reload(); }
  openExternal() { window.open(getAdventureUrl(), '_blank', 'noopener,noreferrer'); }
  async resetAdventureState() {
    const confirmed = await Dialog.confirm({ title: game.i18n.localize("OCHO.Yomi.ResetTitle"), content: `<p>${game.i18n.localize("OCHO.Yomi.ResetBody")}</p>` });
    if (!confirmed) return;
    const storageKey = `ocho-lanzas.tejido-yomi.${game.world.id}`;
    try { localStorage.removeItem(storageKey); } catch (_err) {}
    ui.notifications.info(game.i18n.localize("OCHO.Yomi.ResetDone"));
    this.reloadAdventure();
  }
  static open(options = {}) {
    game.ochoLanzas ??= {}; game.ochoLanzas.apps ??= {};
    const existing = game.ochoLanzas.apps.tejidoDeYomi;
    if (existing?.rendered) { existing.render(true, options); existing.bringToTop(); return existing; }
    const app = new OchoLanzasTejidoDeYomiApp(options);
    game.ochoLanzas.apps.tejidoDeYomi = app; app.render(true); return app;
  }
}

async function openByUuid(uuid) {
  if (!uuid) return false;
  const doc = await fromUuid(uuid).catch(() => null);
  if (!doc) return false;
  if (doc.documentName === "Macro") return doc.execute();
  if (doc.documentName === "Scene") return doc.view();
  if (doc.documentName === "Playlist") { doc.sheet?.render?.(true); return true; }
  doc.sheet?.render?.(true);
  return true;
}



async function syncTejidoScenePlaylist(scene) {
  if (!game.user?.isGM || !scene) return false;
  const playlistUuid = scene.getFlag("ocho-lanzas", "tejidoPlaylistUuid");
  if (!playlistUuid) return false;
  const target = await fromUuid(playlistUuid).catch(() => null);
  if (!target) return false;
  const tagged = game.playlists.filter(p => p.getFlag("ocho-lanzas", "tejidoPlaylist"));
  for (const playlist of tagged) {
    const shouldPlay = playlist.id === target.id;
    const isPlaying = playlist.sounds.some(s => s.playing);
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
    const index = getTejidoDocIndex();
    const uuid = index?.[slug]?.uuid ?? null;
    if (!uuid) {
      ui.notifications.warn(`No se ha encontrado el elemento '${slug}' en el world.`);
      return false;
    }
    return openByUuid(uuid);
  };
  Hooks.on("getSceneControlButtons", (controls) => {
    if (controls.some(c => c.name === "ocho-lanzas-yomi")) return;
    controls.push({ name: "ocho-lanzas-yomi", title: game.i18n.localize("OCHO.Yomi.Title"), icon: "fa-solid fa-scroll", layer: "controls", visible: true, tools: [{ name: "open-yomi", title: game.i18n.localize("OCHO.Yomi.Open"), icon: "fa-solid fa-scroll", button: true, visible: true, onClick: () => OchoLanzasTejidoDeYomiApp.open() }], activeTool: "open-yomi" });
  });
  Hooks.on("renderSidebarTab", (app, html) => {
    const tabName = app?.tabName;
    if (tabName === "settings") {
      const target = html.find(".settings-list, #client-settings, .tab").first();
      if (target.length) injectSidebarButtons(target, "prepend"); else injectSidebarButtons(html, "prepend");
    }
    if (["journal","scenes","actors","tables","macros","compendium"].includes(tabName)) {
      const header = html.find(".directory-header .header-actions, .directory-header").first();
      if (header.length) injectSidebarButtons(header, "append");
    }
  });
  Hooks.on("canvasReady", () => syncTejidoScenePlaylist(canvas?.scene));
  Hooks.once("ready", async () => { await maybeSeedTejidoDeYomiWorld(); });
}
