import { ASSETS } from "../constants.mjs";
import { get } from "../settings.mjs";

/**
 * A pantalla completa la Mesa se apoya en la escena de bienvenida: Foundry la ajusta «para que quepa» y deja
 * bandas si la pantalla no es 16:9. Aquí se amplía lo justo para taparlas. Solo afecta a nuestra escena.
 */
export function registerCover() {
  const cover = canvas => {
    try {
      if (get("tableMode") !== "screen" || canvas?.scene?.background?.src !== ASSETS.scene) return;
      const { x, y, width, height } = canvas.dimensions.sceneRect;
      const screen = canvas.app.screen;
      canvas.pan({ x: x + width / 2, y: y + height / 2, scale: Math.max(screen.width / width, screen.height / height) });
    } catch (error) { console.warn("MR · Un momento único | cobertura de la escena", error); }
  };
  Hooks.on("canvasReady", canvas => setTimeout(() => cover(canvas), 50));
  globalThis.addEventListener("resize", () => { if (globalThis.canvas?.ready) cover(globalThis.canvas); });
  if (globalThis.canvas?.ready) cover(globalThis.canvas);
}
