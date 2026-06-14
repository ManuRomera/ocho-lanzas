export class OchoLanzasNPCData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField, NumberField, HTMLField } = foundry.data.fields;
    return {
      concept:    new StringField({ required: true, blank: true, initial: "" }),
      occupation: new StringField({ required: true, blank: true, initial: "" }),
      madness:    new NumberField({ required: true, integer: true, initial: 1 }),
      curse:      new StringField({ required: true, blank: true, initial: "" }),
      curseCount: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 6 }),
      notes:      new HTMLField({ required: true, blank: true, initial: "" }),
    };
  }

  /** NPCs don't have Onmyoujis so their curseMin is always 1. */
  get curseMin() {
    return 1;
  }
}
