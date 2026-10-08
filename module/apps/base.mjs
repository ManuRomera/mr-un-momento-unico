import { ApplicationV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { WithMemory } from "../memory.mjs";

/**
 * Base de las ventanas del sistema: memoria de ventana, una instancia por clase
 * y teclado en los elementos que actúan como botón sin serlo.
 */
export class SystemApp extends WithMemory(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS = { classes: ["mr-umu", "umu-window"], window: { resizable: true } };
  static #instances = new Map();

  /** Abre (o trae al frente) la única ventana de esta clase. `options` son opciones de render, p. ej. `{ tab }`. */
  static open(options = {}) {
    let app = SystemApp.#instances.get(this);
    if (!app) { app = new this(); SystemApp.#instances.set(this, app); }
    app.configure(options);
    if (app.rendered) app.bringToFront();
    return app.render({ force: true, ...options });
  }

  /** Punto de entrada para que una ventana reciba contexto al abrirse. */
  configure(options) {}

  static get instance() { return SystemApp.#instances.get(this) ?? null; }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const el of this.element.querySelectorAll("[role=button][data-action]")) {
      el.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        el.click();
      });
    }
  }
}

export const t = key => game.i18n.localize(key);
export const f = (key, data) => game.i18n.format(key, data);
