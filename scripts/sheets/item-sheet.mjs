export class OchoLanzasItemSheet extends foundry.appv1.sheets.ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ocho-lanzas", "sheet", "item"],
      width: 760,
      height: 680,
      resizable: true,
    });
  }

  get template() {
    return "systems/ocho-lanzas/templates/items/item.hbs";
  }

  async getData(options = {}) {
    const data = await super.getData(options);
    const item = this.item;
    data.document = item;
    data.system = item.system ?? {};
    // tags: SetField returns a Set; join for the comma-separated input
    const tags = data.system.tags instanceof Set
      ? Array.from(data.system.tags)
      : (Array.isArray(data.system.tags) ? data.system.tags : []);
    data.system.tagsText = data.system.tagsText ?? tags.join(", ");
    return data;
  }

  async _updateObject(event, formData) {
    // Convert comma-separated tagsText back to array for the SetField
    const txt = String(formData["system.tagsText"] ?? "");
    formData["system.tags"] = txt.split(",").map(t => t.trim()).filter(Boolean);
    if ("system.quantity" in formData) {
      formData["system.quantity"] = Number(formData["system.quantity"] || 0);
    }
    return this.item.update(formData);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("img.profile-img").on("click", (ev) => this._onEditImage(ev));
  }
}
