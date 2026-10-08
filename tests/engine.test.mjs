import test from "node:test";
import assert from "node:assert/strict";
import { apply, newGame, totals, EngineError, climaxPlan, themesLeft, charsLeft, warnings, seatOfUser } from "../module/engine.mjs";

const SETTING = {
  id: "test",
  virtues: ["gi", "yu", "jin", "rei", "makoto", "meiyo", "chuugi"].map(id => ({ id })),
  themes: ["trust", "line", "promise"].map(id => ({ id })),
  characters: ["catalyst", "victim", "coveted"].map(id => ({ id }))
};
const seq = (...n) => { let i = 0; return () => n[i++ % n.length]; };
const rng = seq(0.1, 0.9, 0.4, 0.7, 0.2, 0.6, 0.3);
const go = (s, a) => apply(s, a, { rng });
const codeOf = fn => { try { fn(); } catch (e) { return e instanceof EngineError ? e.code : `otro: ${e.message}`; } return null; };

function ready() {
  let s = newGame({ setting: SETTING, planned: 3, first: "A" });
  s = go(s, { type: "seat.claim", seat: "A", userId: "uA", user: "Yoshi" });
  s = go(s, { type: "seat.claim", seat: "B", userId: "uB", user: "Rocky" });
  s = go(s, { type: "seat.profile", seat: "A", name: "Kurosawa", clan: "Yamato" });
  s = go(s, { type: "seat.profile", seat: "B", name: "Kenshin", clan: "Ide" });
  s = go(s, { type: "decl.write", seat: "A", text: "Tiempos de guerra", weather: "snow" });
  s = go(s, { type: "decl.write", seat: "B", text: "Las ruinas del castillo" });
  s = go(s, { type: "decl.write", seat: "A", text: "Una generación" });
  s = go(s, { type: "decl.write", seat: "B", text: "Honor", virtueId: "meiyo" });
  return s;
}

/** Abre un capítulo y llega al paso 4 (reserva) sin tema ni personaje. */
function toPool(s, seat = "A") {
  s = go(s, { type: "chapter.begin", seat }); s = go(s, { type: "virtue.keep" }); s = go(s, { type: "theme.skip" }); s = go(s, { type: "char.skip" });
  return s;
}
/** Capítulo completo con un reparto dado de decisiones (a quién favorece cada una). */
function chapter(s, { seat, favors, diceA, diceB, extra = { A: 0, B: 0 } }) {
  s = toPool(s, seat);
  for (const f of favors) s = go(s, { type: "pool.favor", toSeat: f, note: "x" });
  s = go(s, { type: "pool.settle" });
  for (const x of ["A", "B"]) if (extra[x]) s = go(s, { type: "climax.extra", seat: x, n: extra[x] });
  s = go(s, { type: "climax.ready", seat: "A" }); s = go(s, { type: "climax.ready", seat: "B" });
  s = go(s, { type: "climax.roll", seat: "A", dice: diceA }); s = go(s, { type: "climax.roll", seat: "B", dice: diceB });
  return s;
}

test("la preparación exige turnos alternados, nombres y virtud en la última declaración", () => {
  let s = newGame({ setting: SETTING, first: "B" });
  assert.equal(codeOf(() => go(s, { type: "decl.write", seat: "B", text: "x" })), "needNames");
  s = go(s, { type: "seat.profile", seat: "A", name: "a", clan: "c" }); s = go(s, { type: "seat.profile", seat: "B", name: "b", clan: "c" });
  assert.equal(codeOf(() => go(s, { type: "decl.write", seat: "A", text: "x" })), "notYourTurn");
  s = go(s, { type: "decl.write", seat: "B", text: "1" }); s = go(s, { type: "decl.write", seat: "A", text: "2" }); s = go(s, { type: "decl.write", seat: "B", text: "3" });
  assert.equal(codeOf(() => go(s, { type: "decl.write", seat: "A", text: "4" })), "needVirtue");
  s = go(s, { type: "decl.write", seat: "A", text: "4", virtueId: "gi" });
  assert.equal(s.decl.virtueId, "gi");
  assert.equal(s.virtues.deck.length, 6, "las seis restantes se barajan");
  assert.ok(!s.virtues.deck.includes("gi"));
});

