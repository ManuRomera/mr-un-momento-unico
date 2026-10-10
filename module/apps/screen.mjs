import { get, set } from "../settings.mjs";
import { GameService } from "../services/game.mjs";
import { TableApp } from "./table.mjs";

const t = key => game.i18n.localize(key);

/**
 * La Mesa a pantalla completa: el mismo panel de la Mesa del Duelo, pero sin marco de ventana.
 * Es una capa sobre la escena (z-index 20: por encima del lienzo, por debajo de los controles de Foundry y
 * de las ventanas). Siempre se puede ocultar: botón-ojo, pastilla fija, herramienta de escena y atajo de teclado.
 * El fondo (clima, claro, cine del Gran Final) es otra capa, `.umu-backdrop`, para poder mezclarse con la escena.
 */
export class ScreenTable extends TableApp {
  static SCREEN = true;
  static MEMORY = "screen";
  static DEFAULT_OPTIONS = {
    id: "umu-screen", tag: "div", classes: ["umu-screen-app"],
    window: { frame: false, positioned: false, resizable: false },
    actions: { hide: () => Table.hide() }
  };

  #backdrop = null;
  #watch = null;

  static init() {
    const refresh = doc => { if (doc.id === GameService.doc()?.id) ScreenTable.instance?.refresh(); };
    Hooks.on("updateJournalEntry", refresh);
    Hooks.on("createJournalEntry", refresh);
    Hooks.on("mrUmuPreferences", () => ScreenTable.instance?.sync());
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#paintBackdrop(context);
    this.#watchLayout();
    this.sync();
  }

  /** Aplica el estado «oculta» y recoloca el panel entre los controles de Foundry. */
  sync() {
    if (!this.rendered) return;
    const hidden = Boolean(get("tableHidden"));
    this.element.classList.toggle("umu-hidden", hidden);
    this.#backdrop?.classList.toggle("umu-hidden", hidden);
    this.layout();
  }

  /** El panel ocupa el hueco que dejan los controles de escena, la barra lateral y la barra de macros. */
  layout() {
    const el = this.element;
    if (!el) return;
    const box = selector => {
      const r = document.querySelector(selector)?.getBoundingClientRect();
      return r && r.width && r.height ? r : null;
    };
    const controls = box("#scene-controls"), sidebar = box("#sidebar"), hotbar = box("#hotbar");
    const vw = globalThis.innerWidth, vh = globalThis.innerHeight;
    const css = (name, px) => el.style.setProperty(name, `${Math.max(0, Math.round(px))}px`);
    css("--umu-left", controls ? controls.right + 16 : 16);
    css("--umu-top", 60);
    css("--umu-right", sidebar ? vw - sidebar.left + 12 : 16);
    css("--umu-bottom", hotbar ? vh - hotbar.top + 8 : 16);
  }

  #paintBackdrop(context) {
    if (!this.#backdrop) {
      this.#backdrop = document.createElement("div");
      this.#backdrop.className = "umu-backdrop";
      this.#backdrop.setAttribute("aria-hidden", "true");
      document.body.append(this.#backdrop);
    }
    this.#backdrop.style.setProperty("--umu-bg", context.bg ?? "none");
    this.#backdrop.classList.toggle("cine", Boolean(context.cine));
  }

  #watchLayout() {
    if (this.#watch) return;
    const relayout = () => this.layout();
    const observer = new ResizeObserver(relayout);
    for (const selector of ["#sidebar", "#hotbar", "#scene-controls"]) {
      const node = document.querySelector(selector);
      if (node) observer.observe(node);
    }
    globalThis.addEventListener("resize", relayout);
    this.#watch = { observer, relayout };
  }

  async _onClose(options) {
    this.#watch?.observer.disconnect();
    if (this.#watch) globalThis.removeEventListener("resize", this.#watch.relayout);
    this.#watch = null;
    this.#backdrop?.remove();
    this.#backdrop = null;
    await super._onClose?.(options);
  }
}

/**
 * Punto de entrada único de la Mesa: elige ventana o pantalla completa según el ajuste personal y
 * guarda si esa persona la tiene oculta. Es lo que usan los controles, el atajo, la API y el arranque.
 */
export const Table = {
  get mode() { return get("tableMode") === "window" ? "window" : "screen"; },
  get hidden() { return Boolean(get("tableHidden")); },

  /** Abre la Mesa en el modo elegido (y cierra el otro, para que no haya dos). */
  async open(options = {}) {
    const [chosen, other] = this.mode === "screen" ? [ScreenTable, TableApp] : [TableApp, ScreenTable];
    if (other.instance?.rendered) await other.instance.close();
    if (this.mode === "screen" && this.hidden) await set("tableHidden", false);
    this.syncPill();
    return chosen.open(options);
  },

  async hide() {
    await set("tableHidden", true);
    ScreenTable.instance?.sync();
    this.syncPill();
  },

  /** Herramienta de escena y atajo: alterna. En ventana abre o cierra; a pantalla completa oculta o muestra. */
  async toggle() {
    if (this.mode === "window") {
      const win = TableApp.instance;
      return win?.rendered ? win.close() : this.open();
    }
    const screen = ScreenTable.instance;
    return screen?.rendered && !this.hidden ? this.hide() : this.open();
  },

  /** Al entrar: a pantalla completa se muestra salvo que esa persona la haya ocultado; en ventana, solo si lo pidió. */
  async start() {
    this.syncPill();
    if (this.mode === "screen") return this.hidden ? undefined : this.open();
    if (get("openOnStart")) return this.open();
  },

  /** Cambió el modo: se cierra lo abierto y se abre en el nuevo. */
  async reopen() {
    const had = TableApp.instance?.rendered || ScreenTable.instance?.rendered;
    for (const cls of [TableApp, ScreenTable]) if (cls.instance?.rendered) await cls.instance.close();
    this.syncPill();
    if (this.mode === "screen") { if (!this.hidden) await this.open(); }
    else if (had) await this.open();
  },

  /** La pastilla para volver a mostrar la Mesa: solo existe mientras está oculta. */
  syncPill() {
    const wanted = this.mode === "screen" && this.hidden;
    let pill = document.querySelector(".umu-pill");
    if (!wanted) return pill?.remove();
    if (pill) return;
    pill = document.createElement("button");
    pill.type = "button";
    pill.className = "umu-pill";
    pill.innerHTML = `<i class="fa-solid fa-torii-gate" aria-hidden="true"></i><span>${foundry.utils.escapeHTML(t("UMU.Table.Show"))}</span>`;
    pill.dataset.tooltip = t("UMU.Table.ShowHint");
    pill.addEventListener("click", () => this.open());
    document.body.append(pill);
  }
};
