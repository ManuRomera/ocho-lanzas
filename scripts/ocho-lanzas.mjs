import { registerHelpers, preloadTemplates, registerSettings } from "./utils.mjs";
import { registerChatActions } from "./workflows/chat-actions.mjs";
import { OchoLanzasCharacterSheet, OchoLanzasNPCSheet } from "./sheets/actor-sheets.mjs";
import { OchoLanzasItemSheet } from "./sheets/item-sheet.mjs";
import { registerTejidoDeYomiIntegration } from "./apps/tejido-de-yomi-app.mjs";

import { OchoLanzasCharacterData } from "./data/character.mjs";
import { OchoLanzasNPCData } from "./data/npc.mjs";
import { OchoLanzasBaseItemData, OchoLanzasWeaponData } from "./data/item.mjs";
import { OchoLanzasActor } from "./documents/actor.mjs";

Hooks.once("init", async () => {
  console.log("OCHO-LANZAS | init");

  registerHelpers();
  registerSettings();
  await preloadTemplates();

  registerChatActions();
  registerTejidoDeYomiIntegration();

  // 1. Register Data Models
  CONFIG.Actor.dataModels.character = OchoLanzasCharacterData;
  CONFIG.Actor.dataModels.npc = OchoLanzasNPCData;
  CONFIG.Actor.dataModels.bakemono = OchoLanzasNPCData;
  
  CONFIG.Item.dataModels.gear = OchoLanzasBaseItemData;
  CONFIG.Item.dataModels.weapon = OchoLanzasWeaponData;
  CONFIG.Item.dataModels.ritual = OchoLanzasBaseItemData;
  CONFIG.Item.dataModels.condition = OchoLanzasBaseItemData;

  // 2. Register Custom Documents
  CONFIG.Actor.documentClass = OchoLanzasActor;

  // 3. Register Sheets — safely unregister core defaults (may vary by Foundry build)
  try { Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet); } catch (_e) {}
  try { Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet); } catch (_e) {}

  Actors.registerSheet("ocho-lanzas", OchoLanzasCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "OCHO.Sheet.Character"
  });
  Actors.registerSheet("ocho-lanzas", OchoLanzasNPCSheet, {
    types: ["npc", "bakemono"],
    makeDefault: true,
    label: "OCHO.Sheet.NPC"
  });

  Items.registerSheet("ocho-lanzas", OchoLanzasItemSheet, {
    types: ["gear","weapon","ritual","condition"],
    makeDefault: true,
    label: "OCHO.Sheet.Item"
  });
});

Hooks.once("ready", () => console.log("OCHO-LANZAS | ready"));

// Optional integration: Dice So Nice colorset for the Maldito die.
Hooks.once("diceSoNiceReady", (dice3d) => {
  try {
    if (!dice3d?.addColorset) return;
    dice3d.addColorset({
      name: "ocho-maldicion",
      description: "Ocho Lanzas: Maldito",
      category: "Ocho Lanzas",
      foreground: "#ffffff",
      background: "#b00020",
      edge: "#1a1a1a",
      outline: "#1a1a1a"
    }, "default");
  } catch (err) {
    console.warn("OCHO-LANZAS | Dice So Nice colorset init failed", err);
  }
});
