import { FLAGS, GAME_ROLE, SYSTEM_ID } from "../constants.mjs";
import { apply, EngineError, newGame, seatOfUser } from "../engine.mjs";
import { BUSHIDO } from "../data/bushido.mjs";

/** Una ambientación es un dato. Los módulos pueden registrar las suyas con `registerSetting`. */
const SETTINGS = new Map([[BUSHIDO.id, BUSHIDO]]);
const lang = () => (game.i18n?.lang ?? "es").startsWith("es") ? "es" : "en";
/** Texto localizado de un dato de ambientación: acepta una cadena o `{ es, en }`. */
export const loc = v => (v && typeof v === "object") ? (v[lang()] ?? v.en ?? v.es ?? "") : (v ?? "");

export function registerSetting(def) {
  const ok = def && typeof def.id === "string" && Array.isArray(def.virtues) && def.virtues.length >= 3
    && Array.isArray(def.themes) && Array.isArray(def.characters);
  if (!ok) throw new Error("Ambientación inválida: se necesita id, virtues (≥3), themes y characters.");
  SETTINGS.set(def.id, Object.freeze(def));
  Hooks.callAll("mrUmuSettings", def);
  return def.id;
}

/**
 * Estado compartido de la partida. Vive en un JournalEntry con propiedad OWNER para todos, así los dos
 * asientos pueden escribir aunque no haya Director conectado. Se guarda como JSON en un flag: así Foundry
 * nunca fusiona claves viejas con las nuevas.
 */
export class GameService {
  static #queue = Promise.resolve();

  static doc() { return game.journal?.find(j => j.getFlag(SYSTEM_ID, FLAGS.ROLE) === GAME_ROLE) ?? null; }
  static state() {
    const raw = this.doc()?.getFlag(SYSTEM_ID, FLAGS.STATE);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  static settingDef(id) { return SETTINGS.get(id) ?? BUSHIDO; }
  static settings() { return [...SETTINGS.values()]; }
  static setting() { return this.settingDef(this.state()?.settingId); }
  static mySeat() { const s = this.state(); return s ? seatOfUser(s, game.user.id) : null; }

  /** El Director crea el documento una sola vez por mundo. */
  static async ensure() {
    if (!game.user.isGM || this.doc()) return;
    await JournalEntry.implementation.create({
      name: game.i18n.localize("UMU.Game.DocName"),
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
      flags: { [SYSTEM_ID]: { [FLAGS.ROLE]: GAME_ROLE, [FLAGS.STATE]: JSON.stringify(newGame({ setting: BUSHIDO })) } }
    });
  }

  static async #write(state) { await this.doc().setFlag(SYSTEM_ID, FLAGS.STATE, JSON.stringify(state)); }

  /**
   * Aplica una acción al estado compartido. Las acciones se encolan para no pisarse entre sí;
   * una regla rota se avisa al usuario y no escribe nada.
   */
  static dispatch(action) {
    const run = this.#queue.then(async () => {
      const state = this.state();
      if (!state) { ui.notifications.warn(game.i18n.localize("UMU.Game.NoDoc")); return null; }
      try {
        const next = apply(state, action);
        await this.#write(next);
        return next;
      } catch (error) {
        if (error instanceof EngineError) { ui.notifications.warn(game.i18n.localize(`UMU.Err.${error.code}`)); return null; }
        throw error;
      }
    });
    this.#queue = run.catch(() => {});
    return run;
  }

  /** Partida nueva (solo Director). Conserva los asientos si `keepSeats`. */
  static async reset({ settingId = "bushido", keepSeats = false } = {}) {
    if (!game.user.isGM) return;
    const old = this.state();
    const next = newGame({ setting: this.settingDef(settingId), planned: old?.planned ?? 5, first: old?.first ?? "A" });
    if (keepSeats && old) for (const s of ["A", "B"]) next.seats[s] = old.seats[s];
    await this.#write(next);
  }
}
