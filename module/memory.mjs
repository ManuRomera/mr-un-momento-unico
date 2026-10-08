/**
 * Memoria de ventanas: posición, tamaño, pestaña, secciones plegadas y scroll,
 * por usuario, mundo y aplicación. Vive en localStorage: es una preferencia de
 * este navegador, no un dato del mundo.
 *
 * Cada vez que una ventana se abre, su geometría se valida contra el viewport
 * actual: si cambió el monitor o la resolución, vuelve dentro y, si no cabe, se centra.
 */
const PREFIX = "mr-umu.window.";
const FIELDS = ["left", "top", "width", "height"];
const MARGIN = 12;
const key = id => `${PREFIX}${game.world?.id}.${game.user?.id}.${id}`;

export function readMemory(id) {
  try { return JSON.parse(localStorage.getItem(key(id))) ?? {}; }
  catch { return {}; }
}
function writeMemory(id, patch) {
  try { localStorage.setItem(key(id), JSON.stringify({ ...readMemory(id), ...patch })); }
  catch (error) { console.warn("MR · Un momento único | memoria de ventanas", error); }
}
export function clearWindowMemory() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
  }
}

const numeric = (pos, fields = FIELDS) =>
  Object.fromEntries(fields.filter(f => Number.isFinite(pos?.[f])).map(f => [f, Math.round(pos[f])]));

/**
 * Geometría segura. Pura (recibe el viewport) para poder probarla fuera de Foundry.
 * Nunca más grande que el viewport menos márgenes, nunca fuera de él.
 */
export function fitToViewport(pos = {}, viewport = { width: 1920, height: 1080 }, limits = {}) {
  const vw = Math.max(480, viewport.width), vh = Math.max(360, viewport.height);
  const maxW = Math.min(limits.maxWidth ?? Infinity, vw - MARGIN * 2);
  const maxH = Math.min(limits.maxHeight ?? Infinity, vh - MARGIN * 2);
  const out = { ...pos };
  if (Number.isFinite(out.width)) out.width = Math.max(Math.min(limits.minWidth ?? 320, maxW), Math.min(out.width, maxW));
  if (Number.isFinite(out.height)) out.height = Math.max(Math.min(limits.minHeight ?? 200, maxH), Math.min(out.height, maxH));
  const w = Number.isFinite(out.width) ? out.width : 480, h = Number.isFinite(out.height) ? out.height : 360;
  const offscreen = (Number.isFinite(out.left) && (out.left < 0 || out.left + Math.min(w, 160) > vw))
    || (Number.isFinite(out.top) && (out.top < 0 || out.top + 40 > vh));
  if (offscreen) {
    out.left = Math.round((vw - w) / 2);
    out.top = Math.round(Math.max(MARGIN, (vh - h) / 2));
  }
  if (Number.isFinite(out.left)) out.left = Math.max(0, Math.min(out.left, vw - w));
  if (Number.isFinite(out.top)) out.top = Math.max(0, Math.min(out.top, vh - Math.min(h, vh)));
  return out;
}

const viewport = () => ({ width: globalThis.innerWidth || 1920, height: globalThis.innerHeight || 1080 });

