import { ActorSheetV1, dialogV2 } from "../compat/foundry-compat.mjs";
import { OPTIONS_BACKGROUND, OPTIONS_PRIDE, OPTIONS_ONMYOUJI } from "../workflows/static-options.mjs";
import { bindContextInfo, closeContextInfo } from "../ui/context-info.mjs";
import { applySavedWindowOptions, persistWindowGeometry, flushWindowGeometry } from "../ui/window-state.mjs";

function localizeOption(option) {
  return { ...option, label: game.i18n.localize(option.labelKey), description: game.i18n.localize(option.tooltipKey) };
}

function selectedOptions(options, selection) {
  const values = new Set(Array.from(selection ?? []).map(String));
  return options.filter((o) => values.has(String(o.value))).map(localizeOption);
}

function plainText(value) {
  const div = document.createElement("div");
  div.innerHTML = String(value ?? "");
  return (div.textContent || div.innerText || "").trim();
}

function itemView(item) {
  const tags = item.system?.tags instanceof Set ? Array.from(item.system.tags) : (Array.isArray(item.system?.tags) ? item.system.tags : []);
  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    img: item.img,
    type: item.type,
    typeLabel: game.i18n.localize(`TYPES.Item.${item.type}`) || item.type,
    tags,
    tagsText: tags.join(" · "),
    descriptionText: plainText(item.system?.description),
    quantity: Number(item.system?.quantity ?? 1),
    equipped: Boolean(item.system?.equipped)
  };
}

async function confirmDeleteItem(item) {
  return dialogV2().confirm({
    window: { title: game.i18n.localize("OCHO.Items.Delete") },
    content: `<p>${game.i18n.format("OCHO.Items.DeleteConfirm", { name: item.name })}</p>`,
    rejectClose: false
  });
}

class OchoLanzasActorSheetBase extends ActorSheetV1 {
  static windowStateKey = "actorSheet";

  constructor(actor, options = {}) {
    const key = new.target.windowStateKey ?? "actorSheet";
    super(actor, applySavedWindowOptions(key, options));
    this._editingTraits = false;
  }

  setPosition(options = {}) {
    const position = super.setPosition(options);
    if (this.rendered) persistWindowGeometry(this, this.constructor.windowStateKey);
    return position;
  }

  async close(options = {}) {
    closeContextInfo();
    await flushWindowGeometry(this, this.constructor.windowStateKey);
    return super.close(options);
  }

  async getData(options = {}) {
    const data = await super.getData(options);
    const actor = this.actor;
    const system = actor.system ?? {};
    data.document = actor;
    data.system = system;
    data.isGM = Boolean(game.user?.isGM);
    data.canEditDocument = Boolean(actor.isOwner || game.user?.isGM);

    const curMin = system.curseMin ?? 1;
    const cur = Math.max(curMin, system.curseCount ?? 1);
    data.curseMin = curMin;
    data.curseCount = cur;
    data.cursePips = Array.from({ length: 6 }, (_, i) => {
      const n = i + 1;
      const filled = cur >= n;
      const permanent = n <= curMin;
      const bakemono = n === 6 && cur >= 6;
      const state = bakemono ? "bakemono" : permanent ? "permanent" : filled ? "active" : "empty";
      return {
        i, n, state,
        cls: [filled ? "filled" : "", permanent ? "permanent" : "", bakemono ? "is-bakemono" : ""].filter(Boolean).join(" "),
        aria: game.i18n.format("OCHO.Curse.PipAria", { level: n, state: game.i18n.localize(`OCHO.Curse.State.${state}`) })
      };
    });
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    bindContextInfo(html);
    html.find("[data-action='rollAction']").on("click", () => this.actor.rollRisk?.());
    html.find("img.profile-img").on("click", (ev) => this._onEditImage(ev));

    if (game.user?.isGM) {
      html.find("[data-action='curseInc']").on("click", () => this._adjustCurse(1));
      html.find("[data-action='curseDec']").on("click", () => this._adjustCurse(-1));
      html.find("[data-action='curseReset']").on("click", () => this._resetCurse());
    }
  }

