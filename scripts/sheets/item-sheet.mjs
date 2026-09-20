import { ItemSheetV1 } from "../compat/foundry-compat.mjs";
import { bindContextInfo, closeContextInfo } from "../ui/context-info.mjs";
import { applySavedWindowOptions, persistWindowGeometry, flushWindowGeometry } from "../ui/window-state.mjs";

export class OchoLanzasItemSheet extends ItemSheetV1 {
  constructor(item, options = {}) { super(item, applySavedWindowOptions("itemSheet", options)); }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ocho-lanzas", "sheet", "item"], width: 700, height: 500, resizable: true
    });
  }
  get template() { return "systems/ocho-lanzas/templates/items/item.hbs"; }
  async getData(options = {}) {
    const data = await super.getData(options);
    data.document = this.item;
    data.system = this.item.system ?? {};
    const tags = data.system.tags instanceof Set ? Array.from(data.system.tags) : (Array.isArray(data.system.tags) ? data.system.tags : []);
    data.system.tagsText = tags.join(", ");
    data.typeLabel = game.i18n.localize(`TYPES.Item.${this.item.type}`) || this.item.type;
    return data;
  }
  async _updateObject(event, formData) {
    const txt = String(formData["system.tagsText"] ?? "");
    formData["system.tags"] = txt.split(",").map((t) => t.trim()).filter(Boolean);
    if ("system.quantity" in formData) formData["system.quantity"] = Number(formData["system.quantity"] || 0);
    return this.item.update(formData);
  }
  activateListeners(html) {
    super.activateListeners(html);
    bindContextInfo(html);
    html.find("img.profile-img").on("click", (ev) => this._onEditImage(ev));
  }
  setPosition(options = {}) {
    const position = super.setPosition(options);
    if (this.rendered) persistWindowGeometry(this, "itemSheet");
    return position;
  }
  async close(options = {}) {
    closeContextInfo();
    await flushWindowGeometry(this, "itemSheet");
    return super.close(options);
  }
}