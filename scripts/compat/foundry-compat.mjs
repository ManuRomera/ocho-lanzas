/**
 * Small compatibility surface shared by Foundry VTT 13 and 14.
 * Keep version-specific lookups here instead of scattering version checks.
 */
export const ApplicationV1 = foundry.appv1?.api?.Application ?? globalThis.Application;
export const ActorSheetV1 = foundry.appv1?.sheets?.ActorSheet ?? globalThis.ActorSheet;
export const ItemSheetV1 = foundry.appv1?.sheets?.ItemSheet ?? globalThis.ItemSheet;

export function dialogV2() {
  const DialogV2 = foundry.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error("Ocho Lanzas requires Foundry DialogV2 (Foundry VTT 13+).");
  return DialogV2;
}

export function renderTemplate(path, data) {
  const renderer = foundry.applications?.handlebars?.renderTemplate ?? globalThis.renderTemplate;
  if (!renderer) throw new Error("Ocho Lanzas could not locate Foundry's Handlebars renderer.");
  return renderer(path, data);
}

export function loadTemplates(paths) {
  const loader = foundry.applications?.handlebars?.loadTemplates ?? globalThis.loadTemplates;
  if (!loader) throw new Error("Ocho Lanzas could not locate Foundry's Handlebars template loader.");
  return loader(paths);
}