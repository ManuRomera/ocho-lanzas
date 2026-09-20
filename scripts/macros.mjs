async function macroForDrop(data) {
  const type = String(data?.type ?? "");
  const uuid = String(data?.uuid ?? "");
  if (!uuid || !["Actor", "Item"].includes(type)) return null;

  const document = await fromUuid(uuid).catch(() => null);
  if (!document) return null;

  const isActor = document.documentName === "Actor";
  const command = isActor
    ? `await game.ochoLanzas?.roll?.(${JSON.stringify(document.uuid)});`
    : `await game.ochoLanzas?.openDocument?.(${JSON.stringify(document.uuid)});`;
  const name = isActor
    ? `${document.name} · ${game.i18n.localize("OCHO.Actions.RollAction")}`
    : document.name;

  const existing = game.macros?.find((macro) => macro.command === command && macro.name === name);
  if (existing) return existing;

  return Macro.create({
    name,
    type: "script",
    img: document.img || "icons/svg/dice-target.svg",
    command,
    flags: { "ocho-lanzas": { generatedHotbarMacro: true, sourceUuid: document.uuid } }
  });
}

export function registerMacroIntegration() {
  Hooks.on("hotbarDrop", async (_hotbar, data, slot) => {
    if (!["Actor", "Item"].includes(String(data?.type ?? ""))) return;
    const macro = await macroForDrop(data);
    if (!macro) return;
    await game.user?.assignHotbarMacro?.(macro, slot);
    return false;
  });
}