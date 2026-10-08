# Instrucciones para la IA de imágenes · «Un momento único»

> **Para Manu:** pega **desde la línea `=== EMPIEZA ===` hasta `=== TERMINA ===`** en la IA generadora (ChatGPT con imágenes, Midjourney, etc.).
> Después ve escribiendo `siguiente` para cada lote. Al final, la IA o tú montáis el ZIP (hay dos vías, ver §7 del texto) y me lo pasas.
> **41 imágenes + 1 hoja de estilo, en 9 lotes** de 1 a 8 imágenes.

=== EMPIEZA ===

# ROLE

You are the illustrator and art director of a tabletop role-playing game called **"Un momento único"** ("A Single Moment"): a two-player storytelling game about two samurai, once like brothers, who now face each other in a final duel. The story is told in flashbacks. Tone: quiet, tense, melancholic, dignified. Honor, loyalty, betrayal, regret. **Never** gory, cartoonish, anime/manga, or video-game fantasy.

You will produce **41 images plus 1 style sheet**, in **9 batches**. Everything must look like it comes from **one book: one hand, one ink, one paper**. Consistency matters more than spectacle.

# HOW WE WORK (follow strictly)

1. Do **one batch at a time**. When a batch is done, list the filenames you produced and **stop**. Wait for me to write `next` before starting the following batch. If I write `redo <filename>`, regenerate only that image.
2. **Batch 0 comes first:** create the style sheet. **Use it as the style reference for every later image** (image reference / style reference / `--sref`, whatever your tool supports). If your tool allows a fixed seed, fix it and tell me the value.
3. Name every image **exactly** as specified, in lowercase, with `.png`. The filename (without extension) is a key that my software reads. **Never rename, translate, number differently or add words.**
4. Deliver each image at the requested size or larger. If your tool only offers fixed sizes, choose the closest aspect ratio and keep the motif inside a **safe margin of 8%** on every side (I will crop).
5. **No text anywhere**: no letters, kanji, numbers, captions, signatures, watermarks, logos, frames or borders. Seals (hanko) are allowed only as plain red squares/shapes **with no characters inside**.
6. If an image fails twice, deliver your best attempt with the suffix `_dudosa` (example `splat-03_dudosa.png`) and move on.
7. Before delivering each batch, check: no text, no frame, no strange hands, same style as the style sheet, only one red (vermilion), motif has room to breathe.

# STYLE ANCHOR (apply automatically to EVERY image; do not ask me to repeat it)

