/**
 * MR · Un momento único — arranque.
 *
 * Regla de oro: el sistema nunca puede dejar Foundry inservible. Cada fase va aislada en `bootPhase`:
 * si falla, avisa, lo anota para el diagnóstico y el resto sigue. Nada se abre solo al entrar;
 * la Mesa se abre a petición (o con el ajuste «Abrir la Mesa al entrar»).
 */
import { DATA_MODELS } from "./module/models.mjs";
import { DocumentSheetConfig, addControlGroup, loadTemplates, welcomeSceneData } from "./module/compat.mjs";
import { ASSETS, LOG, SYSTEM_ID, TEMPLATES } from "./module/constants.mjs";
import { applyPreferences, registerMenus, registerSettings } from "./module/settings.mjs";
import { BOOT, bootPhase, diagnostic } from "./module/services/diagnostic.mjs";
import { SamuraiSheet } from "./module/sheets/samurai.mjs";
import { Apps, openApp } from "./module/apps/registry.mjs";
import { TableApp } from "./module/apps/table.mjs";
import { ChronicleApp } from "./module/apps/chronicle.mjs";
import { AccessPanel } from "./module/apps/access.mjs";
import { SafetyPanel } from "./module/apps/safety.mjs";
import { WelcomeApp } from "./module/apps/welcome.mjs";
import { DiagnosticApp } from "./module/apps/diagnostic.mjs";
import { GameService, registerSetting } from "./module/services/game.mjs";
import { SoundService } from "./module/services/sound.mjs";

const TEMPLATE_FILES = [
  "apps/table.hbs", "apps/chronicle.hbs", "apps/access.hbs", "apps/safety.hbs", "apps/welcome.hbs", "apps/diagnostic.hbs",
  "sheets/samurai.hbs", "partials/seat.hbs", "partials/setup.hbs", "partials/between.hbs", "partials/chapter.hbs",
  "partials/hate.hbs", "partials/final.hbs", "partials/epilogue.hbs"
].map(p => `${TEMPLATES}/${p}`);

/* -------------------------------------------- */
/*  init                                        */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.info(`${LOG} ${game.system.version} · inicializando`);

  bootPhase("models", () => { Object.assign(CONFIG.Actor.dataModels, DATA_MODELS.Actor); });

  bootPhase("settings", () => {
    registerSettings();
    registerMenus({ AccessPanel, DiagnosticApp });
  });

  bootPhase("sheets", () => {
    DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, SamuraiSheet, { types: ["samurai"], makeDefault: true, label: "UMU.Sheet.Samurai" });
  });

  bootPhase("templates", () => {
    Handlebars.registerHelper("diceFill", n => Array.from({ length: Math.max(0, Number(n) || 0) }, (_, i) => i));
    Handlebars.registerHelper("isEven", n => Number(n) % 2 === 0);
    return loadTemplates(TEMPLATE_FILES);
  });

  bootPhase("apps", () => {
    Object.assign(Apps, { table: TableApp, chronicle: ChronicleApp, access: AccessPanel, safety: SafetyPanel, welcome: WelcomeApp, diagnostic: DiagnosticApp });
    game.keybindings.register(SYSTEM_ID, "openTable", {
      name: "UMU.Keys.Table", hint: "UMU.Keys.TableHint",
      editable: [{ key: "KeyU", modifiers: ["Alt"] }],
      onDown: () => { openApp("table"); return true; }
    });
  });

  bootPhase("api", () => {
    game.mrUnMomentoUnico = Object.freeze({
      open: () => openApp("table"), table: () => openApp("table"), chronicle: () => openApp("chronicle"),
      safety: () => openApp("safety"), access: () => openApp("access"),
      state: () => GameService.state(), registerSetting, settings: () => GameService.settings().map(s => s.id),
      /** Informe copiable. `game.mrUnMomentoUnico.diagnostic({ show: true })` abre la ventana. */
      diagnostic: async ({ show = false } = {}) => {
        const report = await diagnostic();
        console.info(`${LOG} diagnóstico`, report);
        if (show) openApp("diagnostic");
        return report;
      },
      boot: BOOT
    });
  });
});

/* -------------------------------------------- */
/*  ready                                       */
/* -------------------------------------------- */

