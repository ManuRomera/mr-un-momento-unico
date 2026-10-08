/**
 * Validación estática rápida: sintaxis de todos los módulos, JSON válidos y
 * que cada ruta de arte declarada exista. Las pruebas de verdad están en tests/.
 */
import { access, readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";
import { ASSETS, PATH } from "../module/constants.mjs";

const root = new URL("../", import.meta.url).pathname;
const errors = [];
async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    if (["dist", "node_modules", ".git"].includes(name)) continue;
    const p = join(dir, name);
    if ((await stat(p)).isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
const files = await walk(root);
for (const file of files.filter(f => f.endsWith(".mjs"))) {
  const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (r.status !== 0) errors.push(`${relative(root, file)}\n${r.stderr}`);
}
for (const file of files.filter(f => f.endsWith(".json"))) {
  try { JSON.parse(await readFile(file, "utf8")); } catch (e) { errors.push(`${relative(root, file)}: ${e.message}`); }
}
const flat = o => typeof o === "string" ? [o] : Object.values(o).flatMap(flat);
const assets = flat(ASSETS);
for (const p of assets) {
  try { await access(join(root, p.replace(`${PATH}/`, ""))); } catch { errors.push(`Falta el arte: ${p}`); }
}
if (errors.length) { console.error(errors.join("\n\n")); process.exit(1); }
console.log(`✓ ${files.filter(f => f.endsWith(".mjs")).length} módulos · ${files.filter(f => f.endsWith(".json")).length} JSON · ${assets.length} rutas de arte`);