Traditional Japanese **sumi-e ink wash painting** (suibokuga) with expressive calligraphic brushwork, mixed with the stark graphic contrast of black-and-white ink comics. Black sumi ink on warm off-white **washi paper (#F2EDE1)** with visible paper fibres. Dry-brush texture, bleeding ink edges, splatters and drops, confident single-stroke gestures. **Generous negative space (ma)**: most of the picture is empty paper and the subject is a few decisive strokes. Tonal range: pure black, several diluted greys, paper white. **ONE accent colour only, in small amounts: vermilion red #B3202A** (like a hanko seal or a thin drop of red ink). No other colours. No gradients, no digital glow, no 3D, no photographic textures, no uniform-thickness outlines. Looks hand-painted and slightly imperfect.

# NEGATIVES (apply to EVERY image; put them in the negative-prompt field, or at the end as "avoid:")

text, letters, words, kanji, hiragana, numbers, captions, watermark, signature, logo, seal with characters, frame, border, ornamental frame, card border, manga, anime, chibi, cartoon, 3d render, cgi, video game, photograph, photorealistic, neon, oversaturated colours, gradient background, HDR, vector clip art, gore, blood spray, severed limbs, dead bodies, extra fingers, deformed hands, distorted face, modern objects, wrong sword anatomy, duplicate subjects, cropped subject, tilted horizon

# RULES BY IMAGE TYPE

| Type | Rule |
|---|---|
| **Card** (vertical 900×1275, ratio 5:7) | Motif in the **upper 60%**. The **lower 40% stays almost empty** (paper or very diluted ink): the game prints the card title there. No frame. |
| **Backdrop** (1920×1080, 16:9) | **The centre stays empty** (an oval covering ~60% of the width): game cards will sit there. Put the motif at the edges and corners. Soft contrast: it must not compete with the interface. |
| **Ink sprite** | **Pure black ink on pure white #FFFFFF.** No paper, no texture in the background, no shadow, no grey vignette. One element, centred, clean edges, not cropped. I convert the white into transparency. |

# BATCHES

## BATCH 0 · Style sheet (1 image)

| File | Size | Prompt |
|---|---|---|
| `style-ref.png` | 2048×2048 | `A style sheet on washi paper with three loose elements arranged with generous space between them: (1) a samurai seen from behind in a few bold brush strokes, with a kasa hat; (2) a handful of tall grass blades bending in the wind; (3) a single ink splatter with droplets and one small vermilion drop. It must define the whole look of the project.` |

## BATCH 1 · Brand (4 images)

| File | Size | Prompt |
|---|---|---|
| `cover.png` | 1920×1080 | `Wide cinematic composition: a lone samurai seen from behind, standing in falling snow at the far right third of the frame, one hand resting on the hilt of a sheathed sword, facing a distant torii gate half dissolved in mist at the left third. Very large empty paper space at the centre-top. Ink drops scattered over the snow. One small vermilion detail: a plain red square seal with no characters at the lower left.` |
| `logo.png` | 1024×1024 | `Square icon: a single bold ink brush circle (enso) open at the lower right, containing the silhouette of two crossed katana blades drawn with two decisive strokes. Black ink on off-white paper. Centred, wide margins. One small vermilion ink drop at the crossing point.` |
| `portrait-sumi.png` | 1024×1280 | `Vertical portrait silhouette: a samurai bust in three-quarter view from behind, wearing a kasa hat and a dark haori, rendered almost entirely in solid black ink with a few dry-brush edges, on empty paper. No face visible. Calm and dignified. Small ink splatters at the shoulder.` |
| `portrait-washi.png` | 1024×1280 | `Vertical portrait silhouette, the mirror counterpart of the previous one: a samurai bust in three-quarter view from behind, with a topknot and a light haori left almost entirely as empty paper, defined only by thin grey ink outlines and a few dark accents (hair, sash, sword guard), against a very dark charcoal ink-wash background (#17171A). No face visible. Calm and dignified.` |

## BATCH 2 · Table and scenes (5 images)

| File | Size | Prompt |
|---|---|---|
| `table.png` | 1920×1080 | `Top-down view of a dark lacquered wooden table, nearly black, with a subtle sheen. Only along the very edges: a few blades of dry grass, a small ink stone (suzuri) with ink, a brush on a rest, a scatter of white and black smooth stones. The whole CENTRE is empty dark lacquer, a calm oval surface with faint wood grain, reserved for cards. Ink drops at the corners. Colours: black, charcoal, bone white of the stones. A hint of vermilion in a single ink drop.` |
| `scene.png` | 1920×1080 | `A wide grass clearing at dawn in sumi-e: tall pampas grass in the foreground strokes at the bottom, a lone old pine at the right, distant mountains as pale grey washes, empty paper sky. Quiet, waiting. Two tiny samurai figures far away at the centre horizon, facing each other across a long distance. Very large empty space.` |
| `final-bg.png` | 1920×1080 | `High-contrast black-and-white composition for a final duel: a huge ink enso circle in the sky like a moon, pure black wet ground, white snow-like specks, silhouettes of two tiny samurai at the lower left and lower right in a symmetrical stance, long swords drawn in thin dry strokes. The centre is empty. Brutal contrast, no grey gradients: only black, white and sparse grey wash.` |
| `epilogue-bg.png` | 1920×1080 | `Dawn after the battle: soft pale grey and cream washes, a single sword stuck upright in the ground in the lower-left third, a bare cherry branch crossing from the top-right corner with falling petals, a very distant figure walking away on the horizon. Gentle, sad, peaceful. Lots of empty paper.` |
| `chronicle-header.png` | 2400×700 | `Very wide horizontal strip in the style of a Japanese hand scroll (emakimono) landscape drawn in sumi-e, reading left to right: bamboo, a bridge, mist, a mountain, a river, snow, with long empty paper margins at both ends. Light and airy, very low contrast so text can sit on top.` |

## BATCH 3 · Weather, part 1 (4 images)

Common prompt for all weather backdrops: `Atmospheric backdrop in diluted sumi-e washes, very low contrast. The centre oval is completely empty and paper-toned; details only at the corners and edges. Do not draw any figure.` **Size 1920×1080 each.**

| File | Add to the common prompt |
|---|---|
| `weather-snow.png` | `Falling snow dots in white gouache over a pale grey wash, bare pine branches in the top corners, a few snow-covered rocks at the lower left and right.` |
| `weather-petals.png` | `Spring: a cherry-blossom branch in the upper-right corner dripping pale pink-grey petals (diluted vermilion at 15% as the only tint), petals drifting along the edges.` |
| `weather-summer.png` | `Summer: dense green-grey bamboo stalks along the left and right edges, a hazy sun as a pale disc, dragonflies as tiny strokes.` |
| `weather-leaves.png` | `Autumn: maple branches in the upper corners with leaves in diluted vermilion and ochre-grey, fallen leaves at the lower corners.` |

## BATCH 4 · Weather, part 2 (3 images)

Same common prompt as Batch 3. **Size 1920×1080 each.**

| File | Add to the common prompt |
|---|---|
| `weather-rain.png` | `Rain: fine diagonal dry-brush lines across the whole image, heavy ink-wash clouds at the top, a few bent reeds at the lower corners.` |
| `weather-fog.png` | `Fog: layered pale grey horizontal washes, the silhouettes of distant pines emerging at the left and right edges.` |
| `weather-dust.png` | `Dust storm over a barren landscape: ochre-grey horizontal drifts, a dry tree silhouette at one edge, scattered stones.` |

## BATCH 5 · Cards (6 images) · **900×1275, motif in the upper 60%, lower 40% almost empty**

| File | Prompt |
|---|---|
| `char-catalyst.png` | `Bamboo stalks with leaves painted in quick bold strokes, a dragonfly resting on a stalk, ink splatters around, a vermilion drop on the dragonfly's wing.` |
| `char-victim.png` | `A crane in flight with wings open, drawn in a few wet brush strokes, a splatter of ink where it was wounded, a single vermilion drop.` |
| `char-coveted.png` | `A lotus flower in full bloom with large leaves, soft grey washes in the petals, thin dark veins, the small stamen in vermilion.` |
| `theme-trust.png` | `Two koi swimming in a gentle circle, one black and one pale grey, wet ink bleeding, calm and harmonious.` |
| `theme-line.png` | `A single black koi leaping against the current through splashing ink waves, aggressive diagonal brush strokes, a vermilion drop at the mouth, tension.` |
| `theme-promise.png` | `A small koi at the bottom of a quiet pond, small ink dots as rising bubbles, ripple rings, delicate and still, a tiny vermilion dot at the eye.` |

## BATCH 6 · Ink splatters (8 images) · **1024×1024, black ink on pure white #FFFFFF**

Prompt for all: `A single black ink splatter on a pure white background, one main blot at the centre with satellite droplets. Pure black ink on #FFFFFF, no paper texture, no shadow.` Add the shape for each:

| File | Shape |
|---|---|
| `splat-01.png` | round with long streaks |
| `splat-02.png` | split in two |
| `splat-03.png` | with a long tail |
| `splat-04.png` | tiny speckles only |
| `splat-05.png` | dry-brush ragged edge |
| `splat-06.png` | ragged ring |
| `splat-07.png` | comet shape |
| `splat-08.png` | scattered mist of drops |

## BATCH 7 · Brush strokes and enso (6 images) · **black ink on pure white #FFFFFF**

| File | Size | Prompt |
|---|---|---|
| `stroke-01.png` | 1800×400 | `One horizontal calligraphic brush stroke across a pure white background, thick at the start, tapering into dry bristle marks at the end. Straight.` |
| `stroke-02.png` | 1800×400 | `Same kind of stroke, rising slightly to the right.` |
| `stroke-03.png` | 1800×400 | `Same kind of stroke, falling slightly to the right.` |
| `stroke-04.png` | 1800×400 | `A double stroke: two parallel strokes of different thickness.` |
| `stroke-05.png` | 1800×400 | `A broken stroke: three separate segments in a line, the last one dry.` |
| `enso.png` | 1024×1024 | `A single hand-painted Zen enso circle with a gap at the lower right, thick wet brush at the start and dry bristles at the end. Black ink on pure white #FFFFFF.` |

## BATCH 8 · Grass and bamboo (5 images) · **black ink on pure white #FFFFFF**

| File | Size | Prompt |
|---|---|---|
| `grass-01.png` | 1600×600 | `Tall grass blades painted in fast ink strokes, bending in the wind, rooted along the bottom edge and extending upward. Sparse density. Pure black on #FFFFFF.` |
| `grass-02.png` | 1600×600 | `Same, medium density.` |
| `grass-03.png` | 1600×600 | `Same, dense.` |
| `bamboo-01.png` | 600×1600 | `Two vertical bamboo stalks with joints and a few leaves, painted in ink, tall composition. Pure black on #FFFFFF.` |
| `bamboo-02.png` | 600×1600 | `A single vertical bamboo stalk with joints and three leaves, painted in ink, tall composition. Pure black on #FFFFFF.` |

# FINAL DELIVERY · THE ZIP

When I write `zip`, deliver **one file named `MR-UMU-Arte.zip`**.

**If you can run code or create files:** build the ZIP yourself with **exactly** this structure (one root folder `UMU-Arte/`), and include a `LEEME.txt` at the root with: the tool and model used, the seed (if any), the date, and the list of `_dudosa` images.

```
UMU-Arte/
├── LEEME.txt
├── style-ref.png
├── 01-marca/        cover.png, logo.png, portrait-sumi.png, portrait-washi.png
├── 02-mesa/         table.png, scene.png, final-bg.png, epilogue-bg.png, chronicle-header.png
├── 03-clima/        weather-snow.png, weather-petals.png, weather-summer.png, weather-leaves.png,
│                    weather-rain.png, weather-fog.png, weather-dust.png
├── 04-cartas/       char-catalyst.png, char-victim.png, char-coveted.png,
│                    theme-trust.png, theme-line.png, theme-promise.png
└── 05-tinta/        splat-01.png … splat-08.png, stroke-01.png … stroke-05.png, enso.png,
                     grass-01.png … grass-03.png, bamboo-01.png, bamboo-02.png
```

**If you cannot create a ZIP:** give me every image as a separate download with its exact filename, and tell me "ready to be sorted by script". I will sort them myself.

=== TERMINA ===

---

## Para Manu · si la IA no puede crear el ZIP

Deja **todas las imágenes sueltas en una sola carpeta** (por ejemplo `~/Downloads/umu-sueltas/`, con los nombres exactos) y ejecuta esto. Crea `MR-UMU-Arte.zip` con la estructura correcta y te avisa de lo que falte o sobre:

```bash
python3 - <<'PY'
import zipfile, sys
from pathlib import Path
SRC = Path.home() / "Downloads" / "umu-sueltas"
OUT = Path.home() / "Downloads" / "MR-UMU-Arte.zip"
MAP = {
 "01-marca": ["cover","logo","portrait-sumi","portrait-washi"],
 "02-mesa": ["table","scene","final-bg","epilogue-bg","chronicle-header"],
 "03-clima": [f"weather-{k}" for k in ["snow","petals","summer","leaves","rain","fog","dust"]],
 "04-cartas": ["char-catalyst","char-victim","char-coveted","theme-trust","theme-line","theme-promise"],
 "05-tinta": [f"splat-0{i}" for i in range(1,9)] + [f"stroke-0{i}" for i in range(1,6)] + ["enso","grass-01","grass-02","grass-03","bamboo-01","bamboo-02"],
}
files = {p.stem.lower(): p for p in SRC.iterdir() if p.suffix.lower() in {".png",".jpg",".jpeg",".webp"}}
used, missing = set(), []
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    if "style-ref" in files: z.write(files["style-ref"], f"UMU-Arte/style-ref{files['style-ref'].suffix.lower()}"); used.add("style-ref")
    for folder, keys in MAP.items():
        for k in keys:
            p = files.get(k) or files.get(k + "_dudosa")
            if p: z.write(p, f"UMU-Arte/{folder}/{p.stem.lower()}{p.suffix.lower()}"); used.add(p.stem.lower())
            else: missing.append(k)
    if (SRC / "LEEME.txt").exists(): z.write(SRC / "LEEME.txt", "UMU-Arte/LEEME.txt")
extra = sorted(set(files) - used)
print(f"ZIP: {OUT}\nIncluidas: {len(used)}  ·  Faltan: {missing or 'ninguna'}  ·  Sobran: {extra or 'ninguna'}")
PY
```