Hooks.once("ready", async () => {
  bootPhase("preferences", applyPreferences);
  bootPhase("sound", () => SoundService.init());
  bootPhase("safety", () => SafetyPanel.init());
  bootPhase("live", () => { TableApp.init(); ChronicleApp.init(); });

  if (game.user.isGM) {
    await bootPhase("game", () => GameService.ensure());
    await bootPhase("scene", ensureScene);
  }

  console.info(`${LOG} listo · Foundry ${game.version}`, BOOT.errors.length ? BOOT.errors : "sin errores");
  if (game.user.isGM) bootPhase("welcome", () => WelcomeApp.maybeShow());
  if (game.settings.get(SYSTEM_ID, "openOnStart")) bootPhase("openOnStart", () => openApp("table"));
});

/**
 * Un mundo nuevo no debe quedarse vacío: se crea una escena de bienvenida una sola vez, sin abrir ventanas.
 * Foundry 13 crea su propia escena de bienvenida (NUEDEFAULTSCENE0); si es la única, se sustituye como activa.
 */
async function ensureScene() {
  if (game.settings.get(SYSTEM_ID, "sceneReady")) return;
  const onlyCoreDefault = game.scenes.size === 1 && game.scenes.has("NUEDEFAULTSCENE0");
  if (game.scenes.size && !onlyCoreDefault) return game.settings.set(SYSTEM_ID, "sceneReady", true);
  const scene = await Scene.implementation.create(welcomeSceneData({ name: game.i18n.localize("UMU.App.Table"), src: ASSETS.scene }));
  if (scene && !scene.active) await scene.activate();
  await scene?.view();
  await game.settings.set(SYSTEM_ID, "sceneReady", true);
}

/* -------------------------------------------- */
/*  Accesos visibles                            */
/* -------------------------------------------- */

Hooks.on("getSceneControlButtons", controls => {
  try {
    const t = k => game.i18n.localize(k);
    addControlGroup(controls, {
      name: "umu", title: "MR · Un momento único", icon: "fa-solid fa-torii-gate",
      tools: [
        { name: "umuTable", title: t("UMU.App.Table"), icon: "fa-solid fa-torii-gate", onChange: () => openApp("table") },
        { name: "umuChronicle", title: t("UMU.App.Chronicle"), icon: "fa-solid fa-scroll", onChange: () => openApp("chronicle") },
        { name: "umuSafety", title: t("UMU.App.Safety"), icon: "fa-solid fa-shield-heart", onChange: () => openApp("safety") }
      ]
    });
  } catch (error) { console.error(`${LOG} controles de escena`, error); }
});

/** Botonera propia en el directorio de Actores. */
Hooks.on("renderActorDirectory", (app, html) => {
  try {
    const el = html instanceof HTMLElement ? html : html?.[0];
    if (!el || el.querySelector(".umu-directory-actions")) return;
    const bar = document.createElement("div");
    bar.className = "umu-directory-actions";
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<i class="fa-solid fa-torii-gate" aria-hidden="true"></i> ${foundry.utils.escapeHTML(game.i18n.localize("UMU.App.Table"))}`;
    b.addEventListener("click", () => openApp("table"));
    bar.append(b);
    (el.querySelector(".directory-header") ?? el).append(bar);
  } catch (error) { console.error(`${LOG} directorio de actores`, error); }
});

/** El diario que guarda la partida es del sistema: los jugadores no tienen por qué verlo en la barra lateral. */
Hooks.on("renderJournalDirectory", (app, html) => {
  try {
    if (game.user.isGM) return;
    const el = html instanceof HTMLElement ? html : html?.[0], id = GameService.doc()?.id;
    if (el && id) el.querySelector(`[data-entry-id="${id}"]`)?.remove();
  } catch (error) { console.error(`${LOG} directorio de diarios`, error); }
});

Hooks.on("renderSettings", (app, html) => {
  try {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".umu-settings-block")) return;
    const block = document.createElement("section");
    block.className = "umu-settings-block";
    block.innerHTML = `<h4 class="divider">MR · Un momento único</h4>`;
    for (const [label, icon, name] of [["UMU.App.Table", "fa-torii-gate", "table"], ["UMU.Access.Title", "fa-universal-access", "access"], ["UMU.Diagnostic.Title", "fa-stethoscope", "diagnostic"]]) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${foundry.utils.escapeHTML(game.i18n.localize(label))}`;
      b.addEventListener("click", () => openApp(name));
      block.append(b);
    }
    (root.querySelector("section.settings, .settings") ?? root.querySelector("section") ?? root).prepend(block);
  } catch (error) { console.error(`${LOG} ajustes`, error); }
});
