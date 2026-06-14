import { OPTIONS_BACKGROUND, OPTIONS_PRIDE, OPTIONS_ONMYOUJI } from "../workflows/static-options.mjs";

// ─── Character Sheet (AppV1 — robust and proven) ─────────────────────────────
//
// Data validation and logic live in the DataModel (character.mjs) and the
// custom document class (OchoLanzasActor), keeping this sheet thin.

export class OchoLanzasCharacterSheet extends foundry.appv1.sheets.ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ocho-lanzas", "sheet", "actor", "character"],
      width: 760,
      height: 900,
      resizable: true,
      submitOnClose: true,
      submitOnChange: true,
    });
  }

  get template() {
    return "systems/ocho-lanzas/templates/actors/character.hbs";
  }

  async getData(options = {}) {
    const data = await super.getData(options);
    const actor = this.actor;
    const system = actor.system ?? {};

    data.document = actor;
    data.system = system;
    data.isGM = game.user.isGM;

    data.backgroundOptions = OPTIONS_BACKGROUND;
    data.prideOptions = OPTIONS_PRIDE;
    data.onmyoujiOptions = OPTIONS_ONMYOUJI;

    // curseMin is calculated by the DataModel getter
    const curMin = system.curseMin ?? 1;
    const cur = Math.max(curMin, system.curseCount ?? 1);
    data.curseMin = curMin;

    const sceneId = canvas?.scene?.id ?? game.scenes?.current?.id ?? null;
    const purifySceneId = actor.getFlag("ocho-lanzas", "purifySceneId") ?? null;
    data.canPurify = cur >= 4 && (!sceneId || purifySceneId !== sceneId);

    // Curse pips
    data.cursePips = Array.from({ length: 6 }, (_, i) => {
      const n = i + 1;
      const filled = cur >= n;
      const permanent = n <= curMin;
      const cls = [filled ? "filled" : "", permanent ? "permanent" : ""].filter(Boolean).join(" ");
      return { i, n, cls };
    });

    // Legacy text migration (bonds, events, equipment, haika)
    const legacyToText = [
      ["bondsList", "bondsText"],
      ["eventsList", "eventsText"],
      ["equipmentList", "equipmentText"],
      ["haikaList", "haikaText"],
    ];
    const textUpdates = {};
    for (const [legacy, target] of legacyToText) {
      const curText = String(system?.[target] ?? "").trim();
      const legacyArr = Array.isArray(system?.[legacy]) ? system[legacy] : [];
      if (!curText.length && legacyArr.length) {
        data.system[target] = legacyArr.join("\n");
        if (actor.isOwner || game.user.isGM) textUpdates[`system.${target}`] = data.system[target];
      }
    }
    if (Object.keys(textUpdates).length) actor.update(textUpdates).catch(() => {});

    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Roll button — delegates to OchoLanzasActor.rollRisk()
    html.find("[data-action='rollAction']").on("click", () => this.actor.rollRisk?.());

    // Checkbox arrays: prevent Foundry's form-submit from mangling them
    this._bindCheckboxArray(html, "system.backgrounds");
    this._bindCheckboxArray(html, "system.prides");
    this._bindCheckboxArray(html, "system.onmyoujis", {
      onAfterUpdate: async () => {
        await this.actor.enforceCurseMin?.();
        this.render(false);
      }
    });

    // Curse controls
    html.find("[data-action='curseInc']").on("click", () => this._adjustCurse(1));
    html.find("[data-action='curseDec']").on("click", () => this._adjustCurse(-1));
    html.find("[data-action='curseReset']").on("click", () => this._resetCurse());
    html.find("[data-action='purify']").on("click", () => this._onPurify());

    // Pip click / right-click
    html.find(".ol-curse-ring .ol-pip").on("click", (ev) => {
      const n = Number(ev.currentTarget?.dataset?.pip ?? 0);
      if (Number.isFinite(n)) this._setCurse(n);
    });
    html.find(".ol-curse-ring .ol-pip").on("contextmenu", (ev) => {
      ev.preventDefault();
      const n = Number(ev.currentTarget?.dataset?.pip ?? 0);
      if (Number.isFinite(n)) this._setCurse(n - 1);
    });

    // Image edit
    html.find("img.profile-img").on("click", (ev) => this._onEditImage(ev));
  }

  _bindCheckboxArray(html, path, { onAfterUpdate } = {}) {
    html.find(`input[name='${path}']`).on("change", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const values = Array.from(
        html.find(`input[name='${path}']:checked`).map((_, el) => el.value)
      );
      await this.actor.update({ [path]: values });
      if (typeof onAfterUpdate === "function") await onAfterUpdate(values);
    });
  }

  async _setCurse(value) {
    const min = this.actor.system.curseMin ?? 1;
    const v = Math.max(min, Math.min(6, value));
    await this.actor.update({ "system.curseCount": v });
  }

  async _adjustCurse(delta) {
    const min = this.actor.system.curseMin ?? 1;
    const cur = Math.max(min, this.actor.system.curseCount ?? min);
    const next = Math.max(min, Math.min(6, cur + delta));
    await this.actor.update({ "system.curseCount": next });
  }

  async _resetCurse() {
    const min = this.actor.system.curseMin ?? 1;
    await this.actor.update({ "system.curseCount": min });
    ui.notifications?.info?.(game.i18n.format("OCHO.Chat.CurseReset", { value: min }));
  }

  async _onPurify() {
    await this.actor.purifyCharacter?.();
    this.render(false);
  }

  _getSubmitData(updateData = {}) {
    const formData = super._getSubmitData(updateData);
    // Clamp curse on submit
    if ("system.curseCount" in formData) {
      const min = this.actor.system.curseMin ?? 1;
      const v = Number(formData["system.curseCount"]);
      formData["system.curseCount"] = Number.isFinite(v) ? Math.max(min, Math.min(6, v)) : min;
    }
    return formData;
  }
}

// ─── NPC Sheet ──────────────────────────────────────────────────────────────

export class OchoLanzasNPCSheet extends OchoLanzasCharacterSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ocho-lanzas", "sheet", "actor", "npc"],
      width: 1180,
      height: 720,
    });
  }

  get template() {
    return "systems/ocho-lanzas/templates/actors/npc.hbs";
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._activateAutoGrow(html);
  }

  _activateAutoGrow(html) {
    const grow = (el) => {
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 48)}px`;
    };
    const textareas = html.find("textarea.ol-autogrow");
    textareas.each((_, el) => {
      grow(el);
      el.addEventListener("input", () => grow(el));
    });
  }
}
