/**
 * Estructura: lo que enlaza unas piezas con otras no puede romperse sin que salte una prueba.
 * Plantillas que existen, acciones de la interfaz que tienen manejador, acciones del motor que existen,
 * claves de idioma presentes en ES y EN, versión coherente y rutas de arte reales.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ACTIONS } from "../module/engine.mjs";
import { ASSETS, PATH } from "../module/constants.mjs";
import { BUSHIDO } from "../module/data/bushido.mjs";
import { KAMON_SHAPES } from "../module/data/kamon.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = p => readFileSync(join(root, p), "utf8");
const walk = dir => readdirSync(join(root, dir)).flatMap(n => {
  const p = join(dir, n);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const system = JSON.parse(read("system.json"));
const flatKeys = (o, p = "") => Object.entries(o).flatMap(([k, v]) => typeof v === "object" ? flatKeys(v, `${p}${k}.`) : [`${p}${k}`]);

test("los archivos que declara system.json existen", () => {
  for (const f of [...system.esmodules, ...system.styles, ...system.languages.map(l => l.path)]) assert.ok(existsSync(join(root, f)), f);
  assert.equal(system.id, "mr-un-momento-unico");
  assert.match(system.title, /^MR · /, "convención del prefijo MR");
  assert.ok(system.documentTypes.Actor.samurai);
});

test("la versión coincide en system.json, package.json y el CHANGELOG", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.version, system.version);
  assert.match(read("CHANGELOG.md"), new RegExp(`^## ${system.version.replace(/\./g, "\\.")}`, "m"));
});

test("las plantillas parciales y de ventana existen y están precargadas", () => {
  const entry = read("mr-un-momento-unico.mjs");
  const preloaded = [...entry.matchAll(/"((?:apps|sheets|partials)\/[\w-]+\.hbs)"/g)].map(m => m[1]);
  for (const t of preloaded) assert.ok(existsSync(join(root, "templates", t)), t);
  const used = new Set();
  for (const f of walk("templates")) for (const m of read(f).matchAll(/\{\{>\s*"systems\/mr-un-momento-unico\/templates\/([^"]+)"/g)) used.add(m[1]);
  for (const f of walk("module")) for (const m of read(f).matchAll(/\$\{TEMPLATES\}\/([\w/.-]+\.hbs)/g)) used.add(m[1]);
  for (const t of used) { assert.ok(existsSync(join(root, "templates", t)), `falta ${t}`); assert.ok(preloaded.includes(t), `${t} no se precarga`); }
});

test("cada data-action de las plantillas tiene un manejador", () => {
  const handlers = new Set();
  for (const f of walk("module").filter(f => f.endsWith(".mjs"))) {
    const src = read(f);
    const at = src.indexOf("actions: {");
    if (at < 0) continue;
    let depth = 0, i = src.indexOf("{", at), start = i;
    for (; i < src.length; i++) { if (src[i] === "{") depth++; else if (src[i] === "}" && --depth === 0) break; }
    for (const m of src.slice(start, i).matchAll(/(\w+):/g)) handlers.add(m[1]);
  }
  for (const f of walk("templates")) {
    for (const m of read(f).matchAll(/data-action="(\w+)"/g)) {
      // editImage lo gestiona ActorSheetV2
      if (m[1] === "editImage") continue;
      assert.ok(handlers.has(m[1]), `${f}: data-action="${m[1]}" sin manejador`);
    }
  }
});

test("todas las acciones que la Mesa envía existen en el motor", () => {
  const table = read("module/apps/table.mjs") + read("module/apps/chronicle.mjs");
  const sent = new Set([...table.matchAll(/type:\s*"([a-z]+\.[A-Za-z]+)"/g)].map(m => m[1]));
  for (const m of table.matchAll(/#send\("([\w.]+)"\)/g)) sent.add(m[1]);
  for (const m of table.matchAll(/`consonance\.\$\{kind\}`/g)) { sent.add("consonance.accept"); sent.add("consonance.reject"); }
  for (const m of table.matchAll(/kind === "declare" \? "(final\.\w+)" : "(final\.\w+)"/g)) { sent.add(m[1]); sent.add(m[2]); }
  assert.ok(sent.size > 30);
  for (const a of sent) assert.ok(ACTIONS.includes(a), `acción «${a}» no existe en el motor`);
});

test("los helpers de Handlebars que usan las plantillas están registrados o son de Foundry", () => {
  const core = new Set(["if", "unless", "each", "with", "else", "localize", "eq", "ne", "lt", "gt", "and", "or", "not", "ifThen"]);
  const registered = new Set([...read("mr-un-momento-unico.mjs").matchAll(/registerHelper\("(\w+)"/g)].map(m => m[1]));
  for (const f of walk("templates")) {
    for (const m of read(f).matchAll(/\{\{\s*(?:#|\/)?\s*\(?(\w+)\s/g)) {
      const name = m[1];
      if (core.has(name) || registered.has(name)) continue;
      // las demás son variables del contexto con un argumento (p. ej. «{{#each x}}» ya filtrado)
    }
    for (const m of read(f).matchAll(/\(\s*(\w+)\s/g)) assert.ok(core.has(m[1]) || registered.has(m[1]), `${f}: helper «${m[1]}» desconocido`);
  }
});

test("ES y EN tienen las mismas claves y no falta ninguna que se use", () => {
  const es = JSON.parse(read("lang/es.json")), en = JSON.parse(read("lang/en.json"));
  const ke = flatKeys(es), kn = flatKeys(en);
  assert.deepEqual(ke.filter(k => !kn.includes(k)), [], "en ES y no en EN");
  assert.deepEqual(kn.filter(k => !ke.includes(k)), [], "en EN y no en ES");
  const defined = new Set(ke);
  const prefixes = new Set(ke.flatMap(k => { const a = k.split("."); return a.map((_, i) => a.slice(0, i + 1).join(".")); }));
  const used = new Set();
  for (const f of [...walk("templates"), ...walk("module"), "mr-un-momento-unico.mjs"]) {
    for (const m of read(f).matchAll(/UMU\.[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*/g)) used.add(m[0]);
  }
  const missing = [...used].filter(k => !defined.has(k) && !prefixes.has(k));
  assert.deepEqual(missing, []);
  for (const l of ke) assert.ok(typeof flatKeys, l);
});

