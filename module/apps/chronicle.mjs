import { TEMPLATES, SYSTEM_ID, FLAGS } from "../constants.mjs";
import { SystemApp, t } from "./base.mjs";
import { buildChronicle } from "../services/chronicle.mjs";
import { GameService } from "../services/game.mjs";

/** La Crónica: el rollo de la partida. Se puede copiar, descargar como página limpia o guardar en los Diarios. */
export class ChronicleApp extends SystemApp {
  static MEMORY = "chronicle";
  static SCROLL_MEMORY = [".umu-chron"];
  static DEFAULT_OPTIONS = {
    id: "umu-chronicle", classes: ["umu-chronicle-app", "umu-paper-window"],
    window: { title: "UMU.App.Chronicle", icon: "fa-solid fa-scroll" }, position: { width: 760, height: 760 },
    actions: { copy: ChronicleApp.#copy, download: ChronicleApp.#download, save: ChronicleApp.#save }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/chronicle.hbs`, scrollable: [".umu-chron"] } };

  static init() { Hooks.on("updateJournalEntry", doc => { if (doc.id === GameService.doc()?.id) ChronicleApp.instance?.render(); }); }

  async _prepareContext() {
    const c = buildChronicle();
    return { empty: !c || !GameService.state().history.length, title: c?.title, html: c?.html, gm: game.user.isGM };
  }

  static async #copy() {
    const c = buildChronicle(); if (!c) return;
    try { await navigator.clipboard.writeText(c.text); ui.notifications.info(t("UMU.Chronicle.Copied")); }
    catch { ui.notifications.warn(t("UMU.Chronicle.CopyFail")); }
  }

  static #download() {
    const c = buildChronicle(); if (!c) return;
    const css = "body{font:17px/1.7 Georgia,serif;max-width:720px;margin:2.5rem auto;padding:0 1.2rem;background:#f2ede1;color:#17171a}h1{font-weight:400;letter-spacing:.04em;text-align:center}h2{margin-top:2.2rem;border-bottom:1px solid #b3202a;padding-bottom:.2rem;font-weight:400;letter-spacing:.08em}.umu-glyph{font-size:1.4em}.umu-chron-foot{margin-top:3rem;text-align:center;font-size:.8em;color:#555}.umu-chron-kamon{display:flex;gap:1rem;justify-content:center}.umu-chron-result{font-style:italic}.umu-chron-verdict{font-size:1.2em;text-align:center;margin-top:2rem}";
    const html = `<!doctype html><html lang="${game.i18n.lang}"><meta charset="utf-8"><title>${foundry.utils.escapeHTML(c.title)}</title><style>${css}</style><body>${c.html}</body></html>`;
    foundry.utils.saveDataToFile(html, "text/html", `cronica-${game.world.id}.html`);
  }

  static async #save() {
    if (!game.user.isGM) return;
    const c = buildChronicle(); if (!c) return;
    const entry = await JournalEntry.implementation.create({
      name: c.title, flags: { [SYSTEM_ID]: { [FLAGS.CHRONICLE]: true } },
      pages: [{ name: c.title, type: "text", text: { format: 1, content: c.html } }]
    });
    ui.notifications.info(game.i18n.format("UMU.Chronicle.Saved", { name: entry.name }));
    entry.sheet.render(true);
  }
}
