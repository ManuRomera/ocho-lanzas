import { registerHelpers, preloadTemplates, registerSettings } from "./utils.mjs";
import { registerChatActions } from "./workflows/chat-actions.mjs";
import { OchoLanzasCharacterSheet, OchoLanzasNPCSheet, OchoLanzasBakemonoSheet } from "./sheets/actor-sheets.mjs";
import { OchoLanzasItemSheet } from "./sheets/item-sheet.mjs";
import { registerTejidoDeYomiIntegration } from "./apps/tejido-de-yomi-app.mjs";
import { registerWelcomeIntegration, maybeShowWelcome } from "./apps/welcome-app.mjs";
import { runSystemMigrations } from "./migrations.mjs";
import { rollCurse } from "./workflows/curse.mjs";
import { registerMacroIntegration } from "./macros.mjs";

import { OchoLanzasCharacterData } from "./data/character.mjs";
import { OchoLanzasNPCData } from "./data/npc.mjs";
import { OchoLanzasBakemonoData } from "./data/bakemono.mjs";
import { OchoLanzasBaseItemData, OchoLanzasWeaponData } from "./data/item.mjs";
import { OchoLanzasActor } from "./documents/actor.mjs";

async function resolveActor(ref) {
  if (!ref) return canvas?.tokens?.controlled?.[0]?.actor ?? game.user?.character ?? null;
  if (ref instanceof Actor) return ref;
  if (typeof ref === "string") return game.actors.get(ref) ?? await fromUuid(ref).catch(() => null);
  return null;
}

function registerPublicApi() {
  game.ochoLanzas ??= {};
  game.ochoLanzas.roll = async (actorRef) => (await resolveActor(actorRef))?.rollRisk?.();
  game.ochoLanzas.rollCurse = async (actorRef) => {
    const actor = await resolveActor(actorRef);
    return actor ? rollCurse(actor, { fromRisk: false }) : null;
  };
  game.ochoLanzas.openDocument = async (uuid) => {
    const doc = await fromUuid(uuid).catch(() => null);
    doc?.sheet?.render?.(true);
    return doc;
  };
}

Hooks.once("init", async () => {
  console.log("OCHO-LANZAS | init 0.5.0");
  registerHelpers();
  registerSettings();
  await preloadTemplates();

  registerPublicApi();
  registerChatActions();
  registerMacroIntegration();
  registerWelcomeIntegration();
  registerTejidoDeYomiIntegration();

  CONFIG.Actor.dataModels.character = OchoLanzasCharacterData;
  CONFIG.Actor.dataModels.npc = OchoLanzasNPCData;
  CONFIG.Actor.dataModels.bakemono = OchoLanzasBakemonoData;
  CONFIG.Item.dataModels.gear = OchoLanzasBaseItemData;
  CONFIG.Item.dataModels.weapon = OchoLanzasWeaponData;
  CONFIG.Item.dataModels.ritual = OchoLanzasBaseItemData;
  CONFIG.Item.dataModels.condition = OchoLanzasBaseItemData;
  CONFIG.Actor.documentClass = OchoLanzasActor;

  try { Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet); } catch (_err) {}
  try { Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet); } catch (_err) {}

  Actors.registerSheet("ocho-lanzas", OchoLanzasCharacterSheet, { types: ["character"], makeDefault: true, label: "OCHO.Sheet.Character" });
  Actors.registerSheet("ocho-lanzas", OchoLanzasNPCSheet, { types: ["npc"], makeDefault: true, label: "OCHO.Sheet.NPC" });
  Actors.registerSheet("ocho-lanzas", OchoLanzasBakemonoSheet, { types: ["bakemono"], makeDefault: true, label: "OCHO.Sheet.Bakemono" });
  Items.registerSheet("ocho-lanzas", OchoLanzasItemSheet, { types: ["gear", "weapon", "ritual", "condition"], makeDefault: true, label: "OCHO.Sheet.Item" });
});

Hooks.once("ready", async () => {
  await runSystemMigrations().catch((err) => console.error("OCHO-LANZAS | migration failed", err));
  maybeShowWelcome();
  console.log(`OCHO-LANZAS | ready on Foundry ${game.version}`);
});

Hooks.once("diceSoNiceReady", (dice3d) => {
  try {
    if (!dice3d?.addColorset) return;
    dice3d.addColorset({
      name: "ocho-maldicion",
      description: "Ocho Lanzas: Maldito",
      category: "Ocho Lanzas",
      foreground: "#ffffff",
      background: "#8f1d1d",
      edge: "#1a1a1a",
      outline: "#1a1a1a"
    }, "default");
  } catch (err) {
    console.warn("OCHO-LANZAS | Dice So Nice colorset init failed", err);
  }
});