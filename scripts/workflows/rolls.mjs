import { dialogV2, renderTemplate } from "../compat/foundry-compat.mjs";
/** Roll and chat helpers shared by Foundry VTT 13 and 14. */

function bindRollPreview(dialog) {
  const root = dialog?.element?.querySelector?.(".ol-roll-dialog-v5") ?? dialog?.element?.find?.(".ol-roll-dialog-v5")?.get?.(0);
  if (!root) return;

  const update = () => {
    const mode = root.querySelector("input[name='rollType']:checked")?.value ?? "risk";
    const bonus = root.querySelector("input[name='bonusSource']:checked")?.value ?? "";
    const cursed = root.querySelector("input[name='cursedSource']:checked")?.value ?? "";
    root.dataset.mode = mode;

    const white = root.querySelector("[data-preview-white]");
    const cursedPreview = root.querySelector("[data-preview-cursed]");
    const sources = root.querySelector("[data-preview-sources]");
    if (white) white.textContent = game.i18n.localize(bonus ? "OCHO.Roll.PreviewTwoWhite" : "OCHO.Roll.PreviewOneWhite");
    if (cursedPreview) cursedPreview.hidden = !cursed;
    if (sources) sources.textContent = [bonus, cursed].filter(Boolean).join(" · ");
  };

  root.addEventListener("change", update);
  update();
}

export async function openRollDialog({
  rollType = "risk",
  flavor = "",
  actorName = "",
  curseCount = 1,
  bonusSources = [],
  cursedSources = []
} = {}) {
  const content = await renderTemplate(
    "systems/ocho-lanzas/templates/dialogs/roll-dialog.hbs",
    { rollType, flavor, actorName, curseCount, bonusSources, cursedSources }
  );

  return dialogV2().prompt({
    window: { icon: "fa-solid fa-dice", resizable: true, title: game.i18n.localize("OCHO.Actions.RollAction") },
    position: { width: 760 },
    classes: ["ocho-lanzas", "ol-roll-dialog-shell"],
    content,
    render: (...args) => bindRollPreview(args.find((arg) => arg?.element) ?? args.at(-1)),
    ok: {
      label: game.i18n.localize("OCHO.Roll.Submit"),
      callback: async (_event, _button, dialog) => {
        const form = dialog.element.querySelector("form");
        const fd = new FormData(form);
        const selectedRollType = String(fd.get("rollType") || rollType);
        const bonus = selectedRollType === "curse" ? "" : String(fd.get("bonusSource") || "");
        const cursed = selectedRollType === "curse" ? "" : String(fd.get("cursedSource") || "");
        return {
          rollType: selectedRollType,
          flavor: String(fd.get("flavor") || "").trim(),
          selectedBonusSources: bonus ? [bonus] : [],
          selectedCursedSources: cursed ? [cursed] : [],
          useBonus: Boolean(bonus),
          useCursed: Boolean(cursed)
        };
      }
    },
    cancel: { label: game.i18n.localize("OCHO.Roll.Cancel") },
    rejectClose: false
  });
}

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
  const content = await renderTemplate(
    "systems/ocho-lanzas/templates/chat/roll-card.hbs",
    {
      title, flavor, dice, bestWhite, cursedValue, best, classification, classificationCss, curseTriggered,
      selectedBonusSources, selectedCursedSources,
      hasSources: selectedBonusSources.length > 0 || selectedCursedSources.length > 0
    }
  );

  return ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls,
    flags: { "ocho-lanzas": { actorId: actor?.id ?? null, curseTriggered: Boolean(curseTriggered) } }
  });
}