test("dos jugadores no pueden ocupar el mismo asiento", () => {
  let s = newGame({ setting: SETTING });
  s = go(s, { type: "seat.claim", seat: "A", userId: "u1", user: "uno" });
  assert.equal(codeOf(() => go(s, { type: "seat.claim", seat: "A", userId: "u2", user: "dos" })), "seatTaken");
  assert.equal(seatOfUser(s, "u1"), "A");
});

test("sin los dos asientos ocupados no se empieza (salvo árbitro)", () => {
  let s = newGame({ setting: SETTING });
  s = go(s, { type: "seat.profile", seat: "A", name: "a", clan: "c" }); s = go(s, { type: "seat.profile", seat: "B", name: "b", clan: "c" });
  s = go(s, { type: "admin.skipDeclarations" });
  assert.equal(codeOf(() => go(s, { type: "chapter.begin", seat: "A" })), "needSeats");
  assert.equal(go(s, { type: "chapter.begin", seat: "A", force: true }).phase, "chapter");
});

test("capítulo con vencedor: ventajas = sus marcadores, odio = ventajas + dados <3 del perdedor", () => {
  let s = ready();
  // cuatro decisiones favorecen a B (marcador a A) y tres a A (marcador a B) → A:4, B:3
  s = chapter(s, { seat: "A", favors: ["B", "B", "B", "B", "A", "A", "A"], diceA: [6, 5, 4, 3], diceB: [1, 2, 6] });
  assert.equal(s.chapter.result.winner, "A");
  const t = totals(s);
  assert.equal(t.A.adv, 4);
  assert.equal(t.B.hate, 4 + 2, "cuatro ventajas del ganador + dos dados menores de 3 de B");
  assert.equal(t.B.adv, 0);
  assert.equal(s.chapter.step, 6);
});

test("empate: ventajas propias, odio cruzado y una cicatriz para el activo", () => {
  let s = ready();
  s = chapter(s, { seat: "A", favors: ["B", "B", "B", "A", "A", "A", "A"], diceA: [4, 3, 2], diceB: [5, 2, 1, 1] });
  assert.ok(s.chapter.result.tie);
  const t = totals(s);
  assert.deepEqual([t.A.adv, t.B.adv], [3, 4]);
  assert.deepEqual([t.A.hate, t.B.hate], [4, 3]);
  assert.equal(t.A.scar, 1, "el activo");
  assert.equal(t.B.scar, 0);
});

test("dados extra: cada uno da una cicatriz y el tope de siete incluye la consonancia", () => {
  let s = toPool(ready());
  for (const f of ["B", "B", "B", "B", "B", "A", "A"]) s = go(s, { type: "pool.favor", toSeat: f });
  s = go(s, { type: "pool.settle" });                        // A:5 marcadores, B:2
  s = go(s, { type: "consonance.propose", seat: "A", by: "A" });
  assert.equal(codeOf(() => go(s, { type: "consonance.accept", by: "A" })), "notYourTurn");
  s = go(s, { type: "consonance.accept", by: "B" });
  assert.equal(s.chapter.consonance, "A");
  s = go(s, { type: "climax.extra", seat: "A", n: 5 });
  assert.equal(s.chapter.extra.A, 0, "5 marcadores + 2 de consonancia = 7: no caben más");
  s = go(s, { type: "climax.extra", seat: "B", n: 3 });
  assert.deepEqual(climaxPlan(s).B, { dice: 5, extra: 3, scars: 3, room: 5 });
  assert.equal(climaxPlan(s).A.dice, 7);
});

test("las cicatrices de los dados extra se registran al resolver el clímax", () => {
  let s = chapter(ready(), { seat: "A", favors: ["B", "B", "B", "B", "A", "A", "A"], diceA: [6, 5, 4, 3, 2], diceB: [1, 2, 6, 2], extra: { A: 1, B: 1 } });
  assert.equal(totals(s).A.scar, 1);
  assert.equal(totals(s).B.scar, 1);
});

test("no se puede tirar sin que ambos estén listos, ni con la cantidad de dados equivocada", () => {
  let s = toPool(ready());
  for (let i = 0; i < 7; i++) s = go(s, { type: "pool.favor", toSeat: i % 2 ? "A" : "B" });
  s = go(s, { type: "pool.settle" });
  assert.equal(codeOf(() => go(s, { type: "climax.roll", seat: "A", dice: [1, 2, 3, 4] })), "notReady");
  s = go(s, { type: "climax.ready", seat: "A" }); s = go(s, { type: "climax.ready", seat: "B" });
  assert.equal(codeOf(() => go(s, { type: "climax.roll", seat: "A", dice: [1] })), "badDice");
  assert.equal(codeOf(() => go(s, { type: "climax.roll", seat: "A", dice: [1, 2, 3, 9] })), "badDice");
  assert.equal(codeOf(() => go(s, { type: "climax.extra", seat: "A", n: 1 })), "locked");
});

