/**
 * Ambientación «Bushido» (la del libro). Los textos son una adaptación breve de las siete virtudes y los
 * personajes y temas clave de «Un momento único» (Tobie Abad, CC BY 4.0; ver NOTICE.md).
 * Una ambientación es un dato: otros paquetes pueden registrar la suya con
 * `game.mrUnMomentoUnico.registerSetting({...})` (misma forma que este objeto).
 */
const L = (es, en) => ({ es, en });

export const BUSHIDO = Object.freeze({
  id: "bushido",
  name: L("Bushido", "Bushido"),
  tagline: L("Dos samuráis, un duelo y todo lo que los condujo hasta él.", "Two samurai, one duel and everything that led them to it."),
  virtues: [
    { id: "gi", glyph: "義", romaji: "Gi", name: L("Rectitud", "Rectitude"),
      blurb: L("Morir cuando es el momento correcto, golpear cuando es el adecuado. Base de todas las demás: para un samurái solo existe lo correcto y lo incorrecto.", "Dying at the right moment, striking at the right time. The root of every other virtue: for a samurai there is only right and wrong.") },
    { id: "yu", glyph: "勇", romaji: "Yū", name: L("Coraje", "Courage"),
      blurb: L("Un espíritu valeroso y heroico. Dar un paso al frente y plantar cara incluso a lo que no podemos comprender.", "A brave, heroic spirit. Stepping forward and facing even what we cannot understand.") },
    { id: "jin", glyph: "仁", romaji: "Jin", name: L("Benevolencia", "Benevolence"),
      blurb: L("Compasión y piedad. Entender cuándo hacerse amigo de un enemigo.", "Compassion and mercy. Knowing when to befriend an enemy.") },
    { id: "rei", glyph: "礼", romaji: "Rei", name: L("Respeto", "Respect"),
      blurb: L("Hay un orden correcto en todas las cosas: una armonía nacida de la cortesía.", "There is a proper order to all things: a harmony born of courtesy.") },
    { id: "makoto", glyph: "誠", romaji: "Makoto", name: L("Sinceridad", "Sincerity"),
      blurb: L("Honestidad. No hacen falta promesas escritas: una palabra es un vínculo.", "Honesty. No written promise is needed: a word is a bond.") },
    { id: "meiyo", glyph: "名誉", romaji: "Meiyo", name: L("Honor", "Honour"),
      blurb: L("Vivir y morir por honor, o abrirse el vientre para preservar el honor perdido.", "To live and die for honour, or to take one's own life to preserve honour lost.") },
    { id: "chuugi", glyph: "忠", romaji: "Chūgi", name: L("Lealtad", "Loyalty"),
      blurb: L("Más preciada que la vida misma.", "More precious than life itself.") }
  ],
  themes: [
    { id: "trust", title: L("Cuando confiábamos el uno en el otro", "When we trusted each other"),
      quote: L("«Recuerdo aquellos momentos en los que confiábamos el uno en el otro…»", "“I remember the times when we trusted each other…”") },
    { id: "line", title: L("El momento en que te pasaste de la raya", "The moment you crossed the line"),
      quote: L("«Recuerdo lo que hiciste para que todo esto empezase…»", "“I remember what you did to set all this in motion…”") },
    { id: "promise", title: L("Las promesas", "The promises"),
      quote: L("«Recuerdo la promesa que le hiciste a… »", "“I remember the promise you made to…”") }
  ],
  characters: [
    { id: "catalyst", title: L("El Catalizador", "The Catalyst"),
      blurb: L("La razón, en muchos sentidos, de que exista el momento único: el de la lengua viperina, la madre que pide venganza, el señor que obliga.", "In many ways the reason the single moment exists: the viper-tongued whisperer, the grieving mother who asks for vengeance, the lord who commands.") },
    { id: "victim", title: L("La Víctima", "The Victim"),
      blurb: L("Quien sufre la tragedia que el samurái no pudo evitar. Su función es avivar la enemistad entre ambos.", "Whoever suffers the tragedy the samurai could not prevent. Their role is to fuel the enmity between the two.") },
    { id: "coveted", title: L("El Codiciado", "The Coveted"),
      blurb: L("Siente afecto, respeto o confianza hacia uno de los samuráis, algo que el otro desea fervientemente para sí.", "Holds affection, respect or trust for one samurai, something the other fiercely wants for himself.") }
  ],
  hateIdeas: [
    L("Abandonado", "Abandoned"), L("Agotamiento", "Exhaustion"), L("Asesino", "Murderer"), L("Bancarrota", "Bankruptcy"), L("Cambiado", "Changed"),
    L("Clima", "Weather"), L("Delirio", "Delirium"), L("Desmoronarse", "Falling apart"), L("Desorientado", "Disoriented"), L("Destrucción", "Destruction"),
    L("Disgustado", "Disgusted"), L("Enfermedad", "Illness"), L("Espía", "Spy"), L("Maldito", "Cursed"), L("Muerto", "Dead"),
    L("Rehén", "Hostage"), L("Robo", "Theft"), L("Rodeado", "Surrounded"), L("Traición", "Betrayal"), L("Veneno", "Poison")
  ],
  intensity: [
    L("1 · Un amigo o un familiar", "1 · A friend or a relative"),
    L("2 · Un familiar importante", "2 · An important relative"),
    L("3 · Una pérdida irreemplazable", "3 · An irreplaceable loss"),
    L("4 · Un gran número de personas", "4 · A great number of people")
  ],
  examples: {
    intro: L("Mi nombre es… Soy miembro del clan… Esta es mi historia.", "My name is… I am a member of the clan… This is my story."),
    era: L("Ocurre en tiempos de guerra, con el invierno azotando las tierras.", "It happens in a time of war, with winter lashing the land."),
    place: L("Nos encontramos en las ruinas del castillo. El fuego aún arde cerca.", "We stand in the ruins of the castle. The fire still burns nearby."),
    span: L("Nos ha llevado una generación llegar a este momento.", "It has taken a generation to reach this moment."),
    story: L("Esta es una historia de…", "This is a story of…")
  }
});
