import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../module/rules.mjs";

test("climaxDice respeta el tope de 7 contando la Consonancia (D5)", () => {
  assert.deepEqual(R.climaxDice({ markers: 3, extra: 2, consonance: true }), { dice: 7, extra: 2, scars: 2, room: 2 });
  assert.equal(R.climaxDice({ markers: 5, extra: 9, consonance: true }).dice, 7);
  assert.equal(R.climaxDice({ markers: 5, extra: 9, consonance: true }).scars, 0);
});

test("ejemplo 5: empate → ventajas propias, odio del rival, 1 cicatriz al activo + dados extra", () => {
  // Yoshi (A) activo, 4 marcadores; Rocky (B) 3 marcadores, consonancia y 2 dados extra. Los totales del libro no cuadran (D4): se fuerzan iguales.
  const r = R.resolveClimax({ A: { markers: 4, dice: [6, 6, 3, 3] }, B: { markers: 3, dice: [6, 6, 3, 3, 0, 0, 0] }, active: "A", extra: { A: 0, B: 2 } });
  assert.equal(r.tie, true);
  assert.deepEqual(r.advantages, { A: 4, B: 3 });
  assert.deepEqual(r.hate, { A: 3, B: 4 });
  assert.deepEqual(r.scars, { A: 1, B: 2 });
});

test("clímax con vencedor: ventajas = sus marcadores; odio = ventajas + dados de menos de 3", () => {
  const r = R.resolveClimax({ A: { markers: 4, dice: [6, 5, 4, 3] }, B: { markers: 3, dice: [1, 2, 3] }, active: "A" });
  assert.equal(r.winner, "A");
  assert.deepEqual(r.advantages, { A: 4, B: 0 });
  assert.deepEqual(r.hate, { A: 0, B: 4 + 2 });
});

test("ejemplo 7: nueve dados de odio, tres impares y seis pares", () => {
  assert.deepEqual(R.hateRoll([1, 3, 5, 2, 2, 4, 4, 6, 6]), { advantages: 6, scars: 3 });
});

test("ejemplo 8: escapar de 11 de odio descarta 5 cicatrices; con 10 no se puede", () => {
  assert.equal(R.canEscapeHate(10), false);
  assert.deepEqual(R.escapeScars(10, 4), { discarded: 0, scars: 4 });
  assert.deepEqual(R.escapeScars(11, 9), { discarded: 5, scars: 4 });
  assert.deepEqual(R.escapeScars(11, 3), { discarded: 3, scars: 0 });
});

test("atacante inicial: odio, luego ventajas, luego cicatrices, luego quien declare", () => {
  assert.equal(R.startingAttacker({ A: { hate: 9, advantages: 1, scars: 1 }, B: { hate: 11, advantages: 0, scars: 0 } }), "B");
  assert.equal(R.startingAttacker({ A: { hate: 9, advantages: 5, scars: 1 }, B: { hate: 9, advantages: 4, scars: 9 } }), "A");
  assert.equal(R.startingAttacker({ A: { hate: 9, advantages: 5, scars: 1 }, B: { hate: 9, advantages: 5, scars: 2 } }), "B");
  assert.equal(R.startingAttacker({ A: { hate: 1, advantages: 1, scars: 1 }, B: { hate: 1, advantages: 1, scars: 1 } }, "B"), "B");
});

test("ejemplo 9: Yoshi ataca con 5 contra 2 y gana; Rocky ataca con 1 contra 3 y pierde", () => {
  assert.equal(R.resolveExchange({ attacker: [5], defender: [2] }).winner, "attacker");
  assert.equal(R.resolveExchange({ attacker: [1], defender: [3] }).winner, "defender");
});

test("ejemplo 9 (cont.): empate, apuestas 4 y 0 → gana quien apuesta más", () => {
  assert.equal(R.resolveExchange({ attacker: [2], defender: [2] }).tie, true);
  assert.equal(R.resolveBet(4, 0).winner, "attacker");
  assert.equal(R.resolveBet(0, 0).winner, null);
});

test("ejemplo 10: vale el dado más alto, no la suma; el coste de las ventajas", () => {
  const r = R.resolveExchange({ attacker: [6], defender: [1, 4, 6] });
  assert.equal(r.tie, true);
  assert.equal(R.exchangeCost("attacker", 0), 1);
  assert.equal(R.exchangeCost("attacker", 5), 3);
  assert.equal(R.exchangeCost("defender", 2), 2);
  assert.equal(R.canExchange({ attackerAdvantages: 2, spend: 2 }), false);
});

test("ejemplos 11 y 12: golpe mortal que falla (5 contra 6; 1 contra 3); el empate también falla (D1)", () => {
  assert.equal(R.mortalBlow(5, 6), false);
  assert.equal(R.mortalBlow(1, 3), false);
  assert.equal(R.mortalBlow(4, 4), false);
  assert.equal(R.mortalBlow(6, 1), true);
  assert.equal(R.mortalAttacker({ A: 0, B: 2 }), "B");
  assert.equal(R.mortalAttacker({ A: 1, B: 2 }), null);
  assert.equal(R.mortalAttacker({ A: 0, B: 0 }), null);
});

test("golpe mortal acertado: las ventajas del atacante pasan a cicatrices del defensor", () => {
  const next = R.applyMortal({ attacker: "B", defender: "A", advantages: { A: 0, B: 2 }, scars: { A: 3, B: 1 } });
  assert.deepEqual(next, { advantages: { A: 0, B: 0 }, scars: { A: 5, B: 1 } });
  assert.deepEqual(R.verdict({ scars: next.scars, hate: { A: 0, B: 0 }, mortal: "B" }), { triumph: "B", defeated: "A", dies: true, by: "mortal" });
  assert.equal(R.verdict({ scars: { A: 1, B: 4 }, hate: { A: 0, B: 0 }, mortal: "B" }).dies, false);
});

test("ejemplo 13: 9 y 9 cicatrices, odio 9 contra 11 → triunfa quien tiene menos odio", () => {
  const v = R.verdict({ scars: { A: 9, B: 9 }, hate: { A: 9, B: 11 } });
  assert.deepEqual(v, { triumph: "A", defeated: "B", dies: false, by: "hate" });
  assert.equal(R.verdict({ scars: { A: 3, B: 2 }, hate: { A: 0, B: 0 } }).defeated, "A");
  assert.equal(R.verdict({ scars: { A: 2, B: 2 }, hate: { A: 5, B: 5 } }).by, "draw");
});
