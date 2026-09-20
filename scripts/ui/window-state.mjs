const SYSTEM_ID = "ocho-lanzas";
const SETTING = "windowLayout";
const SAVE_DELAY = 220;
const timers = new WeakMap();

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

function clampGeometry(raw = {}) {
  const width = safeNumber(raw.width);
  const height = safeNumber(raw.height);
  let left = safeNumber(raw.left);
  let top = safeNumber(raw.top);

  const viewportWidth = Math.max(800, window.innerWidth || 0);
  const viewportHeight = Math.max(600, window.innerHeight || 0);
  const safeWidth = width ? Math.min(Math.max(width, 360), Math.max(360, viewportWidth - 40)) : undefined;
  const safeHeight = height ? Math.min(Math.max(height, 260), Math.max(260, viewportHeight - 40)) : undefined;

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
  if (layout?.windows?.[key]) return clampGeometry(layout.windows[key]);

  // One-time backwards-compatible fallback for the old Yomi-only setting.
  if (key === "yomiDirector") {
    try {
      const raw = game.settings.get(SYSTEM_ID, "tejidoDeYomiWindow");
      if (raw) {
        const legacy = JSON.parse(raw);
        if (legacy && typeof legacy === "object") return clampGeometry(legacy);
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
  layout.windows[key] = clampGeometry(geometry);
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