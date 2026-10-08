/**
 * Reglas de «Un momento único» (Tobie Abad, CC BY 4.0). Puras: sin Foundry ni DOM.
 * Asientos: "A" y "B". Todo lo que decide una regla del libro está aquí, con su página.
 */
export const RULES = Object.freeze({
  pool: 7,          // p.20 marcadores de Elección por capítulo
  maxDice: 7,       // p.24 «ninguno puede tener más de siete dados»
  themeBonus: 2,    // p.15 un tema clave da dos ventajas al jugador activo
  consonance: 2,    // p.25 dos dados extra al que mejor representó la virtud
  lowDie: 3,        // p.26 cada dado con menos de 3 suma un punto de odio al vencido
  escapeAbove: 10,  // p.31 solo se escapa del odio con más de diez
  maxSpend: 2,      // p.35 como mucho dos ventajas extra por intercambio
  themes: 3
});

export const SEATS = Object.freeze(["A", "B"]);
export const other = seat => (seat === "A" ? "B" : "A");
export const sum = list => list.reduce((a, b) => a + b, 0);
const both = fn => ({ A: fn("A"), B: fn("B") });

/** Dados que puede tirar un jugador en el clímax. El tope de 7 incluye los de Consonancia (D5). */
export function climaxDice({ markers, extra = 0, consonance = false }) {
  const base = markers + (consonance ? RULES.consonance : 0);
  const room = Math.max(0, RULES.maxDice - base);
  const added = Math.min(Math.max(0, extra), room);
  return { dice: Math.min(RULES.maxDice, base + added), extra: added, scars: added, room };
}

/**
 * Resolución del clímax de un capítulo (p.26).
 * side = { markers, dice: [..] }  ·  extra = { A, B } dados añadidos (cada uno da una cicatriz).
 */
export function resolveClimax({ A, B, active, extra = { A: 0, B: 0 } }) {
  const total = both(s => sum({ A, B }[s].dice));
  const scars = both(s => extra[s] ?? 0);
  const out = { totals: total, winner: null, loser: null, tie: false, advantages: { A: 0, B: 0 }, hate: { A: 0, B: 0 }, scars };
  if (total.A === total.B) {
    out.tie = true;
    for (const s of SEATS) { out.advantages[s] = { A, B }[s].markers; out.hate[s] = { A, B }[other(s)].markers; }
    out.scars[active] += 1;
    return out;
  }
  const winner = total.A > total.B ? "A" : "B", loser = other(winner);
  out.winner = winner; out.loser = loser;
  out.advantages[winner] = { A, B }[winner].markers;
  out.hate[loser] = out.advantages[winner] + { A, B }[loser].dice.filter(d => d < RULES.lowDie).length;
  return out;
}

/** Lidiar con el odio · entregarse (p.30): pares son ventajas, impares cicatrices. */
export function hateRoll(dice) {
  const advantages = dice.filter(d => d % 2 === 0).length;
  return { advantages, scars: dice.length - advantages };
}
export const canEscapeHate = hate => hate > RULES.escapeAbove;
/** Escapar (p.31): se descartan tantas cicatrices como la mitad del odio, redondeando abajo. */
export function escapeScars(hate, scars) {
  if (!canEscapeHate(hate)) return { discarded: 0, scars };
  const discarded = Math.min(scars, Math.floor(hate / 2));
  return { discarded, scars: scars - discarded };
}

/** Quién ataca primero en el Gran Final (p.32): odio, ventajas, cicatrices y, al final, quien declare antes. */
export function startingAttacker({ A, B }, firstDeclarer = "A") {
  for (const key of ["hate", "advantages", "scars"]) {
    if (A[key] !== B[key]) return A[key] > B[key] ? "A" : "B";
  }
  return firstDeclarer;
}

/** Ventajas que cuesta un intercambio: el atacante paga una por su dado base, más las extra. El defensor solo las extra. */
export function exchangeCost(role, spend) {
  const extra = Math.min(Math.max(0, spend), RULES.maxSpend);
  return role === "attacker" ? 1 + extra : extra;
}
export function canExchange({ attackerAdvantages, spend }) {
  return attackerAdvantages >= exchangeCost("attacker", spend);
}
/** Intercambio de golpes (p.33-35): vale el dado más alto, no la suma. */
export function resolveExchange({ attacker, defender }) {
  const a = Math.max(...attacker), d = Math.max(...defender);
  if (a === d) return { winner: null, tie: true, best: { attacker: a, defender: d } };
  return { winner: a > d ? "attacker" : "defender", tie: false, best: { attacker: a, defender: d } };
}
/** Apuesta a ciegas de ventajas tras un empate (p.33). Se puede apostar cero; empate de apuestas: nadie recibe cicatriz. */
export function resolveBet(attacker, defender) {
  if (attacker === defender) return { winner: null };
  return { winner: attacker > defender ? "attacker" : "defender" };
}

/** Si un jugador se queda sin ventajas, el otro (que aún tiene) intenta el golpe mortal (p.35). */
export function mortalAttacker({ A, B }) {
  if (A > 0 && B > 0) return null;
  if (A === 0 && B === 0) return null;
  return A > 0 ? "A" : "B";
}
/** Golpe mortal (p.36): un dado cada uno, sin modificar. Empate: falla el atacante (D1). */
export const mortalBlow = (attackerDie, defenderDie) => attackerDie > defenderDie;
/** Éxito: todas las ventajas restantes del atacante pasan a ser cicatrices del defensor. */
export function applyMortal({ attacker, defender, advantages, scars }) {
  const next = { advantages: { ...advantages }, scars: { ...scars } };
  next.scars[defender] += next.advantages[attacker];
  next.advantages[attacker] = 0;
  return next;
}

/**
 * Veredicto (p.36-37). `mortal` = asiento que acertó el golpe mortal o null si los dos fallaron.
 * Con golpe acertado, el defensor es derrotado y muere solo si acumula más cicatrices.
 * Sin él, pierde quien tenga más cicatrices; si empatan, triunfa quien tenga menos odio (D8: si también empatan, tablas).
 */
export function verdict({ scars, hate, mortal = null }) {
  if (mortal) {
    const defeated = other(mortal);
    return { triumph: mortal, defeated, dies: scars[defeated] > scars[mortal], by: "mortal" };
  }
  if (scars.A !== scars.B) {
    const defeated = scars.A > scars.B ? "A" : "B";
    return { triumph: other(defeated), defeated, dies: false, by: "scars" };
  }
  if (hate.A !== hate.B) {
    const defeated = hate.A > hate.B ? "A" : "B";
    return { triumph: other(defeated), defeated, dies: false, by: "hate" };
  }
  return { triumph: null, defeated: null, dies: false, by: "draw" };
}