test("el tema clave da dos ventajas al activo y no se repite", () => {
  let s = go(ready(), { type: "chapter.begin", seat: "A" }); s = go(s, { type: "virtue.keep" });
  s = go(s, { type: "theme.pick", themeId: "trust" });
  assert.equal(totals(s).A.adv, 2);
  assert.deepEqual(themesLeft(s), ["line", "promise"]);
  assert.equal(s.chapter.step, 3);
});

test("el capítulo alterna al jugador activo y solo narra el ganador", () => {
  let s = ready();
  s = chapter(s, { seat: "A", favors: ["B", "B", "B", "B", "A", "A", "A"], diceA: [6, 6, 6, 6], diceB: [1, 1, 1] });
  assert.equal(codeOf(() => go(s, { type: "chapter.close", seat: "B", summary: "x" })), "notNarrator");
  s = go(s, { type: "chapter.close", seat: "A", summary: "Ganó Kurosawa" });
  assert.equal(s.played, 1);
  assert.equal(s.between, true);
  assert.equal(s.chapter.active, "B");
  assert.equal(s.history[0].summary, "Ganó Kurosawa");
  assert.equal(codeOf(() => go(s, { type: "chapter.begin", seat: "A" })), "notYourTurn");
});

test("robar virtud: ambos sacan una, el activo elige y la otra vuelve al mazo; la elegida se descarta al cerrar", () => {
  let s = go(ready(), { type: "chapter.begin", seat: "A" });
  s = go(s, { type: "virtue.draw" });
  const [a, b] = [s.virtues.drawn.A, s.virtues.drawn.B];
  assert.ok(a && b && a !== b);
  assert.equal(s.virtues.deck.length, 4);
  assert.equal(codeOf(() => go(s, { type: "virtue.pick", virtueId: "meiyo" })), "badVirtue", "la virtud de la declaración no está en el mazo");
  s = go(s, { type: "virtue.pick", virtueId: b });
  assert.equal(s.chapter.virtueId, b);
  assert.equal(s.virtues.deck.length, 5);
  assert.ok(s.virtues.deck.includes(a));
  s = go(s, { type: "theme.skip" }); s = go(s, { type: "char.skip" });
  for (let i = 0; i < 7; i++) s = go(s, { type: "pool.favor", toSeat: "A" });
  s = go(s, { type: "pool.settle" }); s = go(s, { type: "climax.ready", seat: "A" }); s = go(s, { type: "climax.ready", seat: "B" });
  s = go(s, { type: "climax.roll", seat: "A", dice: [] });          // A no tiene marcadores: 0 dados
  s = go(s, { type: "climax.roll", seat: "B", dice: [1, 1, 1, 1, 1, 1, 1] });
  s = go(s, { type: "chapter.close", seat: "B", summary: "" });
  assert.deepEqual(s.virtues.discard, [b]);
});

test("personajes clave: cada uno se introduce una sola vez y queda a cargo de quien lo trajo", () => {
  let s = go(ready(), { type: "chapter.begin", seat: "A" }); s = go(s, { type: "virtue.keep" }); s = go(s, { type: "theme.skip" });
  s = go(s, { type: "char.pick", characterId: "victim", name: "Anciano" });
  assert.equal(s.chars.victim.owner, "A");
  assert.deepEqual(charsLeft(s), ["catalyst", "coveted"]);
});

test("pool.favor admite «ninguna» (nadie recibe marcador) y se puede deshacer", () => {
  let s = toPool(ready());
  s = go(s, { type: "pool.favor", toSeat: "none", note: "neutral" });
  assert.equal(s.chapter.pool.reserve, 7);
  s = go(s, { type: "pool.favor", toSeat: "A" });
  assert.deepEqual([s.chapter.pool.reserve, s.chapter.pool.B], [6, 1]);
  s = go(s, { type: "pool.undo" });
  assert.deepEqual([s.chapter.pool.reserve, s.chapter.pool.B], [7, 0]);
});

/* ---------- odio y Gran Final ---------- */

