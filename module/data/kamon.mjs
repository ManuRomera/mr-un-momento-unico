/** Doce emblemas de clan (kamon) dibujados en SVG. Cada forma cabe en un viewBox de 100×100 y usa `currentColor`. */
export const KAMON = Object.freeze({
  "mon-1": '<circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="9"/>',
  "mon-2": '<circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="6"/><circle cx="50" cy="50" r="13" fill="currentColor"/>',
  "mon-3": '<circle cx="50" cy="26" r="15" fill="currentColor"/><circle cx="27" cy="66" r="15" fill="currentColor"/><circle cx="73" cy="66" r="15" fill="currentColor"/>',
  "mon-4": '<path d="M50 8 92 50 50 92 8 50Z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/><path d="M50 30 70 50 50 70 30 50Z" fill="currentColor"/>',
  "mon-5": '<path d="M50 6 69 31 94 50 69 69 50 94 31 69 6 50 31 31Z" fill="currentColor"/><circle cx="50" cy="50" r="13" fill="#0000" stroke="#000" stroke-opacity=".35" stroke-width="3"/>',
  "mon-6": '<path d="M8 36q21-16 42 0t42 0M8 56q21-16 42 0t42 0M8 76q21-16 42 0t42 0" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>',
  "mon-7": '<path d="M50 10v80M10 50h80" stroke="currentColor" stroke-width="12" stroke-linecap="round"/><circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="7"/>',
  "mon-8": '<g fill="currentColor"><circle cx="50" cy="26" r="17"/><circle cx="73" cy="43" r="17"/><circle cx="64" cy="70" r="17"/><circle cx="36" cy="70" r="17"/><circle cx="27" cy="43" r="17"/></g><circle cx="50" cy="52" r="9" fill="#000" fill-opacity=".3"/>',
  "mon-9": '<path d="M16 24h68M16 50h68M16 76h68" stroke="currentColor" stroke-width="11" stroke-linecap="round"/>',
  "mon-10": '<path d="M64 10A40 40 0 1 0 64 90 31 31 0 1 1 64 10Z" fill="currentColor"/>',
  "mon-11": '<path d="M50 6 60 40 94 50 60 60 50 94 40 60 6 50 40 40Z" fill="currentColor"/>',
  "mon-12": '<path d="M50 92V40M50 62C34 62 22 50 22 28c18 0 28 12 28 34ZM50 48C66 48 78 36 78 14c-18 0-28 12-28 34Z" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
});
export const KAMON_SHAPES = Object.freeze(Object.keys(KAMON));
export const kamonSvg = (shape, color = "#b3202a", size = 64, label = "") =>
  `<svg class="umu-kamon" viewBox="0 0 100 100" width="${size}" height="${size}" style="color:${color}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${KAMON[shape] ?? KAMON["mon-1"]}</svg>`;
