export class OchoLanzasBaseItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const { StringField, NumberField, BooleanField, SetField, HTMLField } = foundry.data.fields;
    return {
      quantity:    new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      equipped:    new BooleanField({ required: true, initial: false }),
      tags:        new SetField(new StringField({ required: true, blank: false })),
      description: new HTMLField({ required: true, blank: true, initial: "" }),
    };
  }
}

export class OchoLanzasWeaponData extends OchoLanzasBaseItemData {
  static defineSchema() {
    const { StringField } = foundry.data.fields;
    const schema = super.defineSchema();
    schema.damage = new StringField({ required: true, blank: true, initial: "" });
    return schema;
  }
}
