const f = foundry.data.fields;
const str = (initial = "") => new f.StringField({ required: true, nullable: false, blank: true, initial });

/**
 * Samurái: la ficha de un personaje que se puede reutilizar entre partidas. No tiene estadísticas:
 * el juego no las tiene. Ventajas, Odio y Cicatrices viven en la partida (el ledger), no aquí.
 */
export class SamuraiModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      clan: str(),
      kamon: new f.SchemaField({ shape: str("mon-1"), color: str("#b3202a") }),
      declaration: str(),
      notes: new f.HTMLField({ required: true, nullable: false, blank: true, initial: "" })
    };
  }
}

export const DATA_MODELS = Object.freeze({ Actor: { samurai: SamuraiModel }, Item: {} });
