import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
const fail = (msg) => { console.error(`ERROR: ${msg}`); process.exitCode = 1; };
const note = (msg) => console.log(`OK: ${msg}`);

let manifest;
try { manifest = JSON.parse(read("system.json")); note("system.json válido"); }
catch (err) { fail(`system.json inválido: ${err.message}`); process.exit(1); }

for (const p of [...(manifest.esmodules ?? []), ...(manifest.styles ?? [])]) {
  if (!exists(p)) fail(`ruta declarada inexistente: ${p}`);
}
for (const lang of manifest.languages ?? []) if (!exists(lang.path)) fail(`idioma inexistente: ${lang.path}`);
for (const pack of manifest.packs ?? []) {
  if (!exists(pack.path)) fail(`pack inexistente: ${pack.path}`);
  if (String(pack.path).endsWith(".db")) fail(`pack legacy .db declarado: ${pack.path}`);
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const textExt = new Set([".mjs", ".js", ".json", ".hbs", ".css", ".html", ".md", ".yml", ".yaml"]);
const files = walk(root).filter((f) => !f.includes(`${path.sep}.git${path.sep}`) && textExt.has(path.extname(f)));
const banned = [
  ["fonts.googleapis.com", "Google Fonts remoto"],
  ["Comic Sans MS", "Comic Sans"],
  ["Brush Script MT", "Brush Script"],
  ["el_tejido_de_yomi_pack_v10/assets/", "ruta antigua de assets Yomi"]
];

for (const file of files) {
  const rel = path.relative(root, file);
  const content = fs.readFileSync(file, "utf8");
  if (rel === path.join("tools", "validate-release.mjs")) continue;
  if (rel.startsWith(`templates${path.sep}`) && /<style\b/i.test(content)) fail(`CSS inline <style> en plantilla: ${rel}`);
  for (const [needle, label] of banned) {
    const isLegacyMigrationReference = rel === path.join("scripts", "migrations.mjs") && needle === "el_tejido_de_yomi_pack_v10/assets/";
    if (!isLegacyMigrationReference && content.includes(needle)) fail(`${label} detectado en ${rel}`);
  }

  for (const match of content.matchAll(/systems\/ocho-lanzas\/([A-Za-z0-9_./()\- áéíóúñÑ]+?\.(?:png|webp|jpg|jpeg|svg|mp3|ogg|html|hbs))/gi)) {
    const target = match[1].trim();
    if (!exists(target)) fail(`recurso referenciado pero inexistente en ${rel}: ${target}`);
  }
}

for (const p of ["lang/es.json", "lang/ca.json"]) {
  try { JSON.parse(read(p)); note(`${p} válido`); }
  catch (err) { fail(`${p} inválido: ${err.message}`); }
}

for (const p of [
  "templates/actors/character.hbs", "templates/actors/npc.hbs", "templates/actors/bakemono.hbs",
  "templates/items/item.hbs", "templates/dialogs/roll-dialog.hbs", "templates/dialogs/purify-dialog.hbs",
  "templates/apps/welcome.hbs", "assets/adventures/el_tejido_de_yomi.html",
  "assets/ui/curse/curse-seal-center.svg", "assets/ui/curse/curse-pip-empty.svg",
  "assets/ui/curse/curse-pip-active.svg", "assets/ui/curse/curse-pip-permanent.svg",
  "assets/ui/curse/curse-pip-bakemono.svg", "assets/ui/seals/seal-ocho-lanzas.svg",
  "assets/ui/dividers/divider-ink-thread.svg", "assets/ui/bakemono/bakemono-mark.svg"
]) if (!exists(p)) fail(`archivo obligatorio ausente: ${p}`);

for (const legacy of ["styles/ocho-lanzas.css", "styles/ocho-lanzas-v5.css", "styles/tejido-de-yomi.css"]) {
  if (exists(legacy)) fail(`CSS histórico todavía presente: ${legacy}`);
}

const expectedStyles = [
  "styles/ol-core.css", "styles/ol-character.css", "styles/ol-curse.css", "styles/ol-npc.css", "styles/ol-bakemono.css",
  "styles/ol-items.css", "styles/ol-dialogs.css", "styles/ol-chat.css", "styles/ol-welcome.css", "styles/ol-yomi.css"
];
for (const style of expectedStyles) if (!(manifest.styles ?? []).includes(style)) fail(`hoja visual no declarada: ${style}`);

for (const file of files.filter((f) => path.extname(f) === ".css")) {
  const rel = path.relative(root, file);
  const css = fs.readFileSync(file, "utf8");
  for (const m of css.matchAll(/font-size:\s*([0-9.]+)px/g)) {
    if (Number(m[1]) < 10.5) fail(`microtexto funcional <10.5px en ${rel}: ${m[0]}`);
  }
  for (const m of css.matchAll(/font:\s*[^;]*?([0-9.]+)px\//g)) {
    if (Number(m[1]) < 10.5) fail(`microtexto funcional en shorthand <10.5px en ${rel}: ${m[0]}`);
  }
}

if (manifest.version !== "0.6.0") fail(`versión inesperada en manifest: ${manifest.version}`);
if (!String(manifest.download ?? "").includes("releases/latest/download")) fail("download no apunta a releases");
if (!String(manifest.manifest ?? "").includes("releases/latest/download")) fail("manifest no apunta a releases");

if (!process.exitCode) note("validación estática completada");