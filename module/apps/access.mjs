import { TEMPLATES } from "../constants.mjs";
import { clearWindowMemory } from "../memory.mjs";
import { ACCESS_DEFAULTS, INKS, get, set } from "../settings.mjs";
import { SoundService } from "../services/sound.mjs";
import { SystemApp, t } from "./base.mjs";

const TOGGLES = ["darkMode", "readingMode", "highContrast", "plainFont", "wideSpacing", "largeButtons", "reducedMotion", "reducedEffects", "soundFx", "music"];
const RANGES = { textScale: [85, 160, 5], sfxVolume: [0, 100, 5], ambientVolume: [0, 100, 5], musicVolume: [0, 100, 5] };

/** Accesibilidad y lectura, por usuario. Cada cambio se aplica al instante. */
export class AccessPanel extends SystemApp {
  static MEMORY = "access";
  static MEMORY_FIELDS = ["left", "top"];
  static DEFAULT_OPTIONS = {
    id: "umu-access", classes: ["umu-access-app"],
    window: { title: "UMU.Access.Title", icon: "fa-solid fa-universal-access", resizable: false },
    position: { width: 560, height: "auto" },
    actions: { toggle: AccessPanel.#toggle, ink: AccessPanel.#ink, reset: AccessPanel.#reset, forget: AccessPanel.#forget }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/access.hbs` } };

  async _prepareContext() {
    return {
      toggles: TOGGLES.map(key => ({ key, on: get(key), label: t(`UMU.Access.${key}`), hint: t(`UMU.Access.${key}Hint`) })),
      ranges: Object.entries(RANGES).map(([key, [min, max, step]]) => ({ key, min, max, step, value: Math.round(get(key) * 100), label: t(`UMU.Access.${key}`) })),
      inks: Object.entries(INKS).map(([key, color]) => ({ key, color, selected: get("readingInk") === key, label: t(`UMU.Access.Ink.${key}`) }))
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const input of this.element.querySelectorAll("input[type=range]")) {
      const out = input.nextElementSibling;
      input.addEventListener("input", () => {
        out.textContent = `${input.value}%`;
        if (input.name === "textScale") document.documentElement.style.setProperty("--umu-text-scale", input.value / 100);
      });
      input.addEventListener("change", async () => { await set(input.name, Number(input.value) / 100); SoundService.volumes(); SoundService.stone(); });
    }
  }

  static async #toggle(event, target) {
    await set(target.dataset.key, !get(target.dataset.key));
    if (target.dataset.key === "soundFx") SoundService.refresh();
    this.render();
  }
  static async #ink(event, target) { await set("readingInk", target.dataset.key); this.render(); }
  static async #reset() {
    for (const [key, value] of Object.entries(ACCESS_DEFAULTS)) await set(key, value);
    SoundService.refresh();
    this.render();
  }
  static #forget() { clearWindowMemory(); ui.notifications.info(t("UMU.Access.Forgotten")); }
}
