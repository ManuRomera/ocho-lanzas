export class OchoLanzasBakemonoData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField, NumberField, HTMLField } = foundry.data.fields;
    return {
      nature:        new StringField({ required: true, blank: true, initial: "" }),
      manifestation: new StringField({ required: true, blank: true, initial: "" }),
      purpose:       new StringField({ required: true, blank: true, initial: "" }),
      threats:       new StringField({ required: true, blank: true, initial: "" }),
      weaknesses:    new StringField({ required: true, blank: true, initial: "" }),
      curse:          new StringField({ required: true, blank: true, initial: "" }),
      curseCount:     new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 6 }),
      notes:          new HTMLField({ required: true, blank: true, initial: "" }),

      // Legacy fields retained only so old worlds can migrate safely.
      concept:    new StringField({ required: true, blank: true, initial: "" }),
      occupation: new StringField({ required: true, blank: true, initial: "" }),
      madness:    new NumberField({ required: true, integer: true, initial: 1 })
    };
  }

  get curseMin() {
    return 1;
  }
}