/**
 * Maldición workflow helpers
 */

function normalizeSelection(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(v => typeof v === "string" && v.trim().length);
  if (value instanceof Set) return Array.from(value).map(String).filter(v => v.trim().length);
  if (typeof value === "string") return value.trim().length ? [value] : [];
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => String(k))
      .filter(v => v.trim().length);
  }
  return [];
}

function clampNumber(n, min, max, fallback = min) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

function applyCursedAppearance(roll) {
  // Dice So Nice: set appearance on the Maldito term if possible.
  // This does not hard-require Dice So Nice; Foundry will safely ignore unknown options.
  const DieTerm = foundry.dice.terms.Die;
  for (const t of roll.terms ?? []) {
    if (!(t instanceof DieTerm)) continue;
    const flavor = String(t.options?.flavor ?? "").toLowerCase();
    if (!flavor.includes("maldito")) continue;
    t.options.colorset = t.options.colorset ?? "ocho-maldicion";
    t.options.appearance = {
      background: "#b00020",
      foreground: "#ffffff",
      outline: "#260008",
      edge: "#260008"
    };
  }
}

export function getCurseMin(actor) {
  const onmyoujisRaw = actor?.system?.onmyoujis;
  const n = normalizeSelection(onmyoujisRaw).length;
  return clampNumber(1 + n, 1, 6, 1);
}

export async function enforceCurseMin(actor) {
  const min = getCurseMin(actor);
  const cur = clampNumber(actor?.system?.curseCount, 1, 6, 1);
  if (cur < min) await actor.update({ "system.curseCount": min });
  return Math.max(cur, min);
}

export async function rollCurse(actor, { fromRisk = false, subtitle = "" } = {}) {
  if (!actor) throw new Error("Actor not provided");
  if (!actor.isOwner && !game.user.isGM) {
    ui.notifications?.warn?.("No tienes permisos para modificar la Maldición de este PJ.");
    return null;
  }

  await enforceCurseMin(actor);
  const min = getCurseMin(actor);
  const before = clampNumber(actor.system?.curseCount, min, 6, min);

  const roll = new Roll("1d6[Maldito]");
  applyCursedAppearance(roll);
  await roll.evaluate();

  const die = clampNumber(roll.total, 1, 6, 1);

  let after = before;
  let increased = false;
  if (die > before) {
    after = clampNumber(before + 1, min, 6, min);
    increased = after > before;
    if (increased) await actor.update({ "system.curseCount": after });
  }

  const bakemono = after >= 6;

  const title = game.i18n.localize(fromRisk ? "OCHO.Chat.CurseFromRisk" : "OCHO.Chat.CurseManual");
  const subtitleText = String(subtitle ?? "").trim() || (fromRisk ? game.i18n.localize("OCHO.Chat.CurseCheck") : "");
  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/ocho-lanzas/templates/chat/curse-card.hbs",
    { title, subtitle: subtitleText, die, before, after, increased, bakemono }
  );

  const speaker = ChatMessage.getSpeaker({ actor });
  await ChatMessage.create({
    user: game.user.id,
    speaker,
    content,
    rolls: [roll]
  });

  return { die, before, after, increased, bakemono, roll };
}

function getCurrentSceneId() {
  return canvas?.scene?.id ?? game.scenes?.current?.id ?? null;
}

export async function purify(actor, { consequence } = {}) {
  if (!actor) throw new Error("Actor not provided");
  if (!actor.isOwner && !game.user.isGM) {
    ui.notifications?.warn?.("No tienes permisos para purificar a este PJ.");
    return null;
  }

  await enforceCurseMin(actor);
  const min = getCurseMin(actor);
  const before = clampNumber(actor.system?.curseCount, min, 6, min);

  if (before < 4) {
    ui.notifications?.warn?.(game.i18n.localize("OCHO.Purify.ErrorTooLow"));
    return null;
  }

  const sceneId = getCurrentSceneId();
  const lastScene = actor.getFlag("ocho-lanzas", "purifySceneId") ?? null;
  if (sceneId && lastScene === sceneId) {
    ui.notifications?.warn?.(game.i18n.localize("OCHO.Purify.ErrorOncePerScene"));
    return null;
  }

  const cons = String(consequence ?? "").trim();
  if (!cons.length) {
    ui.notifications?.warn?.(game.i18n.localize("OCHO.Purify.ErrorConsequenceRequired"));
    return null;
  }

  const after = clampNumber(before - 1, min, 6, min);
  await actor.update({ "system.curseCount": after });
  if (sceneId) await actor.setFlag("ocho-lanzas", "purifySceneId", sceneId);

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/ocho-lanzas/templates/chat/purify-card.hbs",
    { before, after, consequence: cons }
  );

  const speaker = ChatMessage.getSpeaker({ actor });
  await ChatMessage.create({
    user: game.user.id,
    speaker,
    content
  });

  return { before, after, consequence: cons };
}
