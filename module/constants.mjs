export { RULES, SEATS } from "./rules.mjs";

export const SYSTEM_ID = "mr-un-momento-unico";
export const PATH = `systems/${SYSTEM_ID}`;
export const TEMPLATES = `${PATH}/templates`;
export const SOCKET = `system.${SYSTEM_ID}`;
export const LOG = "MR · Un momento único |";

/** Documento que guarda la partida: un JournalEntry con propiedad OWNER para todos. */
export const FLAGS = Object.freeze({ STATE: "game", ROLE: "role", CHRONICLE: "chronicle" });
export const GAME_ROLE = "game";

/** Estaciones y climas: el nombre coincide con el del fondo (assets/art/weather/weather-<clave>.webp). */
export const WEATHER = Object.freeze(["snow", "petals", "summer", "leaves", "rain", "fog", "dust"]);
/** Ambiente sonoro que acompaña a cada clima (ver services/sound.mjs). */
export const WEATHER_SOUND = Object.freeze({ snow: "snow", petals: "wind", summer: "cicadas", leaves: "wind", rain: "rain", fog: "temple", dust: "wind", "": "silence" });

const art = p => `${PATH}/assets/art/${p}.webp`;
/** Todas las rutas de arte en un único sitio. Sustituir un archivo con el mismo nombre basta para cambiar el arte. */
export const ASSETS = Object.freeze({
  cover: art("brand/cover"), logo: art("brand/logo"), icon: `${PATH}/assets/icon.svg`,
  portrait: { A: art("brand/portrait-sumi"), B: art("brand/portrait-washi") },
  table: art("table/table"), scene: art("table/scene"), final: art("table/final-bg"), epilogue: art("table/epilogue-bg"), header: art("table/chronicle-header"),
  weather: Object.fromEntries(WEATHER.map(w => [w, art(`weather/weather-${w}`)])),
  cards: {
    catalyst: art("cards/char-catalyst"), victim: art("cards/char-victim"), coveted: art("cards/char-coveted"),
    trust: art("cards/theme-trust"), line: art("cards/theme-line"), promise: art("cards/theme-promise")
  },
  ink: {
    splats: Array.from({ length: 8 }, (_, i) => art(`ink/splat-0${i + 1}`)),
    strokes: Array.from({ length: 5 }, (_, i) => art(`ink/stroke-0${i + 1}`)),
    grass: Array.from({ length: 3 }, (_, i) => art(`ink/grass-0${i + 1}`)),
    bamboo: [art("ink/bamboo-01"), art("ink/bamboo-02")], enso: art("ink/enso")
  }
});
