/**
 * Empaqueta el sistema: dist/mr-un-momento-unico.zip + dist/system.json
 * y las notas de la versión (sección del CHANGELOG) para la release.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const out = join(dist, "mr-un-momento-unico");
const FILES = ["mr-un-momento-unico.mjs", "system.json", "LICENSE", "NOTICE.md", "README.md", "CHANGELOG.md", "module", "styles", "templates", "lang", "assets", "docs"];

await rm(dist, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const p of FILES) await cp(join(root, p), join(out, p), { recursive: true });
await cp(join(root, "system.json"), join(dist, "system.json"));

const { version } = JSON.parse(await readFile(join(root, "system.json"), "utf8"));
const changelog = await readFile(join(root, "CHANGELOG.md"), "utf8");
const section = changelog.split(/^## /m).find(s => s.startsWith(`${version}`) || s.startsWith(`[${version}]`));
await writeFile(join(dist, "release-notes.md"), section ? `## ${section.trim()}\n` : `Versión ${version}\n`);

const zip = spawnSync("zip", ["-qrX", "mr-un-momento-unico.zip", "mr-un-momento-unico"], { cwd: dist, stdio: "inherit" });
if (zip.status !== 0) throw new Error("No se pudo crear el ZIP");
console.log(`✓ dist/mr-un-momento-unico.zip (${version})`);