function fullGame() {
  let s = ready();
  // capítulo 1: A gana 4–3 con tema clave (+2 ventajas)
  s = go(s, { type: "chapter.begin", seat: "A" }); s = go(s, { type: "virtue.keep" }); s = go(s, { type: "theme.pick", themeId: "trust" }); s = go(s, { type: "char.skip" });
  for (const f of ["B", "B", "B", "B", "A", "A", "A"]) s = go(s, { type: "pool.favor", toSeat: f });
  s = go(s, { type: "pool.settle" }); s = go(s, { type: "climax.ready", seat: "A" }); s = go(s, { type: "climax.ready", seat: "B" });
  s = go(s, { type: "climax.roll", seat: "A", dice: [6, 6, 6, 6] }); s = go(s, { type: "climax.roll", seat: "B", dice: [1, 2, 6] });
  return go(s, { type: "chapter.close", seat: "A", summary: "uno" });
}

test("lidiar con el odio: entregarse tira todos los dados (pares ventajas, impares cicatrices)", () => {
  let s = go(fullGame(), { type: "game.toHate" });
  assert.equal(totals(s).B.hate, 6);
  assert.equal(codeOf(() => go(s, { type: "hate.choose", seat: "B", mode: "escape" })), "cannotEscape");
  s = go(s, { type: "hate.choose", seat: "B", mode: "surrender", note: "quemó el pueblo" });
  assert.equal(codeOf(() => go(s, { type: "hate.roll", seat: "B", dice: [1, 2] })), "badDice");
  s = go(s, { type: "hate.roll", seat: "B", dice: [1, 2, 3, 4, 6, 5] });
  assert.equal(totals(s).B.adv, 3);
  assert.equal(totals(s).B.scar, 3);
  assert.equal(totals(s).B.hate, 6, "el odio no desaparece (desempate)");
  assert.equal(s.phase, "hate", "A todavía no ha decidido");
});

test("escapar del odio: solo con más de diez; descarta la mitad de cicatrices redondeando abajo", () => {
  let s = fullGame();
  s = go(s, { type: "admin.ledger", seat: "B", kind: "hate", n: 5, note: "x" });       // 11 de odio
  s = go(s, { type: "admin.ledger", seat: "B", kind: "scar", n: 7 });
  s = go(s, { type: "game.toHate" });
  s = go(s, { type: "hate.choose", seat: "B", mode: "escape" });
  assert.equal(totals(s).B.scar, 7 - 5, "la mitad de 11 es 5");
  assert.equal(totals(s).B.hate, 11);
  assert.equal(s.hate.B.discarded, 5);
});

test("el Gran Final empieza con quien tiene más odio", () => {
  let s = go(fullGame(), { type: "game.toHate" });
  s = go(s, { type: "hate.choose", seat: "A", mode: "keep" }); s = go(s, { type: "hate.choose", seat: "B", mode: "keep" });
  assert.equal(s.phase, "final");
  assert.equal(s.final.attacker, "B", "B tiene 6 de odio, A ninguno");
});

function finalState({ advA, advB, scarA = 0, scarB = 0, hateA = 0, hateB = 0 }) {
  let s = fullGame();
  for (const [seat, kind, target] of [["A", "adv", advA], ["B", "adv", advB], ["A", "scar", scarA], ["B", "scar", scarB], ["A", "hate", hateA], ["B", "hate", hateB]])
    s = go(s, { type: "admin.ledger", seat, kind, n: target - totals(s)[seat][kind] });
  s = go(s, { type: "game.toHate" });
  s = go(s, { type: "hate.choose", seat: "A", mode: "keep" }); s = go(s, { type: "hate.choose", seat: "B", mode: "keep" });
  return s;
}
const exchange = (s, { diceAtt, diceDef, spendAtt = 0, spendDef = 0 }) => {
  const att = s.final.attacker, def = att === "A" ? "B" : "A";
  s = go(s, { type: "final.declare", seat: att, text: "ataco" }); s = go(s, { type: "final.respond", seat: def, text: "paro" });
  s = go(s, { type: "final.spend", seat: att, n: spendAtt }); s = go(s, { type: "final.spend", seat: def, n: spendDef });
  s = go(s, { type: "final.roll", seat: att, dice: diceAtt }); s = go(s, { type: "final.roll", seat: def, dice: diceDef });
  return s;
};

