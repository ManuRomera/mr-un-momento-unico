/**
 * Enrutamiento de compatibilidad Foundry VTT 13 ↔ 14.
 * Todo acceso a una API que haya cambiado de nombre o de sitio pasa por aquí;
 * el resto del sistema nunca pregunta por la versión.
 *
 * | Necesidad              | v13                                  | v14                                 |
 * |------------------------|--------------------------------------|-------------------------------------|
 * | Apps, hojas, diálogos  | foundry.applications.api / sheets    | igual                               |
 * | Controles de escena    | registro de objetos + onChange       | igual                               |
 * | Fondo de escena        | Scene.background.src                 | Scene.levels (background heredado)  |
 */
const f = globalThis.foundry;
const api = f?.applications?.api ?? {};

export const ApplicationV2 = api.ApplicationV2;
export const HandlebarsApplicationMixin = api.HandlebarsApplicationMixin;
export const DialogV2 = api.DialogV2;
export const ActorSheetV2 = f?.applications?.sheets?.ActorSheetV2;
export const ItemSheetV2 = f?.applications?.sheets?.ItemSheetV2;
export const DocumentSheetConfig = f?.applications?.apps?.DocumentSheetConfig;
export const ImagePopout = f?.applications?.apps?.ImagePopout;
export const renderTemplate = f?.applications?.handlebars?.renderTemplate;
export const loadTemplates = f?.applications?.handlebars?.loadTemplates;
const textEditor = () => f.applications.ux.TextEditor.implementation;

/** Generación leída en el momento: `game.release` no existe mientras se evalúa el módulo. */
export function generation() {
  return Number(game.release?.generation) || Number(String(game.version).split(".")[0]) || 0;
}

/** APIs que el sistema necesita, con su presencia real. La usa el diagnóstico. */
export function apiReport() {
  return {
    ApplicationV2: typeof ApplicationV2 === "function",
    HandlebarsApplicationMixin: typeof HandlebarsApplicationMixin === "function",
    DialogV2: typeof DialogV2 === "function",
    ActorSheetV2: typeof ActorSheetV2 === "function",
    ItemSheetV2: typeof ItemSheetV2 === "function",
    DocumentSheetConfig: typeof DocumentSheetConfig?.registerSheet === "function",
    Cards: typeof globalThis.Cards === "function"
  };
}

export const escapeHTML = text => f.utils.escapeHTML(String(text ?? ""));

export const enrich = (html, relativeTo) => textEditor().enrichHTML(html ?? "", {
  relativeTo, secrets: relativeTo?.isOwner ?? game.user?.isGM ?? false
});

/**
 * Grupo propio en los controles de escena. La herramienta activa por defecto es inerte:
 * así, al pulsar el grupo no se abre nada por sorpresa; cada botón abre su ventana.
 */
export function addControlGroup(controls, { name, title, icon, tools }) {
  if (!controls || controls[name]) return;
  const entries = { home: { name: "home", title, icon, order: 0 } };
  tools.forEach((tool, i) => {
    entries[tool.name] = {
      ...tool, button: true, order: i + 1,
      onChange: (event, active) => { if (active !== false) tool.onChange(event); }
    };
  });
  controls[name] = { name, title, icon, order: Object.keys(controls).length + 1, activeTool: "home", tools: entries };
}

/** Datos de la escena de bienvenida con fondo en ambas generaciones. */
export function welcomeSceneData({ name, src, width = 1920, height = 1080 }) {
  const data = {
    name, width, height, padding: 0, active: true, navigation: true,
    background: { src }, backgroundColor: "#0b0a09",
    grid: { type: 0, size: 100, distance: 1, units: "" },
    tokenVision: false, fog: { exploration: false },
    environment: { globalLight: { enabled: true } }
  };
  // v14 organiza las escenas por niveles y migra `background` al primer nivel por sí mismo.
  return data;
}

/** Mostrar una imagen a todos los jugadores (handouts). */
export async function shareImage(src, title) {
  if (!ImagePopout) return;
  const popout = new ImagePopout({ src, window: { title } });
  await popout.render(true);
  if (game.user.isGM) popout.shareImage?.();
}