  async _adjustCurse(delta) {
    const min = this.actor.system.curseMin ?? 1;
    const cur = Math.max(min, this.actor.system.curseCount ?? min);
    await this.actor.update({ "system.curseCount": Math.max(min, Math.min(6, cur + delta)) });
  }

  async _resetCurse() {
    const min = this.actor.system.curseMin ?? 1;
    await this.actor.update({ "system.curseCount": min });
    ui.notifications?.info?.(game.i18n.format("OCHO.Chat.CurseReset", { value: min }));
  }

  _activateAutoGrow(html) {
    const grow = (el) => {
      if (!el) return;
      const max = Math.max(96, Number(el.dataset.autogrowMax || 260));
      el.style.height = "auto";
      const height = Math.min(Math.max(el.scrollHeight, 48), max);
      el.style.height = `${height}px`;
      el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
    };
    html.find("textarea.ol-autogrow").each((_, el) => {
      grow(el);
      el.addEventListener("input", () => grow(el));
    });
  }
}

export class OchoLanzasCharacterSheet extends OchoLanzasActorSheetBase {
  static windowStateKey = "characterSheet";

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ocho-lanzas", "sheet", "actor", "character"],
      width: 1060,
      height: 780,
      resizable: true,
      submitOnClose: true,
      submitOnChange: true,
      dragDrop: [{ dragSelector: ".ol-item-row", dropSelector: ".ol-character-sheet" }]
    });
  }

  get template() { return "systems/ocho-lanzas/templates/actors/character.hbs"; }

  async getData(options = {}) {
    const data = await super.getData(options);
    const actor = this.actor;
    const system = actor.system ?? {};
    const backgrounds = selectedOptions(OPTIONS_BACKGROUND, system.backgrounds);
    const prides = selectedOptions(OPTIONS_PRIDE, system.prides);
    const onmyoujis = selectedOptions(OPTIONS_ONMYOUJI, system.onmyoujis);
    const hasTraits = backgrounds.length + prides.length + onmyoujis.length > 0;

    data.backgroundOptions = OPTIONS_BACKGROUND.map(localizeOption);
    data.prideOptions = OPTIONS_PRIDE.map(localizeOption);
    data.onmyoujiOptions = OPTIONS_ONMYOUJI.map(localizeOption);
    data.selectedBackgrounds = backgrounds;
    data.selectedPrides = prides;
    data.selectedOnmyoujis = onmyoujis;
    data.editingTraits = data.canEditDocument && (this._editingTraits || !hasTraits);

    const sceneId = canvas?.scene?.id ?? game.scenes?.current?.id ?? null;
    const purifySceneId = actor.getFlag("ocho-lanzas", "purifySceneId") ?? null;
    const purifyUsed = Boolean(sceneId && purifySceneId === sceneId);
    const atMinimum = data.curseCount <= data.curseMin;
    data.canPurify = data.curseCount >= 4 && !purifyUsed && !atMinimum;
    data.purifyInfo = game.i18n.localize("OCHO.Purify.Info");
    if (data.curseCount < 4) data.purifyReason = game.i18n.localize("OCHO.Purify.DisabledTooLow");
    else if (atMinimum) data.purifyReason = game.i18n.localize("OCHO.Purify.DisabledAtMinimum");
    else if (purifyUsed) data.purifyReason = game.i18n.localize("OCHO.Purify.DisabledScene");
    else data.purifyReason = "";
    data.equipmentItems = actor.items.map(itemView);
    data.hasEquipmentItems = data.equipmentItems.length > 0;
    data.legacyEquipmentText = String(system.equipmentText ?? "").trim();
    data.hasLegacyEquipment = Boolean(data.legacyEquipmentText);
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._bindCheckboxArray(html, "system.backgrounds");
    this._bindCheckboxArray(html, "system.prides");
    this._bindCheckboxArray(html, "system.onmyoujis", {
      onAfterUpdate: async () => {
        await this.actor.enforceCurseMin?.();
        this.render(false);
      }
    });
    html.find("[data-action='toggleTraits']").on("click", () => {
      this._editingTraits = !this._editingTraits;
      this.render(false);
    });
    html.find("[data-action='purify']").on("click", async () => {
      await this.actor.purifyCharacter?.();
      this.render(false);
    });
    html.find("[data-action='itemOpen']").on("click", (ev) => this._openItem(ev));
    html.find("[data-action='itemEdit']").on("click", (ev) => this._openItem(ev));
    html.find("[data-action='itemDelete']").on("click", (ev) => this._deleteItem(ev));
    html.find("[data-action='itemAdd']").on("click", () => this._addItem());
    html.find(".ol-item-row").on("dblclick", (ev) => this._openItem(ev));
  }

  _bindCheckboxArray(html, path, { onAfterUpdate } = {}) {
    html.find(`input[name='${path}']`).on("change", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const values = Array.from(html.find(`input[name='${path}']:checked`).map((_, el) => el.value));
      await this.actor.update({ [path]: values });
      if (typeof onAfterUpdate === "function") await onAfterUpdate(values);
    });
  }

  _itemFromEvent(event) {
    const id = event.currentTarget?.closest?.(".ol-item-row")?.dataset?.itemId;
    return id ? this.actor.items.get(id) : null;
  }

  _openItem(event) {
    event.preventDefault();
    event.stopPropagation();
    this._itemFromEvent(event)?.sheet?.render?.(true);
  }

  async _deleteItem(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.actor.isOwner && !game.user?.isGM) return;
    const item = this._itemFromEvent(event);
    if (item && await confirmDeleteItem(item)) await item.delete();
  }

  async _addItem() {
    if (!this.actor.isOwner && !game.user?.isGM) return;
    try {
      await Item.createDialog({}, { parent: this.actor }, { types: ["gear", "weapon", "ritual", "condition"] });
    } catch (_err) {
      await this.actor.createEmbeddedDocuments("Item", [{ name: game.i18n.localize("TYPES.Item.gear"), type: "gear" }]);
    }
  }

  _onDragStart(event) {
    const row = event.currentTarget?.closest?.(".ol-item-row") ?? event.currentTarget;
    const item = row?.dataset?.itemId ? this.actor.items.get(row.dataset.itemId) : null;
    if (!item) return super._onDragStart?.(event);
    event.dataTransfer?.setData("text/plain", JSON.stringify({ type: "Item", uuid: item.uuid }));
  }

  _getSubmitData(updateData = {}) {
    const formData = super._getSubmitData(updateData);
    if ("system.curseCount" in formData) {
      const min = this.actor.system.curseMin ?? 1;
      const v = Number(formData["system.curseCount"]);
      formData["system.curseCount"] = Number.isFinite(v) ? Math.max(min, Math.min(6, v)) : min;
    }
    return formData;
  }
}

export class OchoLanzasNPCSheet extends OchoLanzasActorSheetBase {
  static windowStateKey = "npcSheet";
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ocho-lanzas", "sheet", "actor", "npc"], width: 1080, height: 700,
      resizable: true, submitOnClose: true, submitOnChange: true
    });
  }
  get template() { return "systems/ocho-lanzas/templates/actors/npc.hbs"; }
  activateListeners(html) { super.activateListeners(html); this._activateAutoGrow(html); }
}

export class OchoLanzasBakemonoSheet extends OchoLanzasActorSheetBase {
  static windowStateKey = "bakemonoSheet";
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ocho-lanzas", "sheet", "actor", "bakemono"], width: 1100, height: 720,
      resizable: true, submitOnClose: true, submitOnChange: true
    });
  }
  get template() { return "systems/ocho-lanzas/templates/actors/bakemono.hbs"; }
  activateListeners(html) { super.activateListeners(html); this._activateAutoGrow(html); }
}