test("intercambio: el atacante paga una ventaja (más las extra), el defensor solo las extra; vale el dado más alto", () => {
  let s = finalState({ advA: 18, advB: 14, scarA: 9, scarB: 2, hateA: 20, hateB: 3 });
  assert.equal(s.final.attacker, "A");
  s = exchange(s, { diceAtt: [5], diceDef: [2] });
  assert.equal(totals(s).A.adv, 17);
  assert.equal(totals(s).B.scar, 3, "el perdedor recibe una cicatriz");
  assert.equal(s.final.stage, "resolved");
  s = go(s, { type: "final.narrate", seat: "A", text: "corte en el brazo" });
  assert.equal(s.final.attacker, "B", "los papeles se alternan");
  s = exchange(s, { diceAtt: [1, 4, 6], diceDef: [6], spendAtt: 2 });
  assert.equal(totals(s).B.adv, 14 - 3);
  assert.equal(s.final.last.winner, null, "empate a 6: apuesta ciega");
  assert.equal(s.final.stage, "bet");
});

test("no se puede gastar más de dos ventajas ni más de las que se tienen", () => {
  let s = finalState({ advA: 1, advB: 5, hateA: 9 });
  s = go(s, { type: "final.declare", seat: "A", text: "a" }); s = go(s, { type: "final.respond", seat: "B", text: "b" });
  assert.equal(codeOf(() => go(s, { type: "final.spend", seat: "A", n: 1 })), "notEnoughAdvantages", "paga una por su dado base");
  s = go(s, { type: "final.spend", seat: "A", n: 0 });
  s = go(s, { type: "final.spend", seat: "B", n: 9 });
  assert.equal(s.final.spend.B, 2, "tope de dos");
});

test("apuesta ciega: las apostadas se gastan, gana la mayor, el perdedor recibe cicatriz; empate de apuestas, nadie", () => {
  let s = finalState({ advA: 9, advB: 9, hateA: 5 });
  s = exchange(s, { diceAtt: [3], diceDef: [3] });
  assert.equal(s.final.stage, "bet");
  assert.equal(codeOf(() => go(s, { type: "final.bet", seat: "A", n: 99 })), "notEnoughAdvantages");
  s = go(s, { type: "final.bet", seat: "A", n: 4 }); s = go(s, { type: "final.bet", seat: "B", n: 0 });
  assert.equal(totals(s).A.adv, 9 - 1 - 4);
  assert.equal(totals(s).B.scar, 1);
  assert.equal(s.final.last.winner, "A");
  s = go(s, { type: "final.narrate", seat: "A", text: "" });
  s = exchange(s, { diceAtt: [2], diceDef: [2] });
  s = go(s, { type: "final.bet", seat: "B", n: 0 }); s = go(s, { type: "final.bet", seat: "A", n: 0 });
  assert.equal(s.final.last.winner, null);
  assert.equal(totals(s).A.scar + totals(s).B.scar, 1, "empate de apuestas: nadie recibe cicatriz");
});

test("sin ventajas, el otro intenta el golpe mortal: si acierta, sus ventajas pasan a ser cicatrices del rival", () => {
  let s = finalState({ advA: 1, advB: 2, scarA: 0, scarB: 3, hateA: 7, hateB: 0 });
  assert.equal(s.final.attacker, "A");
  s = exchange(s, { diceAtt: [6], diceDef: [1] });      // A gasta su última ventaja y gana
  s = go(s, { type: "final.narrate", seat: "A", text: "tajo" });
  assert.equal(s.final.stage, "mortal");
  assert.equal(s.final.mortal.attacker, "B", "A se quedó sin ventajas; B tiene dos");
  s = go(s, { type: "final.mortalRoll", seat: "B", dice: [5] }); s = go(s, { type: "final.mortalRoll", seat: "A", dice: [2] });
  assert.equal(s.phase, "epilogue");
  assert.equal(s.verdict.triumph, "B");
  const t = totals(s);
  assert.equal(t.B.adv, 0);
  assert.equal(t.A.scar, 2, "las dos ventajas de B");
  assert.equal(t.B.scar, 4, "tenía 3 y recibió una por perder el intercambio");
  assert.equal(s.verdict.dies, false, "el defensor (A) no acumula más cicatrices");
});

