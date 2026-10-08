import { SoundService } from "./sound.mjs";

/** Tira n d6 con Foundry (y Dice So Nice si está instalado). Devuelve la lista de resultados. */
export async function rollDice(n) {
  if (n <= 0) return [];
  const roll = await new Roll(`${n}d6`).evaluate();
  SoundService.dice();
  if (game.dice3d?.showForRoll) { try { await game.dice3d.showForRoll(roll, game.user, true); } catch (e) { console.warn("Dice So Nice", e); } }
  return roll.dice[0].results.map(r => r.result);
}
