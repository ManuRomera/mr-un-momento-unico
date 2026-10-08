import { ActorSheetV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { WithMemory } from "../memory.mjs";
import { TEMPLATES } from "../constants.mjs";
import { KAMON_SHAPES, kamonSvg } from "../data/kamon.mjs";
import { GameService } from "../services/game.mjs";
import { totals } from "../engine.mjs";
import { openApp } from "../apps/registry.mjs";

/** Ficha del samurái: quién es, su clan y su emblema. Si está sentado a la mesa, muestra su cuenta del duelo. */
export class SamuraiSheet extends WithMemory(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: ["mr-umu", "umu-window", "umu-sheet"], form: { submitOnChange: true },
    position: { width: 560, height: 640 }, window: { resizable: true, icon: "fa-solid fa-user-ninja" },
    actions: { table: () => openApp("table"), kamon: SamuraiSheet.#kamon }
  };
  static PARTS = { sheet: { template: `${TEMPLATES}/sheets/samurai.hbs`, scrollable: [".umu-sheet-body"] } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document, s = actor.system, state = GameService.state();
    const seat = state ? ["A", "B"].find(x => state.seats[x].actorUuid === actor.uuid) : null;
    return {
      ...context, actor, system: s, editable: this.isEditable,
      kamon: kamonSvg(s.kamon.shape, s.kamon.color, 96, s.clan),
      shapes: KAMON_SHAPES.map(shape => ({ shape, svg: kamonSvg(shape, s.kamon.color, 40), on: shape === s.kamon.shape })),
      seat: seat ? { seat, totals: totals(state)[seat], phase: state.phase } : null
    };
  }

  static async #kamon(event, target) { await this.document.update({ "system.kamon.shape": target.dataset.shape }); }
}
