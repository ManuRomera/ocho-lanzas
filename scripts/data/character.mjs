// DataModel fields are accessed lazily inside defineSchema(),
// NOT at module parse time — Foundry globals aren't ready yet.

export class OchoLanzasCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField, NumberField, SetField, ArrayField, HTMLField } = foundry.data.fields;
    return {
      concept:    new StringField({ required: true, blank: true, initial: "" }),
      occupation: new StringField({ required: true, blank: true, initial: "" }),
      madness:    new NumberField({ required: true, integer: true, initial: 1 }),
      curse:      new StringField({ required: true, blank: true, initial: "" }),
      curseCount: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 6 }),
      notes:      new HTMLField({ required: true, blank: true, initial: "" }),

      backgrounds: new SetField(new StringField()),
      prides:      new SetField(new StringField()),
      onmyoujis:   new SetField(new StringField()),

      bondsList:     new ArrayField(new StringField()),
      eventsList:    new ArrayField(new StringField()),
      equipmentList: new ArrayField(new StringField()),
      haikaList:     new ArrayField(new StringField()),

      bondsText:     new StringField({ required: true, blank: true, initial: "" }),
      eventsText:    new StringField({ required: true, blank: true, initial: "" }),
      equipmentText: new StringField({ required: true, blank: true, initial: "" }),
      haikaText:     new StringField({ required: true, blank: true, initial: "" }),
    };
  }

  /** Minimum curse count: 1 base + 1 per Onmyouji selected (max 6). */
  get curseMin() {
    const n = this.onmyoujis?.size ?? this.onmyoujis?.length ?? 0;
    return Math.max(1, Math.min(6, 1 + n));
  }
}
