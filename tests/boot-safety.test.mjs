/**
 * Seguridad de arranque: lo que provocó la «pantalla negra» no puede volver.
 *  - la Mesa no se abre sola;
 *  - ninguna ventana nace más grande que una pantalla corriente;
 *  - el CSS no toca la interfaz de Foundry;
 *  - las capas a pantalla completa son solo las efímeras y se pueden cerrar;
 *  - cada fase de arranque está aislada.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = p => readFileSync(join(root, p), "utf8");
const walk = dir => readdirSync(join(root, dir)).flatMap(n => {
  const p = join(dir, n);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const code = ["mr-un-momento-unico.mjs", ...walk("module").filter(p => p.endsWith(".mjs"))];
const entry = read("mr-un-momento-unico.mjs");

test("la Mesa solo se muestra al entrar por Table.start: a pantalla completa si no está oculta, en ventana si se pidió", () => {
  const settings = read("module/settings.mjs");
  assert.match(settings, /register\(SYSTEM_ID, "openOnStart", \{[^}]*scope: "client"[^}]*default: false/s);
  assert.match(settings, /register\(SYSTEM_ID, "tableMode", \{[^}]*scope: "client"/s);
  assert.match(settings, /register\(SYSTEM_ID, "tableHidden", \{[^}]*scope: "client"[^}]*default: false/s);
  for (const file of code) assert.doesNotMatch(read(file), /autoOpen/, `${file} usa el ajuste antiguo autoOpen`);
  const ready = entry.slice(entry.indexOf('Hooks.once("ready"'), entry.indexOf("async function ensureScene"));
  const opens = ready.split("\n").filter(l => /openApp\("table"\)|TableApp\.open|ScreenTable\.open|Table\.open|Table\.start/.test(l));
  assert.equal(opens.length, 1);
  assert.match(opens[0], /Table\.start/);
  const screen = read("module/apps/screen.mjs");
  const start = screen.slice(screen.indexOf("async start()"), screen.indexOf("async reopen()"));
  assert.match(start, /this\.hidden/, "a pantalla completa respeta la Mesa oculta");
  assert.match(start, /get\("openOnStart"\)/, "en ventana solo si el usuario lo pidió");
});

test("la escena de bienvenida no abre ninguna ventana", () => {
  const fn = entry.slice(entry.indexOf("async function ensureScene"), entry.indexOf("/*  Accesos visibles"));
  assert.doesNotMatch(fn, /openApp|\.render\(|\.open\(/);
  assert.match(fn, /sceneReady/, "solo una vez por mundo");
  assert.match(fn, /onlyCoreDefault/, "no sustituye escenas del usuario");
});

test("cada fase del arranque está aislada en bootPhase", () => {
  const init = entry.slice(entry.indexOf('Hooks.once("init"'), entry.indexOf('Hooks.once("ready"'));
  const body = init.split("\n").slice(1, -2).filter(l => /^\s{2}\S/.test(l));
  for (const line of body) assert.match(line, /^\s{2}(bootPhase|console\.info|\}\);)/, line);
  for (const hook of ["getSceneControlButtons", "renderActorDirectory", "renderJournalDirectory", "renderSettings"]) {
    const start = entry.indexOf(`Hooks.on("${hook}"`);
    assert.ok(start > 0, hook);
    assert.match(entry.slice(start, start + 200), /try \{/, `${hook} sin try`);
  }
});

test("ninguna ventana nace más grande que 1400×900", () => {
  for (const file of code) {
    for (const m of read(file).matchAll(/position:\s*\{\s*width:\s*(\d+|"auto")\s*,\s*height:\s*(\d+|"auto")/g)) {
      if (m[1] !== '"auto"') assert.ok(Number(m[1]) <= 1400, `${file}: ancho ${m[1]}`);
      if (m[2] !== '"auto"') assert.ok(Number(m[2]) <= 900, `${file}: alto ${m[2]}`);
    }
    if (file !== "module/apps/screen.mjs") assert.doesNotMatch(read(file), /frame:\s*false/, `${file}: ventana sin marco (no se podría cerrar)`);
  }
  const welcome = read("module/apps/welcome.mjs").match(/width:\s*(\d+)/);
  assert.ok(Number(welcome[1]) <= 520, "el aviso de bienvenida debe ser pequeño");
});

/* -------------------------------------------- */
/*  CSS                                         */
/* -------------------------------------------- */

