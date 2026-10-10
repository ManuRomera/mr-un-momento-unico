import { ASSETS, RULES, SEATS, TEMPLATES, WEATHER, WEATHER_SOUND } from "../constants.mjs";
import { SystemApp, t, f } from "./base.mjs";
import { openApp } from "./registry.mjs";
import { cssUrl } from "./view.mjs";
import { GameService, loc } from "../services/game.mjs";
import { SoundService } from "../services/sound.mjs";
import { rollDice } from "../services/dice.mjs";
import { advantages, charsLeft, climaxPlan, exchangePlan, nextDeclarer, themesLeft, totals, warnings } from "../engine.mjs";
import { other } from "../rules.mjs";
import { KAMON_SHAPES, kamonSvg } from "../data/kamon.mjs";
import { reducedEffects } from "../settings.mjs";

const PIPS = 18;
const pips = n => ({ list: Array.from({ length: Math.min(Math.max(n, 0), PIPS) }, (_, i) => i), more: Math.max(0, n - PIPS), n });
const STEP_KEYS = ["", "virtue", "theme", "character", "play", "climax", "close"];
const val = (root, name) => root.querySelector(`[name="${name}"]`)?.value ?? "";

/**
 * La Mesa del Duelo: la ventana principal. Dos asientos enfrentados y, en el centro, el rollo con lo que toca
 * hacer en cada fase. El estado vive en el JournalEntry de la partida; esta ventana solo lo pinta y envía acciones.
 */
