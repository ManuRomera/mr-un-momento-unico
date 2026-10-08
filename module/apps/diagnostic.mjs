import { TEMPLATES } from "../constants.mjs";
import { diagnostic } from "../services/diagnostic.mjs";
import { SystemApp, t } from "./base.mjs";

/** Diagnóstico legible y copiable: lo que hay que enviar cuando algo falla. */
export class DiagnosticApp extends SystemApp {
  static MEMORY = "diagnostic";
  static DEFAULT_OPTIONS = {
    id: "umu-diagnostic", classes: ["umu-diagnostic-app"],
    window: { title: "UMU.Diagnostic.Title", icon: "fa-solid fa-stethoscope" },
    position: { width: 640, height: 640 },
    actions: { copy: DiagnosticApp.#copy, refresh: DiagnosticApp.#refresh }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/diagnostic.hbs` } };

  #report = null;

  async _prepareContext() {
    this.#report = await diagnostic();
    const r = this.#report;
    const ok = !r.boot.errors.length && !r.assets.missing?.length && Object.values(r.apis).every(Boolean);
    return { ok, json: JSON.stringify(r, null, 2), errors: r.boot.errors, missing: r.assets.missing ?? [] };
  }

  static async #copy() {
    const text = JSON.stringify(this.#report, null, 2);
    try { await navigator.clipboard.writeText(text); ui.notifications.info(t("UMU.Diagnostic.Copied")); }
    catch { this.element.querySelector("textarea")?.select(); }
  }
  static #refresh() { this.render(); }
}