function rules(css) {
  const out = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0, buf = "", stack = [];
  for (const ch of clean) {
    if (ch === "{") {
      const sel = buf.trim(); buf = "";
      stack.push(sel);
      depth++;
    } else if (ch === "}") {
      const sel = stack.pop();
      if (sel && !sel.startsWith("@")) out.push({ selector: sel, body: buf, parents: [...stack] });
      buf = "";
      depth--;
    } else buf += ch;
  }
  return out;
}
const css = ["styles/system.css", "styles/accessibility.css"].map(read).join("\n");
const allRules = rules(css).filter(r => !r.parents.some(p => p.startsWith("@keyframes")));

test("todo selector está limitado al sistema", () => {
  const bad = [];
  for (const { selector } of allRules) {
    for (const s of selector.split(/,(?![^(]*\))/).map(x => x.trim())) {
      if (s === ":root") continue;
      const scoped = /\.mr-umu\b/.test(s) || /^\.umu-[a-z-]+(\s|$|\.|:)/.test(s) || /^\.umu-[a-z-]+$/.test(s);
      if (!scoped) bad.push(s);
    }
  }
  assert.deepEqual(bad, []);
});

test("sin reglas destructivas sobre la interfaz de Foundry", () => {
  const bad = [];
  for (const { selector, body } of allRules) {
    if (/(^|[\s,>])(html|body|#board|#ui-left|#ui-right|#ui-top|#ui-bottom|#interface|#sidebar|#scene-controls|#hotbar|#players|#navigation|canvas)\b/.test(selector)) bad.push(selector);
    if (/^\s*\*|,\s*\*\s*\{/.test(selector)) bad.push(selector);
    if (/display:\s*none/.test(body) && !/\.mr-umu|\.umu-/.test(selector)) bad.push(selector);
  }
  assert.deepEqual(bad, []);
});

test("solo la señal de seguridad ocupa la pantalla entera, y se puede cerrar", () => {
  const allowed = [".mr-umu.umu-safety-signal", ".umu-screen-app", ".umu-backdrop", ".umu-pill", ".mr-umu .umu-table.screen", ".mr-umu .umu-hide-btn"];
  const fixed = allRules.filter(r => /position:\s*fixed/.test(r.body)).map(r => r.selector);
  for (const s of fixed) assert.ok(allowed.some(a => s.startsWith(a)), `position: fixed en ${s}`);
  const safety = read("module/apps/safety.mjs");
  assert.match(safety, /safety-clear/);
  assert.match(safety, /button\.focus\(\)/);
});

test("las ventanas del sistema tienen tope de tamaño en CSS", () => {
  const app = allRules.find(r => r.selector === ".application.mr-umu");
  assert.match(app.body, /max-width:\s*calc\(100vw/);
  assert.match(app.body, /max-height:\s*calc\(100vh/);
});

test("se respeta prefers-reduced-motion", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(read("module/settings.mjs"), /prefers-reduced-motion/);
});

test("los estilos de botón no tocan los controles de cabecera de Foundry (sus iconos)", () => {
  for (const { selector, body } of allRules) {
    for (const s of selector.split(/,(?![^(]*\))/).map(x => x.trim())) {
      if (!/\bbutton(?![.\w-])/.test(s) || /header-control|window-content|\.umu-/.test(s)) continue;
      if (/font|background|border|padding|height/.test(body)) assert.fail(`«${s}» alcanzaría los botones de cabecera`);
    }
  }
});

test("nadie escribe en el Proxy position de ApplicationV2 (un 0 lanza TypeError)", () => {
  for (const file of code) {
    assert.doesNotMatch(read(file), /Object\.assign\(this\.position|this\.position\.\w+\s*=[^=]/, `${file} escribe en this.position`);
  }
});

test("la Mesa a pantalla completa siempre se puede ocultar y recuperar", () => {
  const screen = read("module/apps/screen.mjs");
  assert.match(screen, /frame:\s*false/);
  assert.match(screen, /positioned:\s*false/);
  assert.match(screen, /umu-pill/);
  assert.match(screen, /set\("tableHidden"/);
  assert.match(read("templates/apps/table.hbs"), /data-action="hide"/);
  assert.match(entry, /Table\.toggle\(\)[\s\S]*umuChronicle/, "herramienta de escena que alterna");
  assert.match(entry, /onDown: \(\) => \{ Table\.toggle\(\)/, "atajo de teclado que alterna");
  // la capa de pantalla completa deja pasar el ratón a la escena y no tapa los controles de Foundry (z-index 30)
  const layer = allRules.find(r => r.selector === ".umu-screen-app");
  assert.match(layer.body, /pointer-events:\s*none/);
  assert.match(layer.body, /z-index:\s*20\b/);
});
