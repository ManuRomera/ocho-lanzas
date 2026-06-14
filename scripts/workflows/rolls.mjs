/**
 * Roll / Chat workflow helpers
 * Foundry VTT v13-compatible (no deprecated ChatMessage.type / CONST.CHAT_MESSAGE_TYPES)
 */

/**
 * Open the roll dialog and return user selections.
 */
export async function openRollDialog({
  rollType = "risk",
  flavor = "",
  actorName = "",
  bonusSources = [],
  cursedSources = []
} = {}) {
  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/ocho-lanzas/templates/dialogs/roll-dialog.hbs",
    {
      rollType,
      flavor,
      actorName,
      bonusSources,
      cursedSources,
      hasBonusSources: bonusSources.length > 0,
      hasCursedSources: cursedSources.length > 0
    }
  );

  const DialogV2 = foundry.applications.api.DialogV2;
  return DialogV2.prompt({
    window: { icon: "fa-solid fa-dice", resizable: true },
    position: { width: 760 },
    classes: ["ocho-lanzas", "ol-roll-dialog-v60"],
    title: game.i18n.localize("OCHO.Actions.RollAction"),
    content,
    ok: {
      label: game.i18n.localize("OCHO.Roll.Submit"),
      callback: async (_event, _button, dialog) => {
        const form = dialog.element.querySelector("form");
        const fd = new FormData(form);
        const selectedBonusSources = fd.getAll("bonusSources").map(String).filter(Boolean);
        const selectedCursedSources = fd.getAll("cursedSources").map(String).filter(Boolean);
        return {
          rollType: String(fd.get("rollType") || rollType),
          flavor: String(fd.get("flavor") || "").trim(),
          selectedBonusSources,
          selectedCursedSources,
          useBonus: selectedBonusSources.length > 0,
          useCursed: selectedCursedSources.length > 0
        };
      }
    },
    cancel: { label: game.i18n.localize("OCHO.Roll.Cancel") },
    rejectClose: false
  });
}

/**
 * Send a single chat message for a roll (risk + optional curse roll), using a custom card.
 */
export async function sendRollToChat({
  actor,
  rolls = [],
  title = "",
  flavor = "",
  dice = [],
  bestWhite = 0,
  cursedValue = null,
  best = 0,
  classification = "",
  classificationCss = "",
  curseTriggered = false,
  selectedBonusSources = [],
  selectedCursedSources = []
} = {}) {
  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/ocho-lanzas/templates/chat/roll-card.hbs",
    {
      title,
      flavor,
      dice,
      bestWhite,
      cursedValue,
      best,
      classification,
      classificationCss,
      curseTriggered,
      selectedBonusSources,
      selectedCursedSources,
      hasSources: selectedBonusSources.length > 0 || selectedCursedSources.length > 0
    }
  );

  const speaker = ChatMessage.getSpeaker({ actor });
  const flags = {
    "ocho-lanzas": {
      actorId: actor?.id ?? null,
      curseTriggered: Boolean(curseTriggered)
    }
  };

  return ChatMessage.create({
    user: game.user.id,
    speaker,
    content,
    rolls,
    flags
  });
}