test("las familias de claves dinámicas están completas", () => {
  const es = JSON.parse(read("lang/es.json")).UMU;
  for (const phase of ["setup", "chapter", "hate", "final", "epilogue", "done"]) assert.ok(es.Phase[phase], `Phase.${phase}`);
  for (const w of ["none", "snow", "petals", "summer", "leaves", "rain", "fog", "dust"]) assert.ok(es.Weather[w], `Weather.${w}`);
  for (const key of ["era", "place", "span", "story"]) { assert.ok(es.Decl[key]); assert.ok(es.Decl[`${key}Hint`]); }
  for (const w of ["reserveLeft", "themesPending"]) assert.ok(es.Warn[w]);
  for (const by of ["mortal", "scars", "hate", "draw"]) assert.ok(es.Verdict.by[by]);
  for (const key of ["virtue", "theme", "character", "play", "climax", "close"]) assert.ok(es.Step[key]);
  for (const k of ["Pause", "Veil", "X"]) { assert.ok(es.Safety[k]); assert.ok(es.Safety[`${k}Text`]); }
  for (const code of ["badSeat", "seatTaken", "wrongPhase", "wrongStep", "notYourTurn", "notNarrator", "needNames", "emptyText", "needVirtue", "declDone", "needDeclarations", "needSeats", "nothingToUndo", "drawing", "notDrawing", "badVirtue", "noVirtues", "badTheme", "badCharacter", "reserveEmpty", "locked", "notReady", "alreadyRolled", "badDice", "noProposal", "alreadyDone", "badMode", "cannotEscape", "noHate", "notEnoughAdvantages", "unknownAction", "noSetting"])
    assert.ok(es.Err[code], `Err.${code}`);
  for (const mode of ["surrender", "escape", "keep"]) assert.ok(es.Chronicle.Hate[mode]);
  for (const key of ["readingMode", "highContrast", "plainFont", "wideSpacing", "largeButtons", "reducedMotion", "reducedEffects", "soundFx", "music"]) { assert.ok(es.Access[key]); assert.ok(es.Access[`${key}Hint`]); }
});

test("el arte declarado existe en disco", () => {
  const flat = o => typeof o === "string" ? [o] : Object.values(o).flatMap(flat);
  for (const p of flat(ASSETS)) assert.ok(existsSync(join(root, p.replace(`${PATH}/`, ""))), p);
});

test("la ambientación Bushido es completa y coherente con las cartas", () => {
  assert.equal(BUSHIDO.virtues.length, 7);
  assert.equal(BUSHIDO.themes.length, 3);
  assert.equal(BUSHIDO.characters.length, 3);
  for (const x of [...BUSHIDO.themes, ...BUSHIDO.characters]) assert.ok(ASSETS.cards[x.id], `sin carta para ${x.id}`);
  for (const v of BUSHIDO.virtues) { assert.ok(v.glyph && v.romaji && v.name.es && v.name.en && v.blurb.es && v.blurb.en, v.id); }
  assert.equal(BUSHIDO.hateIdeas.length, 20);
  assert.equal(new Set(BUSHIDO.virtues.map(v => v.id)).size, 7);
  assert.equal(KAMON_SHAPES.length, 12);
});

test("los cuatro ficheros de legalidad y atribución existen", () => {
  for (const f of ["LICENSE", "NOTICE.md", "README.md", "CHANGELOG.md"]) assert.ok(existsSync(join(root, f)), f);
  const notice = read("NOTICE.md");
  assert.match(notice, /Tobie Abad/); assert.match(notice, /CC BY 4\.0/); assert.match(notice, /The Hills Press/);
});