export function WithMemory(Base) {
  return class extends Base {
    static MEMORY_FIELDS = FIELDS;
    /** Límites opcionales de tamaño: { maxWidth, maxHeight, minWidth, minHeight }. */
    static SIZE_LIMITS = {};

    constructor(options = {}) {
      const C = new.target;
      const id = options.memory ?? options.document?.uuid ?? C.MEMORY ?? C.name;
      const saved = readMemory(id);
      const inherited = saved.position ? {} : numeric(readMemory(`class.${C.name}`).position, ["width", "height"]);
      const initial = saved.position ? {} : C.initialPosition?.(viewport()) ?? {};
      const position = { ...C.DEFAULT_OPTIONS?.position, ...initial, ...options.position, ...inherited, ...numeric(saved.position, C.MEMORY_FIELDS) };
      super({ ...options, position: fitToViewport(position, viewport(), C.SIZE_LIMITS) });
      this._mrMemory = { id, sections: saved.sections ?? {}, scroll: saved.scroll ?? {} };
      if (saved.tabs) Object.assign(this.tabGroups, saved.tabs);
    }

    /**
     * Al (re)abrir una ventana, revalidar su geometría contra el viewport actual.
     * Se pasa por las opciones de render: el `position` de ApplicationV2 es un Proxy cuyo
     * `set` devuelve el valor asignado, y asignar un 0 (p. ej. `top: 0`) lanza un TypeError.
     */
    _configureRenderOptions(options) {
      if (options.isFirstRender) {
        const fitted = fitToViewport(numeric(this.position), viewport(), this.constructor.SIZE_LIMITS);
        options.position = { ...fitted, ...(options.position ?? {}) };
      }
      super._configureRenderOptions(options);
    }

    _onPosition(position) {
      super._onPosition?.(position);
      if (!this.rendered) return;
      clearTimeout(this._mrMemory.timer);
      this._mrMemory.timer = setTimeout(() => this.#savePosition(), 200);
    }

    #savePosition() {
      const fields = this.minimized ? ["left", "top"] : this.constructor.MEMORY_FIELDS;
      const pos = numeric(this.position, fields);
      writeMemory(this._mrMemory.id, { position: { ...readMemory(this._mrMemory.id).position, ...pos } });
      if (!this.minimized) writeMemory(`class.${this.constructor.name}`, { position: numeric(this.position, ["width", "height"]) });
    }

    changeTab(tab, group, options) {
      super.changeTab(tab, group, options);
      writeMemory(this._mrMemory.id, { tabs: { ...this.tabGroups } });
    }

    /** ¿Está abierta esta sección plegable? */
    sectionOpen(id, fallback = true) { return this._mrMemory.sections[id] ?? fallback; }
    /** Recordar una sección abierta o cerrada sin <details> (paneles propios). */
    setSection(id, open) {
      this._mrMemory.sections[id] = open;
      writeMemory(this._mrMemory.id, { sections: this._mrMemory.sections });
    }

    async _onRender(context, options) {
      await super._onRender(context, options);
      for (const d of this.element.querySelectorAll("details[data-memory]")) {
        d.open = this.sectionOpen(d.dataset.memory, d.open);
        d.addEventListener("toggle", () => {
          this._mrMemory.sections[d.dataset.memory] = d.open;
          writeMemory(this._mrMemory.id, { sections: this._mrMemory.sections });
        });
      }
      if (options.isFirstRender) {
        for (const [selector, top] of Object.entries(this._mrMemory.scroll)) {
          const el = this.element.querySelector(selector);
          if (el) el.scrollTop = top;
        }
      }
    }

    /** Conserva lo que se estaba escribiendo si otro usuario provoca un repintado. */
    _preSyncPartState(partId, fresh, prior, state) {
      super._preSyncPartState?.(partId, fresh, prior, state);
      const field = document.activeElement;
      if (!prior.contains(field) || !field.name || !field.matches("input[type=text], input:not([type]), textarea")) return;
      state.typing = { selector: `${field.tagName}[name="${CSS.escape(field.name)}"]`, value: field.value, from: field.selectionStart, to: field.selectionEnd };
    }
    _syncPartState(partId, fresh, prior, state) {
      super._syncPartState?.(partId, fresh, prior, state);
      const field = state.typing && fresh.querySelector(state.typing.selector);
      if (!field) return;
      field.value = state.typing.value;
      field.focus();
      field.setSelectionRange?.(state.typing.from, state.typing.to);
    }

    async close(options) {
      if (this.rendered) {
        const scroll = {};
        for (const selector of this.constructor.SCROLL_MEMORY ?? []) {
          const el = this.element.querySelector(selector);
          if (el) scroll[selector] = el.scrollTop;
        }
        clearTimeout(this._mrMemory.timer);
        this.#savePosition();
        writeMemory(this._mrMemory.id, { scroll });
      }
      return super.close(options);
    }
  };
}
