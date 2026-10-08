/** Registro de ventanas por nombre: lo rellena el arranque y lo usan los controles de escena y la API. */
export const Apps = {};
export function openApp(name, options) {
  const app = Apps[name];
  if (!app) return console.warn(`MR · Un momento único | ventana desconocida: ${name}`);
  return app.open(options);
}
