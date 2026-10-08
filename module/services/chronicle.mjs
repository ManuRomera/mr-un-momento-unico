import { ASSETS } from "../constants.mjs";
import { GameService, loc } from "./game.mjs";
import { totals } from "../engine.mjs";
import { kamonSvg } from "../data/kamon.mjs";

const esc = v => foundry.utils.escapeHTML(String(v ?? ""));
const t = (k, d) => d ? game.i18n.format(k, d) : game.i18n.localize(k);
const para = text => text ? `<p class="umu-brush">${esc(text).replace(/\n/g, "<br>")}</p>` : "";

/**
 * Compone la Crónica: el rollo que cuenta toda la partida jugada. Devuelve `{ title, html, text }`.
 * Todo texto escrito por los jugadores se escapa; el HTML es seguro para insertarlo tal cual.
 */
export function buildChronicle(state = GameService.state()) {
  if (!state) return null;
  const def = GameService.settingDef(state.settingId);
  const name = s => state.seats[s].name || state.seats[s].user || `Samurái ${s}`;
  const virtue = id => def.virtues.find(v => v.id === id);
  const tot = totals(state);
  const title = t("UMU.Chronicle.Heading", { a: name("A"), b: name("B") });
  const out = [], text = [];
  const h = (tag, s) => { out.push(`<${tag}>${esc(s)}</${tag}>`); text.push(`\n${s}\n`); };
  const p = s => { if (!s) return; out.push(para(s)); text.push(s); };

  out.push(`<header class="umu-chron-head"><div class="umu-chron-kamon">${["A", "B"].map(s => kamonSvg(state.seats[s].kamon.shape, state.seats[s].kamon.color, 64, name(s))).join("")}</div><h1>${esc(title)}</h1><p class="umu-chron-sub">${esc(loc(def.name))} · ${esc(t("UMU.Chronicle.Chapters", { n: state.history.length }))}</p></header>`);
  text.push(title.toUpperCase(), `${loc(def.name)} · ${t("UMU.Chronicle.Chapters", { n: state.history.length })}`);

  h("h2", t("UMU.Chronicle.Scene"));
  for (const s of ["A", "B"]) p(t("UMU.Chronicle.Intro", { name: name(s), clan: state.seats[s].clan }));
  const keys = ["era", "place", "span"];
  keys.forEach((k, i) => p(`${t(`UMU.Decl.${k}`)} ${state.decl.lines[i]}`));
  const v0 = virtue(state.decl.virtueId);
  if (v0) { out.push(`<p class="umu-chron-virtue"><span class="umu-glyph">${esc(v0.glyph)}</span> ${esc(t("UMU.Decl.story"))} ${esc(v0.romaji)} · ${esc(loc(v0.name))}</p>`); text.push(`${t("UMU.Decl.story")} ${v0.romaji} · ${loc(v0.name)}`); }
  if (state.decl.lines[3]) p(state.decl.lines[3]);

  state.history.forEach(c => {
    const v = virtue(c.virtueId), th = def.themes.find(x => x.id === c.theme), ch = def.characters.find(x => x.id === c.character);
    h("h2", t("UMU.Chronicle.ChapterTitle", { n: c.n, name: name(c.active) }));
    out.push(`<p class="umu-chron-meta">${v ? `<span class="umu-glyph">${esc(v.glyph)}</span> ${esc(v.romaji)} · ${esc(loc(v.name))}` : ""}${th ? ` · ${esc(loc(th.title))}` : ""}${ch ? ` · ${esc(loc(ch.title))}${state.chars[c.character]?.name ? ` (${esc(state.chars[c.character].name)})` : ""}` : ""}</p>`);
    text.push([v && `${v.romaji} · ${loc(v.name)}`, th && loc(th.title), ch && loc(ch.title)].filter(Boolean).join(" · "));
    const notes = c.decisions.filter(d => d.note);
    if (notes.length) { out.push(`<ul class="umu-chron-notes">${notes.map(d => `<li>${esc(d.note)}</li>`).join("")}</ul>`); text.push(...notes.map(d => `· ${d.note}`)); }
    const r = c.result;
    if (r) {
      const line = r.winner ? t("UMU.Chronicle.Won", { name: name(r.winner), a: r.totals.A, b: r.totals.B }) : t("UMU.Chronicle.Tied", { a: r.totals.A, b: r.totals.B });
      out.push(`<p class="umu-chron-result ${r.winner ? `won-${r.winner}` : "tie"}"><i class="umu-hanko" aria-hidden="true">${r.winner ? esc(name(r.winner)[0]) : "—"}</i> ${esc(line)}</p>`); text.push(line);
    }
    p(c.summary);
  });

  h("h2", t("UMU.Chronicle.HateTitle"));
  for (const s of ["A", "B"]) {
    const x = state.hate[s];
    if (!x.mode) continue;
    p(t(`UMU.Chronicle.Hate.${x.mode}`, { name: name(s), adv: x.gained, scar: x.scars, n: x.discarded }));
    p(x.note);
  }

  h("h2", t("UMU.Chronicle.Final"));
  p(t("UMU.Chronicle.Totals", { a: name("A"), aa: tot.A.adv, ah: tot.A.hate, as: tot.A.scar, b: name("B"), ba: tot.B.adv, bh: tot.B.hate, bs: tot.B.scar }));
  for (const l of state.final.log) {
    if (l.mortal) { p(t(l.success ? "UMU.Chronicle.MortalHit" : "UMU.Chronicle.MortalMiss", { name: name(l.attacker) })); continue; }
    p(`${name(l.attacker)}: ${l.declaration}`); p(l.response); p(l.text);
  }
  if (state.verdict) {
    const v = state.verdict;
    const line = v.triumph ? t(v.dies ? "UMU.Verdict.Dies" : "UMU.Verdict.Defeated", { winner: name(v.triumph), loser: name(v.defeated) }) : t("UMU.Verdict.Draw");
    out.push(`<p class="umu-chron-verdict">${esc(line)}</p>`); text.push(line);
  }

  if (state.epilogue.texts.length) {
    h("h2", t("UMU.Chronicle.Epilogue"));
    for (const e of state.epilogue.texts) { p(e.text); }
  }

  const credit = t("UMU.Chronicle.Credit");
  out.push(`<footer class="umu-chron-foot"><img src="${esc(ASSETS.logo)}" alt="" width="56" height="56"><p>${esc(credit)}</p></footer>`);
  text.push("\n— " + credit);
  return { title, html: out.join("\n"), text: text.join("\n").replace(/\n{3,}/g, "\n\n").trim() };
}
