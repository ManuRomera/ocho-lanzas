import { rollCurse } from "./curse.mjs";

export function registerChatActions() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    const $html = html instanceof HTMLElement ? $(html) : html;
    const btn = $html.find("button[data-action='ol-roll-curse']");
    if (!btn.length) return;

    const already = Boolean(message.getFlag("ocho-lanzas", "curseRolled"));
    if (already) {
      btn.prop("disabled", true);
      btn.text(game.i18n.localize("OCHO.Chat.CurseAlreadyRolled"));
      return;
    }

    btn.on("click", async (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      // Disable immediately to prevent double clicks.
      const $b = $html.find("button[data-action='ol-roll-curse']");
      $b.prop("disabled", true);

      try {
        const actorId = message.getFlag("ocho-lanzas", "actorId") ?? message.speaker?.actor;
        const actor = actorId ? game.actors.get(actorId) : null;
        if (!actor) {
          ui.notifications?.warn?.("No se ha podido encontrar el actor para esta tirada de Maldición.");
          $b.prop("disabled", false);
          return;
        }

        await rollCurse(actor, { fromRisk: true });
        await message.setFlag("ocho-lanzas", "curseRolled", true);
        $b.text(game.i18n.localize("OCHO.Chat.CurseAlreadyRolled"));
      } catch (err) {
        console.error("OCHO-LANZAS | Error rolling curse from chat", err);
        ui.notifications?.error?.("Error al tirar Maldición. Revisa la consola.");
        $b.prop("disabled", false);
      }
    });
  });
}