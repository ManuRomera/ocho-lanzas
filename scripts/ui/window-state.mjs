const SYSTEM_ID = "ocho-lanzas";
const SETTING = "windowLayout";
const SAVE_DELAY = 220;
const timers = new WeakMap();
const MIN_GEOMETRY = {
  characterSheet: { width: 850, height: 620 },
  npcSheet: { width: 850, height: 580 },
  bakemonoSheet: { width: 900, height: 620 },
  itemSheet: { width: 540, height: 420 },
  welcome: { width: 630, height: 500 },
  yomiDirector: { width: 900, height: 640 }
};

function parseLayout() {
  try {
    const raw = game.settings.get(SYSTEM_ID, SETTING);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_err) {
    return {};
  }
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function clampGeometry(raw = {}, key = "") {
  const width = safeNumber(raw.width);
  const height = safeNumber(raw.height);
  const minimum = MIN_GEOMETRY[key] ?? { width: 520, height: 360 };
  let left = safeNumber(raw.left);
  let top = safeNumber(raw.top);

  const viewportWidth = Math.max(800, window.innerWidth || 0);
  const viewportHeight = Math.max(600, window.innerHeight || 0);
  const maxWidth = Math.max(360, viewportWidth - 40);
  const maxHeight = Math.max(300, viewportHeight - 40);
  const minWidth = Math.min(minimum.width, maxWidth);
  const minHeight = Math.min(minimum.height, maxHeight);
  const safeWidth = width ? Math.min(Math.max(width, minWidth), maxWidth) : undefined;
  const safeHeight = height ? Math.min(Math.max(height, minHeight), maxHeight) : undefined;

  if (left !== undefined) left = Math.min(Math.max(left, 20), Math.max(20, viewportWidth - Math.min(safeWidth ?? 400, viewportWidth) - 20));
  if (top !== undefined) top = Math.min(Math.max(top, 20), Math.max(20, viewportHeight - 90));

  return {
    ...(left !== undefined ? { left } : {}),
    ...(top !== undefined ? { top } : {}),
    ...(safeWidth !== undefined ? { width: safeWidth } : {}),
    ...(safeHeight !== undefined ? { height: safeHeight } : {})
  };
}

export function readWindowGeometry(key) {
  const layout = parseLayout();
  if (layout?.windows?.[key]) return clampGeometry(layout.windows[key], key);

  // One-time backwards-compatible fallback for the old Yomi-only setting.
  if (key === "yomiDirector") {
    try {
      const raw = game.settings.get(SYSTEM_ID, "tejidoDeYomiWindow");
      if (raw) {
        const legacy = JSON.parse(raw);
        if (legacy && typeof legacy === "object") return clampGeometry(legacy, key);
      }
    } catch (_err) {}
  }
  return {};
}

export function applySavedWindowOptions(key, options = {}) {
  const saved = readWindowGeometry(key);
  return foundry.utils.mergeObject(options ?? {}, saved, { inplace: false, insertKeys: true, overwrite: true });
}

async function writeWindowGeometry(key, geometry) {
  const layout = parseLayout();
  layout.version = 1;
  layout.windows ??= {};
  layout.windows[key] = clampGeometry(geometry, key);
  await game.settings.set(SYSTEM_ID, SETTING, JSON.stringify(layout));
}

export function persistWindowGeometry(app, key) {
  if (!app || !key || !app.rendered) return;
  const existing = timers.get(app);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    timers.delete(app);
    const p = app.position ?? {};
    void writeWindowGeometry(key, {
      left: p.left,
      top: p.top,
      width: p.width,
      height: p.height
    }).catch(() => {});
  }, SAVE_DELAY);

  timers.set(app, timer);
}

export async function flushWindowGeometry(app, key) {
  const timer = timers.get(app);
  if (timer) {
    clearTimeout(timer);
    timers.delete(app);
  }
  const p = app?.position ?? {};
  if (!app || !key) return;
  await writeWindowGeometry(key, { left: p.left, top: p.top, width: p.width, height: p.height }).catch(() => {});
}

export async function resetWindowLayout() {
  await game.settings.set(SYSTEM_ID, SETTING, "");
  ui.notifications?.info?.(game.i18n.localize("OCHO.Config.WindowLayoutResetDone"));
}