test("golpe mortal que falla: contraataca el otro; si también falla, pierde quien tenga más cicatrices", () => {
  let s = finalState({ advA: 1, advB: 3, scarA: 4, scarB: 4, hateA: 8, hateB: 2 });
  s = exchange(s, { diceAtt: [6], diceDef: [1] });                           // A gana → B recibe 1 cicatriz (5)
  s = go(s, { type: "final.narrate", seat: "A", text: "" });
  assert.equal(s.final.mortal.attacker, "B");
  s = go(s, { type: "final.mortalRoll", seat: "B", dice: [2] }); s = go(s, { type: "final.mortalRoll", seat: "A", dice: [6] });   // B falla
  assert.equal(s.final.mortal.round, 2);
  assert.equal(s.final.mortal.attacker, "A");
  s = go(s, { type: "final.mortalRoll", seat: "A", dice: [3] }); s = go(s, { type: "final.mortalRoll", seat: "B", dice: [3] });   // empate: falla el atacante (D1)
  assert.equal(s.phase, "epilogue");
  assert.equal(s.verdict.by, "scars");
  assert.equal(s.verdict.defeated, "B", "B tiene 5 cicatrices contra 4");
});

test("ambos sin ventajas: veredicto directo; empate de cicatrices → menos odio; todo igual → tablas", () => {
  let s = finalState({ advA: 0, advB: 0, scarA: 3, scarB: 3, hateA: 5, hateB: 9 });
  assert.equal(s.phase, "epilogue");
  assert.equal(s.verdict.by, "hate");
  assert.equal(s.verdict.triumph, "A");
  s = finalState({ advA: 0, advB: 0, scarA: 3, scarB: 3, hateA: 5, hateB: 5 });
  assert.equal(s.verdict.by, "draw");
  assert.deepEqual(s.epilogue.order, ["A", "B", "A"]);
});

test("epílogo: triunfador, derrotado, triunfador; después la partida queda terminada", () => {
  let s = finalState({ advA: 0, advB: 3, scarA: 6, scarB: 1, hateA: 2, hateB: 0 });
  assert.equal(s.final.mortal.attacker, "B");
  s = go(s, { type: "final.mortalRoll", seat: "B", dice: [6] }); s = go(s, { type: "final.mortalRoll", seat: "A", dice: [1] });
  assert.equal(s.verdict.triumph, "B");
  assert.equal(s.verdict.dies, true, "A acumula más cicatrices: muere");
  assert.deepEqual(s.epilogue.order, ["B", "A", "B"]);
  assert.equal(codeOf(() => go(s, { type: "epilogue.write", seat: "A", text: "x" })), "notYourTurn");
  s = go(s, { type: "epilogue.write", seat: "B", text: "uno" }); s = go(s, { type: "epilogue.write", seat: "A", text: "dos" }); s = go(s, { type: "epilogue.write", seat: "B", text: "tres" });
  assert.equal(s.phase, "done");
  assert.equal(s.epilogue.texts.length, 3);
});

test("el ledger es la única fuente de los totales y cada entrada lleva su capítulo y origen", () => {
  const s = fullGame();
  assert.ok(s.ledger.length >= 3);
  assert.ok(s.ledger.every(e => e.id && ["A", "B"].includes(e.seat) && ["adv", "hate", "scar"].includes(e.kind) && Number.isInteger(e.n) && e.n !== 0));
  assert.equal(s.ledger.find(e => e.source === "theme").chapter, 1);
  assert.deepEqual(warnings(s), ["themesPending"]);
});

test("el árbitro puede forzar una acción de otro asiento", () => {
  let s = chapter(ready(), { seat: "A", favors: ["B", "B", "B", "B", "A", "A", "A"], diceA: [6, 6, 6, 6], diceB: [1, 1, 1] });
  s = go(s, { type: "admin.force", action: { type: "chapter.close", seat: "B", summary: "arbitrado" } });
  assert.equal(s.played, 1);
  assert.equal(codeOf(() => go(s, { type: "admin.force", action: { type: "admin.ledger", seat: "A", kind: "adv", n: 1 } })), "unknownAction");
});

test("apply no muta el estado de entrada y numera las revisiones", () => {
  const a = ready(), snapshot = JSON.stringify(a);
  const b = go(a, { type: "setup.options", planned: 7 });
  assert.equal(JSON.stringify(a), snapshot);
  assert.equal(b.rev, a.rev + 1);
  assert.equal(b.planned, 7);
  assert.equal(codeOf(() => go(a, { type: "nope" })), "unknownAction");
});
