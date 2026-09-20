const SYSTEM_ID = "ocho-lanzas";
const DATA_VERSION = "0.5.0";
const OLD_ASSET_PREFIX = "systems/ocho-lanzas/el_tejido_de_yomi_pack_v10/assets/";
const NEW_ASSET_PREFIX = "systems/ocho-lanzas/assets/";

function replaceLegacyPath(value) {
  if (typeof value !== "string") return value;
  return value.startsWith(OLD_ASSET_PREFIX)
    ? `${NEW_ASSET_PREFIX}${value.slice(OLD_ASSET_PREFIX.length)}`
    : value;
}

function legacyArrayToText(system, legacy, target) {
  const current = String(system?.[target] ?? "").trim();
  const values = Array.isArray(system?.[legacy]) ? system[legacy].filter(Boolean) : [];
  return !current && values.length ? values.join("\n") : null;
}

async function migrateActors() {
  for (const actor of game.actors ?? []) {
    const updates = {};
    const system = actor.system ?? {};

    if (actor.type === "character") {
      for (const [legacy, target] of [
        ["bondsList", "bondsText"],
        ["eventsList", "eventsText"],
        ["equipmentList", "equipmentText"],
        ["haikaList", "haikaText"]
      ]) {
        const migrated = legacyArrayToText(system, legacy, target);
        if (migrated !== null) updates[`system.${target}`] = migrated;
      }
    }

    if (actor.type === "bakemono") {
      if (!String(system.nature ?? "").trim() && String(system.concept ?? "").trim()) {
        updates["system.nature"] = String(system.concept);
      }
      if (!String(system.purpose ?? "").trim() && String(system.occupation ?? "").trim()) {
        updates["system.purpose"] = String(system.occupation);
      }
    }

    const actorImg = replaceLegacyPath(actor.img);
    if (actorImg !== actor.img) updates.img = actorImg;

    const tokenSrc = actor.prototypeToken?.texture?.src;
    const migratedTokenSrc = replaceLegacyPath(tokenSrc);
    if (migratedTokenSrc && migratedTokenSrc !== tokenSrc) {
      updates["prototypeToken.texture.src"] = migratedTokenSrc;
    }

    if (Object.keys(updates).length) await actor.update(updates);
  }
}

async function migrateWorldItems() {
  for (const item of game.items ?? []) {
    const next = replaceLegacyPath(item.img);
    if (next !== item.img) await item.update({ img: next });
  }
}

async function migrateScenes() {
  for (const scene of game.scenes ?? []) {
    const current = scene.background?.src;
    const next = replaceLegacyPath(current);
    if (next !== current) await scene.update({ "background.src": next });
  }
}

async function migratePlaylists() {
  for (const playlist of game.playlists ?? []) {
    const updates = [];
    for (const sound of playlist.sounds ?? []) {
      const next = replaceLegacyPath(sound.path);
      if (next !== sound.path) updates.push({ _id: sound.id, path: next });
    }
    if (updates.length) await playlist.updateEmbeddedDocuments("PlaylistSound", updates);
  }
}

async function migrateJournals() {
  for (const journal of game.journal ?? []) {
    const updates = [];
    for (const page of journal.pages ?? []) {
      const next = replaceLegacyPath(page.src);
      if (next !== page.src) updates.push({ _id: page.id, src: next });
    }
    if (updates.length) await journal.updateEmbeddedDocuments("JournalEntryPage", updates);
  }
}

export async function runSystemMigrations() {
  if (!game.user?.isGM) return false;
  const current = String(game.settings.get(SYSTEM_ID, "systemDataVersion") ?? "");
  if (current === DATA_VERSION) return false;

  console.info(`OCHO-LANZAS | Migrating world data ${current || "(legacy)"} -> ${DATA_VERSION}`);
  await migrateActors();
  await migrateWorldItems();
  await migrateScenes();
  await migratePlaylists();
  await migrateJournals();
  await game.settings.set(SYSTEM_ID, "systemDataVersion", DATA_VERSION);
  console.info(`OCHO-LANZAS | Migration complete: ${DATA_VERSION}`);
  return true;
}