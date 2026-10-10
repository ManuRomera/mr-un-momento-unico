/**
 * Motor de la partida de «Un momento único». Puro: sin Foundry ni DOM.
 *
 * `apply(state, action, { rng })` devuelve un estado nuevo o lanza `EngineError`.
 * Todo lo aleatorio entra desde fuera: los dados llegan ya tirados en la acción (los tira
 * el cliente con `Roll`, así Dice So Nice los anima) y el barajado usa `rng`.
 * Los totales de Ventajas, Odio y Cicatrices se derivan del `ledger`: nunca hay contadores sueltos.
 */
import {
  RULES, SEATS, other, climaxDice, resolveClimax, hateRoll, canEscapeHate, escapeScars, startingAttacker,
  resolveExchange, resolveBet, mortalAttacker, mortalBlow, verdict
} from "./rules.mjs";

export class EngineError extends Error {
  constructor(code, data = {}) { super(code); this.code = code; this.data = data; }
}
const fail = (code, data) => { throw new EngineError(code, data); };

export const DECLARATIONS = Object.freeze(["era", "place", "span", "story"]);
export const KINDS = Object.freeze(["adv", "hate", "scar"]);

/* -------------------------------------------- */
/*  Utilidades                                  */
/* -------------------------------------------- */

export function shuffle(list, rng = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const clone = v => structuredClone(v);
const isDie = d => Number.isInteger(d) && d >= 1 && d <= 6;
const dice = (list, n) => { if (!Array.isArray(list) || list.length !== n || !list.every(isDie)) fail("badDice", { expected: n }); return list.map(Number); };
const text = v => String(v ?? "").trim().slice(0, 2000);

/** Totales derivados del ledger. */
export function totals(state) {
  const t = { A: { adv: 0, hate: 0, scar: 0 }, B: { adv: 0, hate: 0, scar: 0 } };
  for (const e of state.ledger) t[e.seat][e.kind] += e.n;
  return t;
}
export const advantages = (state, seat) => totals(state)[seat].adv;

function entry(state, seat, kind, n, note = "", source = "") {
  if (!n) return;
  const chapter = state.phase === "chapter" && !state.between ? state.chapter.n : 0;
  state.ledger.push({ id: ++state.seq, seat, kind, n, chapter, note: text(note), source });
}

/* -------------------------------------------- */
/*  Estado inicial                              */
/* -------------------------------------------- */

const blankSeat = () => ({ userId: "", user: "", name: "", clan: "", kamon: { shape: "mon-1", color: "#b3202a" }, actorUuid: "" });
const blankChapter = () => ({
  n: 0, active: "", step: 0, virtueId: "", theme: "", character: "", pool: { reserve: RULES.pool, A: 0, B: 0 }, decisions: [],
  extra: { A: 0, B: 0 }, consonance: null, proposal: null, ready: { A: false, B: false }, dice: { A: null, B: null }, result: null, summary: ""
});
const blankHate = () => ({ mode: "", done: false, dice: [], note: "", gained: 0, scars: 0, discarded: 0 });
const blankFinal = () => ({
  attacker: "", stage: "declare", round: 0, declaration: "", response: "", spend: { A: null, B: null }, dice: { A: null, B: null },
  bets: { A: null, B: null }, last: null, log: [], mortal: { round: 0, attacker: "", dice: { A: null, B: null } }
});

/**
 * @param setting { id, virtues: [{id}], themes: [{id}], characters: [{id}] }
 */
export function newGame({ setting, planned = 5, first = "A", mode = "two", weather = "" } = {}) {
  if (!setting?.virtues?.length) fail("noSetting");
  return {
    v: 1, rev: 0, seq: 0, phase: "setup", settingId: setting.id, mode, planned: Math.max(2, Math.min(40, planned)), first, weather,
    seats: { A: blankSeat(), B: blankSeat() },
    decl: { lines: ["", "", "", ""], step: 0, virtueId: "" },
    virtues: { all: setting.virtues.map(v => v.id), deck: [], discard: [], drawn: { A: "", B: "" }, drawing: false },
    themeIds: setting.themes.map(t => t.id), themesDone: [],
    charIds: setting.characters.map(c => c.id), chars: {},
    chapter: blankChapter(), played: 0, between: true,
    ledger: [], history: [],
    hate: { A: blankHate(), B: blankHate() },
    final: blankFinal(),
    verdict: null, epilogue: { step: 0, order: [], texts: [] }
  };
}

/* -------------------------------------------- */
/*  Consultas                                   */
/* -------------------------------------------- */

export const seatOfUser = (state, userId) => SEATS.find(s => state.seats[s].userId === userId) ?? null;
export const nextDeclarer = state => state.decl.step >= 4 ? null : (state.decl.step % 2 === 0 ? state.first : other(state.first));
export const virtueOfChapter = state => state.chapter.virtueId || state.decl.virtueId;
export const themesLeft = state => state.themeIds.filter(t => !state.themesDone.includes(t));
export const charsLeft = state => state.charIds.filter(c => !state.chars[c]);

/** Qué dados debe tirar cada asiento en el clímax. */
export function climaxPlan(state) {
  const c = state.chapter;
  return Object.fromEntries(SEATS.map(s => [s, climaxDice({ markers: c.pool[s], extra: c.extra[s], consonance: c.consonance === s })]));
}
/** Qué dados espera el intercambio en curso. */
export function exchangePlan(state) {
  const f = state.final, att = f.attacker, def = other(att);
  const n = s => 1 + (f.spend[s] ?? 0);
  return { [att]: n(att), [def]: n(def) };
}
/** Avisos que la interfaz muestra (nunca bloquean). */
export function warnings(state) {
  const w = [];
  if (state.phase === "chapter" && !state.between && state.chapter.step === 5 && state.chapter.pool.reserve > 0) w.push("reserveLeft");
  if ((state.phase === "chapter" && state.between && state.played > 0) || state.phase === "hate") {
    if (themesLeft(state).length) w.push("themesPending");
  }
  return w;
}

/* -------------------------------------------- */
/*  apply                                       */
/* -------------------------------------------- */

const need = (cond, code, data) => { if (!cond) fail(code, data); };
const seatArg = a => { need(SEATS.includes(a.seat), "badSeat"); return a.seat; };
const inPhase = (s, ...p) => need(p.includes(s.phase), "wrongPhase", { phase: s.phase });
const inStep = (s, n) => { inPhase(s, "chapter"); need(!s.between && s.chapter.step === n, "wrongStep", { step: s.chapter.step }); };
const inFinal = (s, stage) => { inPhase(s, "final"); need(s.final.stage === stage, "wrongStep", { stage: s.final.stage }); };

export function apply(prev, action, { rng = Math.random } = {}) {
  const s = clone(prev);
  const handler = HANDLERS[action?.type];
  if (!handler) fail("unknownAction", { type: action?.type });
  handler(s, action ?? {}, rng);
  s.rev = prev.rev + 1;
  return s;
}

const HANDLERS = {
  /* ---------- preparación ---------- */
  "seat.claim"(s, a) {
    inPhase(s, "setup");
    const seat = seatArg(a);
    need(!s.seats[seat].userId || s.seats[seat].userId === a.userId, "seatTaken");
    s.seats[seat].userId = a.userId; s.seats[seat].user = text(a.user);
  },
  "seat.leave"(s, a) { inPhase(s, "setup"); const seat = seatArg(a); s.seats[seat].userId = ""; s.seats[seat].user = ""; },
  "seat.profile"(s, a) {
    inPhase(s, "setup", "chapter");
    const seat = seatArg(a), p = s.seats[seat];
    if (a.name !== undefined) p.name = text(a.name).slice(0, 60);
    if (a.clan !== undefined) p.clan = text(a.clan).slice(0, 60);
    if (a.kamon) p.kamon = { shape: String(a.kamon.shape || p.kamon.shape), color: /^#[0-9a-f]{6}$/i.test(a.kamon.color) ? a.kamon.color : p.kamon.color };
    if (a.actorUuid !== undefined) p.actorUuid = String(a.actorUuid);
  },
  "setup.options"(s, a) {
    inPhase(s, "setup");
    if (a.first) { need(SEATS.includes(a.first), "badSeat"); s.first = a.first; }
    if (a.planned) s.planned = Math.max(2, Math.min(40, Math.trunc(a.planned)));
    if (a.mode) s.mode = a.mode === "gm" ? "gm" : "two";
  },
  "decl.write"(s, a, rng) {
    inPhase(s, "setup");
    const seat = seatArg(a), step = s.decl.step;
    need(step < 4, "declDone");
    need(nextDeclarer(s) === seat, "notYourTurn");
    need(s.seats.A.name && s.seats.B.name && s.seats.A.clan && s.seats.B.clan, "needNames");
    const line = text(a.text); need(line, "emptyText");
    s.decl.lines[step] = line;
    if (step === 0 && a.weather !== undefined) s.weather = String(a.weather);
    if (step === 3) {
      need(s.virtues.all.includes(a.virtueId), "needVirtue");
      s.decl.virtueId = a.virtueId;
      s.virtues.deck = shuffle(s.virtues.all.filter(v => v !== a.virtueId), rng);
    }
    s.decl.step = step + 1;
  },
  "decl.undo"(s) {
    inPhase(s, "setup");
    need(s.decl.step > 0, "nothingToUndo");
    s.decl.step -= 1; s.decl.lines[s.decl.step] = "";
    if (s.decl.step === 3) { s.decl.virtueId = ""; s.virtues.deck = []; }
  },

  /* ---------- capítulos ---------- */
  "chapter.begin"(s, a) {
    need(s.phase === "setup" || (s.phase === "chapter" && s.between), "wrongPhase");
    const seat = seatArg(a);
    if (s.phase === "setup") {
      need(s.decl.step === 4, "needDeclarations");
      need((s.seats.A.userId && s.seats.B.userId) || a.force, "needSeats");
      s.phase = "chapter";
    } else need(!s.chapter.active || s.chapter.active === seat || a.force, "notYourTurn");
    s.between = false;
    s.chapter = { ...blankChapter(), n: s.played + 1, active: seat, step: 1 };
  },
  "virtue.draw"(s, a, rng) {
    inStep(s, 1);
    need(!s.virtues.drawing, "drawing");
    if (s.virtues.deck.length < 2) { s.virtues.deck = shuffle([...s.virtues.deck, ...s.virtues.discard], rng); s.virtues.discard = []; }
    need(s.virtues.deck.length >= 1, "noVirtues");
    const deck = [...s.virtues.deck];
    const first = deck.shift(), second = deck.shift() ?? "";
    s.virtues.deck = deck; s.virtues.drawn = { A: first, B: second }; s.virtues.drawing = true;
  },
  "virtue.pick"(s, a, rng) {
    inStep(s, 1);
    need(s.virtues.drawing, "notDrawing");
    const chosen = a.virtueId, drawn = Object.values(s.virtues.drawn).filter(Boolean);
    need(drawn.includes(chosen), "badVirtue");
    s.chapter.virtueId = chosen;
    s.virtues.deck = shuffle([...s.virtues.deck, ...drawn.filter(v => v !== chosen)], rng);
    s.virtues.drawn = { A: "", B: "" }; s.virtues.drawing = false;
    s.chapter.step = 2;
  },
  "virtue.keep"(s) {
    inStep(s, 1);
    need(!s.virtues.drawing, "drawing");
    s.chapter.virtueId = s.decl.virtueId;
    s.chapter.step = 2;
  },
  "theme.pick"(s, a) {
    inStep(s, 2);
    need(themesLeft(s).includes(a.themeId), "badTheme");
    s.chapter.theme = a.themeId; s.themesDone.push(a.themeId);
    entry(s, s.chapter.active, "adv", RULES.themeBonus, a.note ?? "", "theme");
    s.chapter.step = 3;
  },
  "theme.skip"(s) { inStep(s, 2); s.chapter.step = 3; },
  "char.pick"(s, a) {
    inStep(s, 3);
    need(charsLeft(s).includes(a.characterId), "badCharacter");
    s.chars[a.characterId] = { owner: s.chapter.active, name: text(a.name).slice(0, 60), chapter: s.chapter.n };
    s.chapter.character = a.characterId;
    s.chapter.step = 4;
  },
  "char.skip"(s) { inStep(s, 3); s.chapter.step = 4; },
  /** Una decisión del capítulo. `toSeat` es el samurái al que favorece: el marcador va al OTRO. */
  "pool.favor"(s, a) {
    inStep(s, 4);
    need(s.chapter.pool.reserve > 0, "reserveEmpty");
    const none = a.toSeat === "none";
    need(SEATS.includes(a.toSeat) || none, "badSeat");
    if (!none) { s.chapter.pool[other(a.toSeat)] += 1; s.chapter.pool.reserve -= 1; }
    s.chapter.decisions.push({ favored: a.toSeat, note: text(a.note).slice(0, 300), n: s.chapter.decisions.length + 1 });
  },
  "pool.undo"(s) {
    inStep(s, 4);
    const last = s.chapter.decisions.at(-1); need(last, "nothingToUndo");
    if (last.favored !== "none") {
      need(s.chapter.pool[other(last.favored)] > 0, "belowZero"); // el reparto se corrigió a mano: no se puede deshacer esa decisión
      s.chapter.pool[other(last.favored)] -= 1; s.chapter.pool.reserve += 1;
    }
    s.chapter.decisions.pop();
  },
  "pool.settle"(s) { inStep(s, 4); s.chapter.step = 5; },
  "climax.extra"(s, a) {
    inStep(s, 5);
    const seat = seatArg(a), c = s.chapter;
    need(!c.ready[seat], "locked");
    const room = climaxDice({ markers: c.pool[seat], extra: 99, consonance: c.consonance === seat }).room; // el tope de 7 incluye la consonancia (D5)
    c.extra[seat] = Math.max(0, Math.min(room, Math.trunc(a.n) || 0));
  },
  "consonance.propose"(s, a) {
    inStep(s, 5);
    need(SEATS.includes(a.by), "badSeat");
    need(!s.chapter.ready.A && !s.chapter.ready.B, "locked");
    if (a.seat === null) { s.chapter.proposal = null; s.chapter.consonance = null; return; }
    need(SEATS.includes(a.seat), "badSeat");
    s.chapter.proposal = { seat: a.seat, by: a.by };
  },
  "consonance.accept"(s, a) {
    inStep(s, 5);
    const p = s.chapter.proposal; need(p, "noProposal");
    need(a.by === other(p.by) || a.force, "notYourTurn");
    s.chapter.consonance = p.seat; s.chapter.proposal = null;
    for (const seat of SEATS) {
      const room = climaxDice({ markers: s.chapter.pool[seat], extra: 99, consonance: s.chapter.consonance === seat }).room;
      s.chapter.extra[seat] = Math.min(s.chapter.extra[seat], room);
    }
  },
  "consonance.reject"(s) { inStep(s, 5); s.chapter.proposal = null; },
  "climax.ready"(s, a) {
    inStep(s, 5);
    const seat = seatArg(a);
    need(!(s.chapter.ready.A && s.chapter.ready.B), "locked");
    s.chapter.ready[seat] = a.ready !== false;
  },
  "climax.roll"(s, a) {
    inStep(s, 5);
    const seat = seatArg(a), c = s.chapter;
    need(c.ready.A && c.ready.B, "notReady");
    need(!c.dice[seat], "alreadyRolled");
    const plan = climaxPlan(s);
    c.dice[seat] = dice(a.dice, plan[seat].dice);
    if (!c.dice.A || !c.dice.B) return;
    const r = resolveClimax({
      A: { markers: c.pool.A, dice: c.dice.A }, B: { markers: c.pool.B, dice: c.dice.B }, active: c.active,
      extra: { A: plan.A.extra, B: plan.B.extra }
    });
    c.result = r;
    for (const x of SEATS) {
      entry(s, x, "adv", r.advantages[x], "", "climax");
      entry(s, x, "hate", r.hate[x], "", "climax");
      entry(s, x, "scar", r.scars[x], "", "climax");
    }
    c.step = 6;
  },
  "chapter.close"(s, a, rng) {
    inStep(s, 6);
    const c = s.chapter, r = c.result;
    const narrator = r.winner ?? c.active;
    need(a.seat === narrator || a.force, "notNarrator", { narrator });
    c.summary = text(a.summary);
    s.history.push(clone(c));
    // se descarta la virtud del capítulo si salió del mazo; el resto se baraja (p.28)
    if (c.virtueId && c.virtueId !== s.decl.virtueId) s.virtues.discard.push(c.virtueId);
    s.virtues.deck = shuffle(s.virtues.deck, rng);
    s.played += 1; s.between = true;
    s.chapter = { ...blankChapter(), active: other(c.active) };
  },
  "game.toHate"(s) {
    need(s.phase === "chapter" && s.between && s.played >= 1, "wrongPhase");
    s.phase = "hate";
  },

  /* ---------- odio ---------- */
  "hate.choose"(s, a) {
    inPhase(s, "hate");
    const seat = seatArg(a), h = s.hate[seat], t = totals(s)[seat];
    need(!h.done, "alreadyDone");
    need(["surrender", "escape", "keep"].includes(a.mode), "badMode");
    h.mode = a.mode; h.note = text(a.note);
    if (a.mode === "escape") {
      need(canEscapeHate(t.hate), "cannotEscape");
      const e = escapeScars(t.hate, t.scar);
      entry(s, seat, "scar", -e.discarded, h.note, "escape"); h.discarded = e.discarded; h.done = true;
    } else if (a.mode === "keep") h.done = true;
    else need(t.hate > 0, "noHate");
    finishHate(s);
  },
  "hate.roll"(s, a) {
    inPhase(s, "hate");
    const seat = seatArg(a), h = s.hate[seat], hate = totals(s)[seat].hate;
    need(h.mode === "surrender" && !h.done, "wrongStep");
    h.dice = dice(a.dice, hate);
    const r = hateRoll(h.dice);
    entry(s, seat, "adv", r.advantages, h.note, "hate"); entry(s, seat, "scar", r.scars, h.note, "hate");
    h.gained = r.advantages; h.scars = r.scars; h.done = true;
    finishHate(s);
  },
  "hate.undo"(s, a) {
    inPhase(s, "hate");
    const h = s.hate[seatArg(a)];
    need(h.mode && !h.done, "nothingToUndo");
    h.mode = "";
  },

  /* ---------- gran final ---------- */
  "final.declare"(s, a) {
    inFinal(s, "declare");
    need(a.seat === s.final.attacker, "notYourTurn");
    s.final.declaration = text(a.text); need(s.final.declaration, "emptyText");
    advanceDeclare(s);
  },
  "final.respond"(s, a) {
    inFinal(s, "declare");
    need(a.seat === other(s.final.attacker), "notYourTurn");
    s.final.response = text(a.text); need(s.final.response, "emptyText");
    advanceDeclare(s);
  },
  "final.spend"(s, a) {
    inFinal(s, "spend");
    const seat = seatArg(a), f = s.final, att = f.attacker, adv = advantages(s, seat);
    need(f.spend[seat] === null, "alreadyDone");
    const n = Math.max(0, Math.min(RULES.maxSpend, Math.trunc(a.n) || 0));
    need(seat === att ? adv >= 1 + n : adv >= n, "notEnoughAdvantages");
    f.spend[seat] = n;
    if (f.spend.A === null || f.spend.B === null) return;
    entry(s, att, "adv", -(1 + f.spend[att]), "", "exchange");
    entry(s, other(att), "adv", -f.spend[other(att)], "", "exchange");
    f.stage = "roll"; f.dice = { A: null, B: null };
  },
  "final.roll"(s, a) {
    inFinal(s, "roll");
    const seat = seatArg(a), f = s.final;
    need(!f.dice[seat], "alreadyRolled");
    f.dice[seat] = dice(a.dice, exchangePlan(s)[seat]);
    if (!f.dice.A || !f.dice.B) return;
    const att = f.attacker, def = other(att);
    const r = resolveExchange({ attacker: f.dice[att], defender: f.dice[def] });
    f.last = { round: f.round, attacker: att, dice: clone(f.dice), best: r.best, tie: r.tie, winner: r.tie ? null : (r.winner === "attacker" ? att : def), bet: null };
    if (r.tie) { f.stage = "bet"; f.bets = { A: null, B: null }; return; }
    scarTo(s, other(f.last.winner));
    f.stage = "resolved";
  },
  "final.bet"(s, a) {
    inFinal(s, "bet");
    const seat = seatArg(a), f = s.final;
    need(f.bets[seat] === null, "alreadyDone");
    const n = Math.trunc(a.n); need(n >= 0 && n <= advantages(s, seat), "notEnoughAdvantages");
    f.bets[seat] = n;
    if (f.bets.A === null || f.bets.B === null) return;
    const att = f.attacker, def = other(att);
    // las ventajas apostadas se gastan, gane quien gane (ejemplo 9 del libro: «ha gastado seis ventajas»)
    for (const x of SEATS) entry(s, x, "adv", -f.bets[x], "", "bet");
    const r = resolveBet(f.bets[att], f.bets[def]);
    f.last.bet = clone(f.bets);
    f.last.winner = r.winner === null ? null : (r.winner === "attacker" ? att : def);
    if (f.last.winner) scarTo(s, other(f.last.winner));
    f.stage = "resolved";
  },
  "final.narrate"(s, a) {
    inFinal(s, "resolved");
    const f = s.final, last = f.last, who = last.winner ?? f.attacker;
    need(a.seat === who || a.force, "notNarrator", { narrator: who });
    f.log.push({ round: f.round, attacker: last.attacker, declaration: f.declaration, response: f.response, dice: last.dice, best: last.best, winner: last.winner, bet: last.bet, text: text(a.text) });
    f.attacker = other(f.attacker); f.round += 1; f.declaration = ""; f.response = ""; f.spend = { A: null, B: null }; f.dice = { A: null, B: null }; f.bets = { A: null, B: null }; f.last = null;
    f.stage = "declare";
    checkMortal(s);
  },
  "final.mortalRoll"(s, a) {
    inFinal(s, "mortal");
    const seat = seatArg(a), m = s.final.mortal;
    need(!m.dice[seat], "alreadyRolled");
    m.dice[seat] = dice(a.dice, 1);
    if (!m.dice.A || !m.dice.B) return;
    const att = m.attacker, def = other(att);
    const success = mortalBlow(m.dice[att][0], m.dice[def][0]);
    s.final.log.push({ mortal: m.round, attacker: att, dice: clone(m.dice), success });
    if (success) {
      const adv = advantages(s, att);
      entry(s, att, "adv", -adv, "", "mortal"); entry(s, def, "scar", adv, "", "mortal");
      return conclude(s, att);
    }
    if (m.round === 1) { s.final.mortal = { round: 2, attacker: def, dice: { A: null, B: null } }; return; }
    conclude(s, null);
  },

  /* ---------- epílogo ---------- */
  "epilogue.write"(s, a) {
    inPhase(s, "epilogue");
    const e = s.epilogue, expected = e.order[e.step];
    need(a.seat === expected || a.force, "notYourTurn", { expected });
    e.texts.push({ seat: expected, text: text(a.text) });
    e.step += 1;
    if (e.step >= e.order.length) s.phase = "done";
  },

  /* ---------- correcciones a mano ----------
     Para arreglar un error en partida. Las pueden hacer los dos jugadores y el Director; ninguna baja de cero
     y las de contadores quedan en el libro (origen «fix»). */
  "fix.ledger"(s, a) {
    need(s.phase !== "setup", "wrongPhase");
    const seat = seatArg(a);
    need(KINDS.includes(a.kind), "badKind");
    const delta = Math.trunc(a.delta) || 0;
    need(delta !== 0, "badAmount");
    need(totals(s)[seat][a.kind] + delta >= 0, "belowZero");
    entry(s, seat, a.kind, delta, a.note ?? "", "fix");
    if (s.phase === "final") resyncFinal(s);
  },
  /** Mueve un marcador de Elección entre la reserva y un jugador (pasos 4 y 5, antes de tirar). */
  "fix.pool"(s, a) {
    inPhase(s, "chapter");
    const c = s.chapter;
    need(!s.between && (c.step === 4 || c.step === 5), "wrongStep");
    need(!c.dice.A && !c.dice.B, "locked");
    const seat = seatArg(a);
    if (Math.trunc(a.delta) < 0) { need(c.pool[seat] > 0, "belowZero"); c.pool[seat] -= 1; c.pool.reserve += 1; }
    else { need(c.pool.reserve > 0, "reserveEmpty"); c.pool[seat] += 1; c.pool.reserve -= 1; }
    // el plan del clímax cambia: se desbloquea y se recorta lo que ya no cabe (el tope de 7 incluye la consonancia)
    c.ready = { A: false, B: false };
    for (const x of SEATS) c.extra[x] = Math.min(c.extra[x], climaxDice({ markers: c.pool[x], extra: 99, consonance: c.consonance === x }).room);
  },
  /** Marca un tema clave como jugado o lo devuelve. Las ventajas que dio siguen en el libro: se corrigen con fix.ledger. */
  "fix.theme"(s, a) {
    need(s.themeIds.includes(a.themeId), "badTheme");
    const used = s.themesDone.includes(a.themeId);
    if (a.used && !used) s.themesDone.push(a.themeId);
    if (!a.used && used) {
      s.themesDone = s.themesDone.filter(t => t !== a.themeId);
      if (s.chapter.theme === a.themeId) s.chapter.theme = "";
    }
  },
  /** Asigna un personaje clave a un jugador o lo libera (`owner: ""`). */
  "fix.char"(s, a) {
    need(s.charIds.includes(a.characterId), "badCharacter");
    if (a.owner === "" || a.owner === null) {
      delete s.chars[a.characterId];
      if (s.chapter.character === a.characterId) s.chapter.character = "";
      return;
    }
    need(SEATS.includes(a.owner), "badSeat");
    s.chars[a.characterId] = { owner: a.owner, name: text(a.name ?? s.chars[a.characterId]?.name).slice(0, 60), chapter: s.chars[a.characterId]?.chapter ?? s.chapter.n };
  },
  /** Mueve una virtud entre el mazo y el descarte. No toca la de la historia, la del capítulo ni las que están sobre la mesa. */
  "fix.virtue"(s, a, rng) {
    need(s.virtues.all.includes(a.virtueId), "badVirtue");
    need(a.virtueId !== s.decl.virtueId && !Object.values(s.virtues.drawn).includes(a.virtueId), "badVirtue");
    need(!(s.phase === "chapter" && !s.between && s.chapter.virtueId === a.virtueId), "badVirtue");
    s.virtues.deck = s.virtues.deck.filter(v => v !== a.virtueId);
    s.virtues.discard = s.virtues.discard.filter(v => v !== a.virtueId);
    if (a.where === "discard") s.virtues.discard.push(a.virtueId);
    else s.virtues.deck = shuffle([...s.virtues.deck, a.virtueId], rng);
  },
  /** Cuántos capítulos se jugarán. */
  "fix.planned"(s, a) {
    need(s.phase === "setup" || s.phase === "chapter", "wrongPhase");
    s.planned = Math.max(2, Math.min(40, Math.trunc(a.n) || s.planned));
  },

  /* ---------- administración (árbitro) ---------- */
  "admin.ledger"(s, a) {
    need(SEATS.includes(a.seat) && KINDS.includes(a.kind), "badSeat");
    entry(s, a.seat, a.kind, Math.trunc(a.n) || 0, a.note || "", "admin");
  },
  "admin.step"(s, a) {
    need(s.phase === "chapter" && !s.between, "wrongPhase");
    s.chapter.step = Math.max(1, Math.min(6, Math.trunc(a.step)));
  },
  "admin.weather"(s, a) { s.weather = String(a.weather ?? ""); },
  "admin.force"(s, a, rng) {
    const inner = HANDLERS[a.action?.type];
    need(inner && !String(a.action.type).startsWith("admin."), "unknownAction");
    inner(s, { ...a.action, force: true }, rng);
  },
  "admin.skipDeclarations"(s) { inPhase(s, "setup"); s.decl.step = 4; }
};

export const ACTIONS = Object.freeze(Object.keys(HANDLERS));

/* -------------------------------------------- */
/*  Transiciones internas                       */
/* -------------------------------------------- */

function finishHate(s) {
  if (!SEATS.every(x => s.hate[x].done)) return;
  s.phase = "final";
  const t = totals(s);
  s.final = { ...blankFinal(), attacker: startingAttacker({ A: { hate: t.A.hate, advantages: t.A.adv, scars: t.A.scar }, B: { hate: t.B.hate, advantages: t.B.adv, scars: t.B.scar } }, s.first) };
  checkMortal(s);
}
/** Tras corregir las ventajas en el Gran Final: quién intenta el golpe mortal puede haber cambiado. */
function resyncFinal(s) {
  const f = s.final, t = totals(s), m = mortalAttacker({ A: t.A.adv, B: t.B.adv });
  if (f.stage === "mortal") {
    if (f.mortal.dice.A || f.mortal.dice.B) return; // ya se está tirando: no se toca
    if (m) { if (f.mortal.round === 1) f.mortal.attacker = m; }
    else if (t.A.adv === 0 && t.B.adv === 0) conclude(s, null);
    else { f.stage = "declare"; f.mortal = { round: 0, attacker: "", dice: { A: null, B: null } }; }
  } else if (f.stage === "declare") checkMortal(s);
}
function advanceDeclare(s) { if (s.final.declaration && s.final.response) s.final.stage = "spend"; }
function scarTo(s, seat) { entry(s, seat, "scar", 1, "", "exchange"); }

/** En cuanto alguien se queda sin ventajas, el otro intenta el golpe mortal (p.35). */
function checkMortal(s) {
  const t = totals(s), m = mortalAttacker({ A: t.A.adv, B: t.B.adv });
  if (m) { s.final.stage = "mortal"; s.final.mortal = { round: 1, attacker: m, dice: { A: null, B: null } }; }
  else if (t.A.adv === 0 && t.B.adv === 0) conclude(s, null);
}

function conclude(s, mortal) {
  const t = totals(s);
  s.verdict = verdict({ scars: { A: t.A.scar, B: t.B.scar }, hate: { A: t.A.hate, B: t.B.hate }, mortal });
  s.final.stage = "done";
  s.phase = "epilogue";
  const v = s.verdict;
  s.epilogue = { step: 0, order: v.triumph ? [v.triumph, v.defeated, v.triumph] : [s.first, other(s.first), s.first], texts: [] };
}
