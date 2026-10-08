/**
 * `url(...)` para variables CSS en línea. Una ruta relativa dentro de una variable se resuelve contra
 * la hoja de estilos, no contra la página: hay que darla absoluta (respetando el prefijo de ruta de Foundry).
 */
export function cssUrl(path) {
  if (!path) return "none";
  const absolute = /^(https?:|data:|blob:|\/)/.test(path) ? path : foundry.utils.getRoute(path);
  return `url("${absolute.replace(/"/g, "%22")}")`;
}