export class TableApp extends SystemApp {
  static MEMORY = "table";
  /** La variante a pantalla completa (ScreenTable) lo pone a true: sin marco, con botón para ocultarla. */
  static SCREEN = false;
  static SCROLL_MEMORY = [".umu-center"];
  static DEFAULT_OPTIONS = {
    id: "umu-table", classes: ["umu-table-app"],
    window: { title: "UMU.App.Table", icon: "fa-solid fa-torii-gate" },
    position: { width: 1120, height: 760 },
    actions: {
      actAs: TableApp.#actAs, claim: TableApp.#claim, leave: TableApp.#leave, kamon: TableApp.#kamon,
      declWrite: TableApp.#declWrite, declUndo: TableApp.#send("decl.undo"), skipDecl: TableApp.#send("admin.skipDeclarations"),
      begin: TableApp.#begin, virtueDraw: TableApp.#send("virtue.draw"), virtueKeep: TableApp.#send("virtue.keep"), virtuePick: TableApp.#virtuePick,
      themePick: TableApp.#themePick, themeSkip: TableApp.#send("theme.skip"), charPick: TableApp.#charPick, charSkip: TableApp.#send("char.skip"),
      favor: TableApp.#favor, poolUndo: TableApp.#send("pool.undo"), settle: TableApp.#send("pool.settle"),
      extra: TableApp.#extra, consPropose: TableApp.#consPropose, consClear: TableApp.#consClear, consAccept: TableApp.#consAnswer("accept"), consReject: TableApp.#consAnswer("reject"),
      ready: TableApp.#ready, rollClimax: TableApp.#rollClimax, closeChapter: TableApp.#closeChapter, toHate: TableApp.#send("game.toHate"),
      hateChoose: TableApp.#hateChoose, hateRoll: TableApp.#hateRoll, hateUndo: TableApp.#hateUndo, hateIdea: TableApp.#hateIdea,
      finalWrite: TableApp.#finalWrite, spend: TableApp.#spend, rollExchange: TableApp.#rollExchange, bet: TableApp.#bet, narrate: TableApp.#narrate, rollMortal: TableApp.#rollMortal,
      epilogueWrite: TableApp.#epilogueWrite, chronicle: () => openApp("chronicle"), safety: () => openApp("safety"), access: () => openApp("access"),
      toggleFixes: TableApp.#toggleFixes, fixLedger: TableApp.#fixLedger, fixPool: TableApp.#fixPool, fixTheme: TableApp.#fixTheme, fixChar: TableApp.#fixChar, fixVirtue: TableApp.#fixVirtue, fixPlanned: TableApp.#fixPlanned,
      zoom: TableApp.#zoom, newGame: TableApp.#newGame, arbiterLedger: TableApp.#arbiterLedger, arbiterStep: TableApp.#arbiterStep, arbiterForce: TableApp.#arbiterForce
    }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/table.hbs`, scrollable: [".umu-center"] } };

  #override = null;
  #shown = null;

  /** Se llama una vez desde el arranque: repinta la Mesa cuando cambia la partida. */
  static init() {
    Hooks.on("updateJournalEntry", doc => { if (doc.id === GameService.doc()?.id) TableApp.instance?.refresh(); });
    Hooks.on("createJournalEntry", doc => { if (doc.id === GameService.doc()?.id) TableApp.instance?.refresh(); });
  }
  refresh() { if (this.rendered) this.render(); }

  /* ---------------------------------------- */
  /*  Contexto                                */
  /* ---------------------------------------- */

  /** Asiento desde el que actúa este usuario: el suyo, o el que elija si tiene los dos o es árbitro. */
  #me(state) {
    const held = SEATS.filter(s => state.seats[s].userId === game.user.id);
    if (this.#override && (held.includes(this.#override) || game.user.isGM)) return this.#override;
    if (held.length) return held[0];
    return null;
  }

  #seatView(state, seat, me, tot) {
    const p = state.seats[seat], actor = p.actorUuid ? fromUuidSync(p.actorUuid) : null;
    const name = p.name || p.user || f("UMU.Seat.Default", { seat });
    return {
      seat, name, clan: p.clan, user: p.user, claimed: Boolean(p.userId), mine: p.userId === game.user.id, isMe: seat === me,
      kamon: kamonSvg(p.kamon.shape, p.kamon.color, 72, p.clan), color: p.kamon.color,
      portrait: actor?.img || ASSETS.portrait[seat],
      adv: pips(tot[seat].adv), hate: pips(tot[seat].hate), scar: pips(tot[seat].scar), totals: tot[seat],
      isActive: state.phase === "chapter" && !state.between && state.chapter.active === seat,
      ink: seat === "A" ? "sumi" : "washi", low: state.phase === "final" && tot[seat].adv <= 1
    };
  }

  async _prepareContext() {
    const state = GameService.state(), gm = game.user.isGM;
    const screen = this.constructor.SCREEN;
    if (!state) return { noGame: true, gm, screen };
    const def = GameService.settingDef(state.settingId), me = this.#me(state), tot = totals(state);
    const left = me ?? "A", right = other(left);
    const seats = Object.fromEntries(SEATS.map(s => [s, this.#seatView(state, s, me, tot)]));
    const nameOf = s => seats[s]?.name ?? "";
    const held = SEATS.filter(s => state.seats[s].userId === game.user.id);
    const phase = state.phase;
    const virtueView = id => {
      const v = def.virtues.find(x => x.id === id);
      return v ? { id: v.id, glyph: v.glyph, romaji: v.romaji, name: loc(v.name), blurb: loc(v.blurb) } : null;
    };

    const ctx = {
      gm, screen, state, me, left: seats[left], right: seats[right], seats, spectator: !me, arbiter: gm,
      canSwitch: held.length > 1 || (gm && !held.length), switchSeats: SEATS.map(s => ({ seat: s, name: nameOf(s), on: s === me })),
      phase, isSetup: phase === "setup", isChapter: phase === "chapter", isHate: phase === "hate", isFinal: phase === "final", isEpilogue: phase === "epilogue", isDone: phase === "done",
      setting: { id: def.id, name: loc(def.name), tagline: loc(def.tagline) },
      weather: state.weather, weatherName: state.weather ? t(`UMU.Weather.${state.weather}`) : "",
      bg: cssUrl(this.#background(state)), cine: phase === "final" || phase === "epilogue" && state.verdict,
      warnings: warnings(state).map(w => t(`UMU.Warn.${w}`)),
      chapterLabel: this.#chapterLabel(state), played: state.played, planned: state.planned,
      history: state.history.map(h => ({ n: h.n, virtue: virtueView(h.virtueId), theme: h.theme ? loc(def.themes.find(x => x.id === h.theme)?.title) : "", winner: h.result?.winner, winnerName: h.result?.winner ? nameOf(h.result.winner) : t("UMU.Climax.Tie"), summary: h.summary, active: nameOf(h.active) })),
      virtueDeclared: virtueView(state.decl.virtueId)
    };

    if (phase === "setup") ctx.setup = this.#setup(state, def, me, seats, held, virtueView, nameOf);
    if (phase === "chapter") ctx.chapter = state.between ? this.#between(state, me, nameOf) : this.#chapter(state, def, me, seats, tot, virtueView, nameOf);
    if (phase === "hate") ctx.hate = this.#hate(state, def, me, tot, nameOf);
    if (phase === "final") ctx.final = this.#final(state, me, tot, nameOf);
    if (phase === "epilogue" || phase === "done") ctx.epilogue = this.#epilogue(state, me, nameOf);
    if (state.verdict) ctx.verdict = { ...state.verdict, triumphName: state.verdict.triumph ? nameOf(state.verdict.triumph) : "", defeatedName: state.verdict.defeated ? nameOf(state.verdict.defeated) : "", by: t(`UMU.Verdict.by.${state.verdict.by}`) };
    ctx.weatherOptions = [{ key: "", name: t("UMU.Weather.none"), on: !state.weather }, ...WEATHER.map(w => ({ key: w, name: t(`UMU.Weather.${w}`), on: state.weather === w }))];
    ctx.kamonShapes = KAMON_SHAPES;
    ctx.canFix = Boolean(me) || gm;
    ctx.fixing = ctx.canFix && this.sectionOpen("fixes", false);
    if (ctx.fixing) ctx.fixes = this.#fixes(state, def, nameOf);
    return ctx;
  }

  /** El panel «Corregir a mano»: lo que los automatismos consumen o reparten, con su botón para arreglarlo. */
  #fixes(state, def, nameOf) {
    const c = state.chapter, playing = state.phase === "chapter" && !state.between;
    const poolOpen = playing && (c.step === 4 || c.step === 5) && !c.dice.A && !c.dice.B;
    const drawn = Object.values(state.virtues.drawn).filter(Boolean);
    const where = id => id === state.decl.virtueId ? "story" : drawn.includes(id) ? "table" : playing && c.virtueId === id ? "play" : state.virtues.deck.includes(id) ? "deck" : state.virtues.discard.includes(id) ? "discard" : "deck";
    return {
      pool: poolOpen ? { reserve: c.pool.reserve, seats: SEATS.map(s => ({ seat: s, name: nameOf(s), n: c.pool[s] })) } : null,
      themes: def.themes.map(x => ({ id: x.id, title: loc(x.title), used: state.themesDone.includes(x.id) })),
      chars: def.characters.map(x => {
        const owner = state.chars[x.id]?.owner ?? "";
        return { id: x.id, title: loc(x.title), free: !owner, ownerName: owner ? nameOf(owner) : "", seats: SEATS.filter(s => s !== owner).map(s => ({ seat: s, name: nameOf(s) })) };
      }),
      virtues: state.decl.virtueId ? def.virtues.filter(v => v.id !== state.decl.virtueId).map(v => {
        const w = where(v.id), movable = w === "deck" || w === "discard";
        return { id: v.id, glyph: v.glyph, name: loc(v.name), movable, whereLabel: t(`UMU.Fix.Where.${w}`), moveTo: w === "deck" ? "discard" : "deck", moveLabel: t(w === "deck" ? "UMU.Fix.ToDiscard" : "UMU.Fix.ToDeck") };
      }) : [],
      planned: state.planned, canPlanned: state.phase === "setup" || state.phase === "chapter"
    };
  }

  #background(state) {
    if (state.phase === "final") return ASSETS.final;
    if (state.phase === "epilogue" || state.phase === "done") return ASSETS.epilogue;
    if (state.phase === "setup") return ASSETS.scene;
    return ASSETS.weather[state.weather] ?? ASSETS.scene;
  }
  #chapterLabel(state) {
    if (state.phase === "setup") return t("UMU.Phase.setup");
    if (state.phase === "chapter") return state.between ? f("UMU.Chapter.Between", { n: state.played, total: state.planned }) : f("UMU.Chapter.Label", { n: state.chapter.n, total: state.planned });
    return t(`UMU.Phase.${state.phase}`);
  }

  #setup(state, def, me, seats, held, virtueView, nameOf) {
    const step = state.decl.step, writer = nextDeclarer(state);
    const DKEYS = ["era", "place", "span", "story"];
    const canPlay = Boolean(me) || game.user.isGM;
    return {
      seatCards: SEATS.map(s => ({ ...seats[s], canClaim: !seats[s].claimed && !game.user.isGM || (!seats[s].claimed && game.user.isGM), canLeave: seats[s].mine })),
      profiles: SEATS.filter(s => state.seats[s].userId === game.user.id || (game.user.isGM && state.seats[s].userId !== game.user.id)).map(s => ({
        seat: s, name: state.seats[s].name, clan: state.seats[s].clan, color: state.seats[s].kamon.color, you: state.seats[s].userId === game.user.id,
        legend: state.seats[s].userId === game.user.id ? t("UMU.Setup.YourSamurai") : f("UMU.Setup.SamuraiOf", { seat: s }),
        shapes: KAMON_SHAPES.map(shape => ({ shape, svg: kamonSvg(shape, state.seats[s].kamon.color, 40), on: shape === state.seats[s].kamon.shape }))
      })),
      canOptions: canPlay,
      firstOptions: SEATS.map(s => ({ seat: s, name: nameOf(s), on: state.first === s })),
      planned: state.planned,
      mode: state.mode,
      lines: DKEYS.map((key, i) => ({
        i, key, label: t(`UMU.Decl.${key}`), hint: t(`UMU.Decl.${key}Hint`), text: state.decl.lines[i], done: i < step, current: i === step,
        writer: i % 2 === 0 ? state.first : other(state.first), writerName: nameOf(i % 2 === 0 ? state.first : other(state.first)),
        mine: i === step && (writer === me || (game.user.isGM && !me)), example: loc(def.examples[key]), isStory: key === "story", isEra: key === "era"
      })),
      declStep: step, declDone: step >= 4,
      virtues: def.virtues.map(v => ({ ...virtueView(v.id), chosen: state.decl.virtueId === v.id })),
      writerName: writer ? nameOf(writer) : "",
      canUndo: step > 0 && canPlay,
      namesOk: Boolean(state.seats.A.name && state.seats.B.name && state.seats.A.clan && state.seats.B.clan),
      starters: SEATS.filter(s => s === me || (game.user.isGM && !me)).map(s => ({ seat: s, name: nameOf(s) })),
      canStart: canPlay && step >= 4, bothSeated: Boolean(state.seats.A.userId && state.seats.B.userId),
      intro: loc(def.examples.intro)
    };
  }

  #between(state, me, nameOf) {
    const next = state.chapter.active;
    return {
      between: true, next, nextName: nameOf(next), canBegin: me === next || (game.user.isGM && !me),
      canHate: Boolean(me) || game.user.isGM, played: state.played, planned: state.planned, reached: state.played >= state.planned
    };
  }

  #chapter(state, def, me, seats, tot, virtueView, nameOf) {
    const c = state.chapter, active = c.active, isActive = me === active || (game.user.isGM && !me);
    const plan = climaxPlan(state);
    const drawn = Object.values(state.virtues.drawn).filter(Boolean).map(virtueView);
    const mePlan = me ? plan[me] : null, rivalPlan = me ? plan[other(me)] : null;
    const ready = c.ready, locked = ready.A && ready.B;
    const proposal = c.proposal ? { seat: c.proposal.seat, name: nameOf(c.proposal.seat), by: nameOf(c.proposal.by), canAnswer: me && c.proposal.by !== me } : null;
    const r = c.result;
    const narrator = r ? (r.winner ?? active) : null;
    const virtue = virtueView(c.virtueId || state.decl.virtueId);
    return {
      n: c.n, step: c.step, stepKey: STEP_KEYS[c.step], active, activeName: nameOf(active), isActive, activeSeat: seats[active],
      steps: STEP_KEYS.slice(1).map((key, i) => ({ n: i + 1, label: t(`UMU.Step.${key}`), state: i + 1 < c.step ? "done" : i + 1 === c.step ? "current" : "todo" })),
      virtue, virtueDeclared: virtueView(state.decl.virtueId), drawing: state.virtues.drawing, drawn, deckLeft: state.virtues.deck.length,
      themes: def.themes.map(x => ({ id: x.id, title: loc(x.title), quote: loc(x.quote), art: ASSETS.cards[x.id], done: state.themesDone.includes(x.id), available: themesLeft(state).includes(x.id), current: c.theme === x.id })),
      themesDone: state.themesDone.length, themesTotal: state.themeIds.length,
      chars: def.characters.map(x => ({ id: x.id, title: loc(x.title), blurb: loc(x.blurb), art: ASSETS.cards[x.id], owner: state.chars[x.id]?.owner ? nameOf(state.chars[x.id].owner) : "", ownerName: state.chars[x.id]?.name ?? "", available: charsLeft(state).includes(x.id) })),
      theme: c.theme ? def.themes.find(x => x.id === c.theme) && { title: loc(def.themes.find(x => x.id === c.theme).title), art: ASSETS.cards[c.theme] } : null,
      character: c.character ? { title: loc(def.characters.find(x => x.id === c.character)?.title), art: ASSETS.cards[c.character], ownerName: state.chars[c.character]?.name } : null,
      pool: { reserve: c.pool.reserve, stones: Array.from({ length: c.pool.reserve }, (_, i) => i), A: c.pool.A, B: c.pool.B, stonesA: Array.from({ length: c.pool.A }, (_, i) => i), stonesB: Array.from({ length: c.pool.B }, (_, i) => i) },
      decisions: c.decisions.map(d => ({ n: d.n, note: d.note, to: d.favored === "none" ? t("UMU.Pool.NoOne") : nameOf(d.favored), marker: d.favored === "none" ? "" : nameOf(other(d.favored)) })),
      favorButtons: [...SEATS.map(s => ({ to: s, label: f("UMU.Pool.Favors", { name: nameOf(s) }), seat: seats[s] })), { to: "none", label: t("UMU.Pool.NoOne") }],
      climax: {
        plan: me ? { me: mePlan, rival: rivalPlan } : null, locked, ready,
        meReady: me ? ready[me] : false, rivalReady: me ? ready[other(me)] : false,
        extraMe: me ? c.extra[me] : 0, extraRival: me ? c.extra[other(me)] : 0, canMore: me ? mePlan.room > c.extra[me] : false, canLess: me ? c.extra[me] > 0 : false,
        consonance: c.consonance ? nameOf(c.consonance) : "", consonanceSeat: c.consonance, proposal,
        rows: SEATS.map(s => ({ seat: s, name: nameOf(s), seatView: seats[s], markers: c.pool[s], plan: plan[s], dice: c.dice[s], rolled: Boolean(c.dice[s]), sum: c.dice[s]?.reduce((a, b) => a + b, 0) ?? 0, mine: s === me, canRoll: locked && s === me && !c.dice[s], consonant: c.consonance === s }))
      },
      result: r && { tie: r.tie, winner: r.winner, winnerName: r.winner ? nameOf(r.winner) : "", totals: r.totals, narrator, narratorName: nameOf(narrator), canClose: me === narrator || (game.user.isGM && !me),
        gains: SEATS.map(s => ({ seat: s, name: nameOf(s), adv: r.advantages[s], hate: r.hate[s], scar: r.scars[s] })) },
      canSettle: isActive, mustWarn: c.pool.reserve > 0,
      deckLeft: state.virtues.deck.length
    };
  }

  #hate(state, def, me, tot, nameOf) {
    const rows = SEATS.map(s => {
      const h = state.hate[s];
      return {
        seat: s, name: nameOf(s), hate: tot[s].hate, scar: tot[s].scar, mode: h.mode, done: h.done, dice: h.dice, gained: h.gained, scars: h.scars, discarded: h.discarded, note: h.note,
        mine: s === me || (game.user.isGM && !me), canEscape: tot[s].hate > RULES.escapeAbove, willDiscard: Math.min(tot[s].scar, Math.floor(tot[s].hate / 2)),
        choosing: !h.mode && !h.done, rolling: h.mode === "surrender" && !h.done, none: tot[s].hate === 0
      };
    });
    return { rows, ideas: def.hateIdeas.map(loc), intensity: def.intensity.map(loc), threshold: RULES.escapeAbove };
  }

  #final(state, me, tot, nameOf) {
    const fin = state.final, att = fin.attacker, def = other(att);
    const plan = fin.stage === "roll" ? exchangePlan(state) : null;
    const amAtt = me === att, amDef = me === def, canAct = Boolean(me);
    const spendMax = s => Math.max(0, Math.min(RULES.maxSpend, s === att ? tot[s].adv - 1 : tot[s].adv));
    const last = fin.last;
    const mortal = fin.stage === "mortal" ? { round: fin.mortal.round, attacker: fin.mortal.attacker, attackerName: nameOf(fin.mortal.attacker), defenderName: nameOf(other(fin.mortal.attacker)), rolled: fin.mortal.dice, mineRolled: me ? Boolean(fin.mortal.dice[me]) : false } : null;
    const why = this.#whyAttacker(state, tot);
    const bothBet = fin.bets.A !== null && fin.bets.B !== null;
    return {
      stage: fin.stage, round: fin.round + 1, attacker: att, defender: def, attackerName: nameOf(att), defenderName: nameOf(def), why,
      amAtt, amDef, canAct, declaration: fin.declaration, response: fin.response,
      canDeclare: amAtt || (game.user.isGM && !me), canRespond: amDef || (game.user.isGM && !me),
      spend: { A: fin.spend.A, B: fin.spend.B, mineSet: me ? fin.spend[me] !== null : false, rivalSet: me ? fin.spend[other(me)] !== null : false, max: me ? spendMax(me) : 0, options: me ? Array.from({ length: spendMax(me) + 1 }, (_, i) => i) : [], cost: me ? (me === att ? 1 : 0) : 0 },
      plan, roll: { rows: SEATS.map(s => ({ seat: s, name: nameOf(s), role: s === att ? t("UMU.Final.Attacker") : t("UMU.Final.Defender"), n: plan?.[s] ?? 0, dice: fin.dice[s], rolled: Boolean(fin.dice[s]), mine: s === me, canRoll: s === me && !fin.dice[s] })) },
      bet: { mineSet: me ? fin.bets[me] !== null : false, rivalSet: me ? fin.bets[other(me)] !== null : false, max: me ? tot[me].adv : 0, revealed: bothBet || fin.stage === "resolved" },
      last: last && { attackerName: nameOf(last.attacker), best: last.best, tie: last.tie, winner: last.winner, winnerName: last.winner ? nameOf(last.winner) : "", bet: last.bet, dice: last.dice },
      canNarrate: last && (me === (last.winner ?? att) || (game.user.isGM && !me)), narratorName: last ? nameOf(last.winner ?? att) : "",
      mortal, canMortalRoll: mortal && me && !mortal.mineRolled,
      log: fin.log.slice(-6).reverse().map(l => l.mortal ? { mortal: true, round: l.mortal, name: nameOf(l.attacker), success: l.success } : { round: l.round + 1, attacker: nameOf(l.attacker), winner: l.winner ? nameOf(l.winner) : t("UMU.Climax.Tie"), declaration: l.declaration, response: l.response, text: l.text }),
      advA: tot.A.adv, advB: tot.B.adv
    };
  }
  #whyAttacker(state, tot) {
    const A = tot.A, B = tot.B, fin = state.final;
    if (fin.round > 0) return "";
    const first = fin.attacker;
    if (A.hate !== B.hate) return t("UMU.Final.WhyHate");
    if (A.adv !== B.adv) return t("UMU.Final.WhyAdv");
    if (A.scar !== B.scar) return t("UMU.Final.WhyScar");
    return first ? t("UMU.Final.WhyFirst") : "";
  }

  #epilogue(state, me, nameOf) {
    const e = state.epilogue, v = state.verdict, done = state.phase === "done";
    const labels = [t("UMU.Epilogue.Triumph"), t("UMU.Epilogue.Defeated"), t("UMU.Epilogue.Close")];
    return {
      done, steps: e.order.map((s, i) => ({ i, seat: s, name: nameOf(s), label: labels[i], text: e.texts[i]?.text ?? "", written: i < e.step, current: i === e.step && !done, mine: i === e.step && (s === me || (game.user.isGM && !me)) })),
      verdictText: v?.triumph ? f(v.dies ? "UMU.Verdict.Dies" : "UMU.Verdict.Defeated", { winner: nameOf(v.triumph), loser: nameOf(v.defeated) }) : t("UMU.Verdict.Draw")
    };
  }

  /* ---------------------------------------- */
  /*  Render y señales                        */
  /* ---------------------------------------- */

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;
    // los campos de perfil y opciones se guardan al salir de ellos
    for (const el of root.querySelectorAll("[data-profile]")) el.addEventListener("change", () => {
      GameService.dispatch({ type: "seat.profile", seat: el.dataset.seat, [el.dataset.profile]: el.value });
    });
    for (const el of root.querySelectorAll("[data-kamon-color]")) el.addEventListener("change", () => {
      const st = GameService.state(); GameService.dispatch({ type: "seat.profile", seat: el.dataset.seat, kamon: { shape: st.seats[el.dataset.seat].kamon.shape, color: el.value } });
    });
    for (const el of root.querySelectorAll("[data-option]")) el.addEventListener("change", () => {
      const v = el.dataset.option === "planned" ? Number(el.value) : el.value;
      GameService.dispatch({ type: "setup.options", [el.dataset.option]: v });
    });
    root.querySelector("[name=weather]")?.addEventListener("change", e => { if (game.user.isGM) GameService.dispatch({ type: "admin.weather", weather: e.target.value }); });
    if (!context.noGame) this.#cues(context.state);
  }

  /** Sonidos y atmósfera según lo que ha cambiado desde la última vez que se pintó. */
  #cues(state) {
    const prev = this.#shown; this.#shown = state;
    const ambient = state.phase === "final" || state.phase === "epilogue" ? "silence" : WEATHER_SOUND[state.weather] ?? "silence";
    SoundService.setAmbient(ambient);
    this.element.classList.toggle("umu-cine", state.phase === "final");
    if (!prev || prev.settingId !== state.settingId || prev.rev === state.rev) return;
    if (state.ledger.length > prev.ledger.length) {
      const fresh = state.ledger.slice(prev.ledger.length);
      if (fresh.some(e => e.kind === "hate" && e.n > 0)) SoundService.hate();
      if (fresh.some(e => e.kind === "scar" && e.n > 0)) SoundService.scar();
      if (fresh.some(e => e.kind === "adv" && e.n > 0)) SoundService.hanko();
    }
    if (state.chapter.pool.reserve < prev.chapter.pool.reserve) SoundService.stone();
    if (state.virtues.drawing && !prev.virtues.drawing) SoundService.card();
    if (state.phase !== prev.phase) { if (state.phase === "final") SoundService.taiko(); else SoundService.koto(state.phase === "epilogue" ? 4 : 2); }
    if (state.final.stage !== prev.final.stage) { if (state.final.stage === "mortal") SoundService.taiko(); if (state.final.stage === "resolved") SoundService.clash(); }
    const fa = totals(state), pa = totals(prev);
    if (state.phase === "final" && SEATS.some(s => fa[s].adv <= 1 && pa[s].adv > 1)) SoundService.heartbeat();
    if (state.between && !prev.between) SoundService.koto(2);
  }

  /* ---------------------------------------- */
  /*  Acciones                                */
  /* ---------------------------------------- */

  /** Acción sin datos adicionales; el asiento es el de este usuario. */
  static #send(type) {
    return function () {
      const seat = this.#seat();
      return GameService.dispatch({ type, seat });
    };
  }
  #seat() { const s = GameService.state(); return s ? this.#me(s) ?? (game.user.isGM ? s.chapter?.active || s.first : null) : null; }
  #field(name) { return val(this.element, name); }

  static #actAs(event, target) { this.#override = target.dataset.seat; this.render(); }
  static #claim(event, target) {
    const seat = target.dataset.seat;
    return GameService.dispatch({ type: "seat.claim", seat, userId: game.user.id, user: game.user.name });
  }
  static #leave(event, target) { return GameService.dispatch({ type: "seat.leave", seat: target.dataset.seat }); }
  static #kamon(event, target) {
    const st = GameService.state(), seat = target.dataset.seat;
    return GameService.dispatch({ type: "seat.profile", seat, kamon: { shape: target.dataset.shape, color: st.seats[seat].kamon.color } });
  }
  static async #declWrite() {
    const st = GameService.state(), seat = nextDeclarer(st), text = this.#field("decl");
    const action = { type: "decl.write", seat, text };
    if (st.decl.step === 0) action.weather = this.#field("declWeather");
    if (st.decl.step === 3) action.virtueId = this.element.querySelector("[name=declVirtue]:checked")?.value;
    SoundService.brush();
    await GameService.dispatch(action);
  }
  static #begin(event, target) { return GameService.dispatch({ type: "chapter.begin", seat: target.dataset.seat, force: game.user.isGM && !GameService.state().seats.A.userId }); }
  static #virtuePick(event, target) { return GameService.dispatch({ type: "virtue.pick", seat: this.#seat(), virtueId: target.dataset.id }); }
  static #themePick(event, target) { return GameService.dispatch({ type: "theme.pick", themeId: target.dataset.id, note: "" }); }
  static #charPick(event, target) { return GameService.dispatch({ type: "char.pick", characterId: target.dataset.id, name: this.#field("charName") }); }
  static #favor(event, target) {
    const note = this.#field("note"); SoundService.stone();
    return GameService.dispatch({ type: "pool.favor", toSeat: target.dataset.to, note });
  }
  static #extra(event, target) {
    const st = GameService.state(), seat = this.#seat();
    return GameService.dispatch({ type: "climax.extra", seat, n: st.chapter.extra[seat] + Number(target.dataset.delta) });
  }
  static #consPropose(event, target) { return GameService.dispatch({ type: "consonance.propose", seat: target.dataset.seat, by: this.#seat() }); }
  static #consClear() { return GameService.dispatch({ type: "consonance.propose", seat: null, by: this.#seat() }); }
  static #consAnswer(kind) { return function () { return GameService.dispatch({ type: `consonance.${kind}`, by: this.#seat() }); }; }
  static #ready() {
    const st = GameService.state(), seat = this.#seat();
    return GameService.dispatch({ type: "climax.ready", seat, ready: !st.chapter.ready[seat] });
  }
  static async #rollClimax() {
    const st = GameService.state(), seat = this.#seat();
    const dice = await rollDice(climaxPlan(st)[seat].dice);
    await GameService.dispatch({ type: "climax.roll", seat, dice });
  }
  static #closeChapter() { return GameService.dispatch({ type: "chapter.close", seat: this.#seat(), summary: this.#field("summary"), force: game.user.isGM && !this.#me(GameService.state()) }); }
  static #hateChoose(event, target) { return GameService.dispatch({ type: "hate.choose", seat: target.dataset.seat, mode: target.dataset.mode, note: val(this.element, `hateNote-${target.dataset.seat}`) }); }
  static async #hateRoll(event, target) {
    const seat = target.dataset.seat, n = totals(GameService.state())[seat].hate;
    const dice = await rollDice(n);
    await GameService.dispatch({ type: "hate.roll", seat, dice });
  }
  static #hateUndo(event, target) { return GameService.dispatch({ type: "hate.undo", seat: target.dataset.seat }); }
  static #hateIdea(event, target) {
    const area = this.element.querySelector(`[name="hateNote-${target.dataset.seat}"]`);
    if (area) { area.value = `${area.value}${area.value && !area.value.endsWith(" ") ? " " : ""}${target.dataset.idea}. `; area.focus(); }
  }
  static #finalWrite(event, target) {
    const kind = target.dataset.kind, seat = this.#seat();
    return GameService.dispatch({ type: kind === "declare" ? "final.declare" : "final.respond", seat: kind === "declare" ? GameService.state().final.attacker : other(GameService.state().final.attacker), text: this.#field(kind) });
  }
  static #spend(event, target) { return GameService.dispatch({ type: "final.spend", seat: this.#seat(), n: Number(target.dataset.n) }); }
  static async #rollExchange() {
    const st = GameService.state(), seat = this.#seat();
    const dice = await rollDice(exchangePlan(st)[seat]);
    SoundService.clash();
    await GameService.dispatch({ type: "final.roll", seat, dice });
  }
  static #bet() { return GameService.dispatch({ type: "final.bet", seat: this.#seat(), n: Number(this.#field("bet") || 0) }); }
  static #narrate() {
    const st = GameService.state(), last = st.final.last;
    return GameService.dispatch({ type: "final.narrate", seat: last.winner ?? st.final.attacker, text: this.#field("narration") });
  }
  static async #rollMortal() {
    const seat = this.#seat(), dice = await rollDice(1);
    await GameService.dispatch({ type: "final.mortalRoll", seat, dice });
  }
  static async #epilogueWrite() {
    const st = GameService.state(), seat = st.epilogue.order[st.epilogue.step];
    SoundService.brush();
    await GameService.dispatch({ type: "epilogue.write", seat, text: this.#field("epilogue") });
  }
  static #zoom(event, target) {
    const src = target.dataset.src; if (!src) return;
    import("../compat.mjs").then(({ ImagePopout }) => new ImagePopout({ src, window: { title: target.dataset.title ?? "" } }).render(true));
  }
  static async #newGame() {
    const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: t("UMU.Game.NewTitle") }, content: `<p>${t("UMU.Game.NewConfirm")}</p>` });
    if (ok) await GameService.reset({ keepSeats: true });
  }
  static #arbiterLedger() {
    const seat = this.#field("arbSeat"), kind = this.#field("arbKind"), n = Number(this.#field("arbN") || 0);
    return GameService.dispatch({ type: "admin.ledger", seat, kind, n, note: this.#field("arbNote") });
  }
  static #arbiterStep() { return GameService.dispatch({ type: "admin.step", step: Number(this.#field("arbStep")) }); }
  static #toggleFixes() { this.setSection("fixes", !this.sectionOpen("fixes", false)); this.render(); }
  static #fixLedger(event, target) {
    return GameService.dispatch({ type: "fix.ledger", seat: target.dataset.seat, kind: target.dataset.kind, delta: Number(target.dataset.delta), note: t("UMU.Fix.Note") });
  }
  static #fixPool(event, target) { return GameService.dispatch({ type: "fix.pool", seat: target.dataset.seat, delta: Number(target.dataset.delta) }); }
  static #fixTheme(event, target) { return GameService.dispatch({ type: "fix.theme", themeId: target.dataset.id, used: target.dataset.used === "true" }); }
  static #fixChar(event, target) { return GameService.dispatch({ type: "fix.char", characterId: target.dataset.id, owner: target.dataset.owner }); }
  static #fixVirtue(event, target) { return GameService.dispatch({ type: "fix.virtue", virtueId: target.dataset.id, where: target.dataset.where }); }
  static #fixPlanned(event, target) { return GameService.dispatch({ type: "fix.planned", n: GameService.state().planned + Number(target.dataset.delta) }); }
  static #arbiterForce() { return GameService.dispatch({ type: "admin.skipDeclarations" }); }
}
