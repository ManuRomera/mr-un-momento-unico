# Biblia de arte · MR · Un momento único

Documento para dárselo a **otra IA generadora de imágenes** (o a un ilustrador). Es autocontenido: no hace falta que conozca el juego ni el sistema.
Cuando tengas las imágenes, las metes en un ZIP con la estructura de la sección 2 y me lo pasas. Yo las recorto, convierto a WebP y las coloco con `scripts/import-art.py`.

> **Lo que NO hay que generar** (lo hago yo por código, para que quede perfecto y nítido): los kanji de las virtudes del Bushido, los reversos de las cartas (patrones de olas, estrellas y rombos), el papel washi, los sellos hanko, los emblemas de clan, las piedras, los dados, los contadores y los marcos.
> **Ninguna imagen debe llevar texto, letras, números, marcos, bordes ni firmas.** El texto lo pinta el sistema por encima.

---

## 1. Prompt para la IA (copia y pega desde aquí)

### 1.1 Rol y encargo

```
You are the art director and illustrator for a tabletop role-playing game system called "Un momento único"
(English: "A Single Moment"), a two-player storytelling game about two samurai who were once friends and
now face each other in a final duel. The game is told in flashbacks. The mood is quiet, tense, melancholic and
dignified: honor, loyalty, betrayal, regret. It is NEVER gory, never cartoonish, never "anime", never
video-game fantasy.

I will ask you for a list of images, one by one or in batches. Every image must look like it comes from the
SAME book: one hand, one ink, one paper. Consistency is more important than spectacle.
```

### 1.2 Estilo base (anteponer a cada imagen del lote «Bushido»)

```
BUSHIDO STYLE ANCHOR:
Traditional Japanese sumi-e ink wash painting (suibokuga) with expressive calligraphic brushwork, mixed with
the stark graphic contrast of black-and-white ink comics. Black sumi ink on warm off-white washi paper
(#F2EDE1) with visible paper fibres. Dry-brush texture, bleeding ink edges, splatters and drops of ink,
confident single-stroke gestures. Generous negative space (ma): most of the picture is empty paper and the
subject is a few decisive strokes. Tonal range: pure black, several diluted greys, paper white. ONE accent
colour allowed in small amounts only: vermilion red #B3202A (like a hanko seal or a thin drop of blood-red
ink). No other colours. No gradients, no digital glow, no 3D, no photographic textures, no outlines of
uniform thickness. Looks hand-painted and slightly imperfect.
```

### 1.3 Negativos (para todas, en el campo *negative prompt* o al final del prompt)

```
text, letters, words, kanji, hiragana, numbers, captions, watermark, signature, logo, seal with text,
frame, border, ornamental frame, card border, manga, anime, chibi, cartoon, 3d render, cgi, video game,
photograph, photorealistic, neon, oversaturated colours, gradient background, HDR, vector clip art,
gore, blood spray, severed limbs, dead bodies, extra fingers, deformed hands, distorted face, modern
objects, katana with wrong anatomy, duplicate subjects, cropped subject, tilted horizon
```

### 1.4 Flujo de trabajo que te pido

1. **Primero** genera una hoja de referencia de estilo (`style-ref.png`, 2048×2048): una composición con tres elementos sueltos (un samurái de espaldas, un puñado de hierba alta, una salpicadura de tinta) que fije el estilo. **Reutilízala como imagen de referencia** en todas las siguientes (image-to-image / style reference / `--sref` según la herramienta).
2. Genera por lotes según las secciones 3, 4 y 5. Un lote = una carpeta.
3. **Fija semilla o seed** cuando la herramienta lo permita y apúntala en `LEEME.txt`.
4. Cada imagen se entrega **a resolución completa** (mínimos en las tablas). Es mejor demasiado grande que pequeña.
5. **Antes de entregar cada lote, revisa:** sin texto ni símbolos legibles, sin marcos, sin manos raras, mismo estilo que `style-ref.png`, un solo rojo (bermellón), margen respirado alrededor del motivo.
6. Si una imagen falla dos veces, entrégala igualmente con el sufijo `_dudosa` (ejemplo `back_dudosa.png`) y sigue; la repasamos después.

### 1.5 Reglas por tipo de imagen

| Tipo | Regla |
|---|---|
| **Carta** (900×1275, vertical) | El motivo ocupa el **60 % superior**. El **40 % inferior queda casi vacío** (papel o tinta muy diluida): ahí va el título de la carta. Sin marco. |
| **Fondo de pantalla** (1920×1080) | **El centro queda libre** (un óvalo de ~60 % del ancho): ahí van las cartas. Motivo en los bordes y esquinas. Contraste suave: no debe competir con la interfaz. |
| **Sprite de tinta** (fondo blanco) | **Tinta negra sobre blanco puro `#FFFFFF`**, sin papel, sin textura de fondo, sin sombra. Yo convierto el blanco en transparencia. Un solo elemento centrado, bordes limpios, sin recorte. |
| **Emblema de virtud** (800×800, 1:1) | Un motivo único, centrado, sobre el papel; **margen del 15 %** a cada lado; sin escena de fondo; legible a 120 px. |

---

## 2. Estructura del ZIP que me devuelves

Un único ZIP llamado **`MR-UMU-Arte.zip`**. Dentro, **una sola carpeta raíz** `UMU-Arte/` con estas subcarpetas. **El nombre de cada archivo (sin extensión) es la «clave»**: la reconozco por ahí, no por la carpeta, así que no cambies ningún nombre. Formato preferido **PNG**; también acepto JPG o WebP.

```
UMU-Arte/
├── LEEME.txt                      ← herramienta usada, semilla, fecha, notas y lista de imágenes dudosas
├── style-ref.png                  ← la hoja de referencia de estilo (sección 1.4)
│
├── 01-marca/
│   ├── cover.png                  ← 1920×1080
│   ├── logo.png                   ← 1024×1024
│   ├── portrait-sumi.png          ← 1024×1280
│   └── portrait-washi.png         ← 1024×1280
│
├── 02-mesa/
│   ├── table.png                  ← 1920×1080
│   ├── scene.png                  ← 1920×1080
│   ├── final-bg.png               ← 1920×1080
│   ├── epilogue-bg.png            ← 1920×1080
│   └── chronicle-header.png       ← 2400×700
│
├── 03-clima/
│   ├── weather-snow.png           ← 1920×1080 (todos)
│   ├── weather-petals.png
│   ├── weather-summer.png
│   ├── weather-leaves.png
│   ├── weather-rain.png
│   ├── weather-fog.png
│   └── weather-dust.png
│
├── 04-cartas/
│   ├── char-catalyst.png          ← 900×1275 (todas)
│   ├── char-victim.png
│   ├── char-coveted.png
│   ├── theme-trust.png
│   ├── theme-line.png
│   └── theme-promise.png
│
└── 05-tinta/                      ← fondo BLANCO puro (sección 1.5)
    ├── splat-01.png … splat-08.png      ← 1024×1024
    ├── stroke-01.png … stroke-05.png    ← 1800×400
    ├── enso.png                          ← 1024×1024
    ├── grass-01.png … grass-03.png       ← 1600×600
    └── bamboo-01.png … bamboo-02.png     ← 600×1600
```

- Si entregas por fases, haz un ZIP por fase con **la misma estructura** (solo las carpetas que toquen): los fusiono.
- **Alcance de este encargo: solo Bushido.** Total: **41 imágenes** más `style-ref.png` y `LEEME.txt`.

---

## 3. Lote A · Bushido (carpetas 01 a 05)

Todos los prompts van **después** del *BUSHIDO STYLE ANCHOR* (§1.2) y con los negativos (§1.3).

### 3.1 `01-marca`

| Clave | Prompt |
|---|---|
| `cover` | `Wide cinematic composition: a lone samurai seen from behind, standing in falling snow at the far right third of the frame, one hand resting on the hilt of a sheathed sword, facing a distant torii gate half dissolved in mist at the left third. Very large empty paper space in the centre-top. Ink drops scattered across the snow. A single small vermilion detail: a hanko-like red square stamp (no characters inside) at the lower left.` |
| `logo` | `Square icon: a single bold ink brush circle (enso) open at the lower right, containing the silhouette of two crossed katana blades drawn with two decisive strokes. Black ink on off-white paper. Centred, wide margins. One small vermilion ink drop at the crossing point.` |
| `portrait-sumi` | `Vertical portrait silhouette: a samurai bust seen in three-quarter profile from behind, wearing a kasa hat and dark haori, rendered almost entirely in solid black ink with a few dry-brush edges, on empty paper. No face visible. Calm, dignified. Small ink splatters at the shoulder.` |
| `portrait-washi` | `Vertical portrait silhouette, the mirror counterpart of the previous one: a samurai bust in three-quarter profile, wearing a topknot and a light haori left almost entirely as empty paper, defined only by thin grey ink outlines and a few dark accents (hair, sash, sword guard), against a very dark charcoal-grey ink wash background (#17171A). Calm, dignified. No face visible.` |

### 3.2 `02-mesa`

| Clave | Prompt |
|---|---|
| `table` | `Top-down view of a dark lacquered wooden table, nearly black, with a subtle sheen. Along the very edges only: a few blades of dry grass, a small ink stone (suzuri) with ink, a brush on a rest, a scatter of white and black smooth stones. The whole CENTRE of the image is empty dark lacquer, a calm oval surface with faint grain, reserved for cards. Ink drops at the corners. Colours: black, charcoal, bone white of the stones. Hint of vermilion in a single ink drop.` |
| `scene` | `A wide grass clearing at dawn drawn in sumi-e: tall pampas grass in the foreground strokes at the bottom, a lone old pine at the right, distant mountains as pale grey washes, empty sky of paper. Quiet and waiting. Two tiny samurai figures far away at the centre horizon, facing each other, separated by a long distance. Very large empty space.` |
| `final-bg` | `High-contrast black-and-white composition for a final duel: a huge ink enso circle in the sky like a moon, pure black wet ground, white snow-like specks, silhouettes of two samurai tiny at the lower left and lower right in a symmetrical stance, long swords drawn in thin dry strokes. Empty centre. Brutal contrast, no grey gradients, only black, white and sparse grey wash.` |
| `epilogue-bg` | `Dawn after the battle: soft pale grey and cream washes, a single sword stuck upright in the ground at the left lower third, bare cherry branch crossing from the top right corner with falling petals, a very distant figure walking away on the horizon. Gentle, sad, peaceful. Lots of empty paper.` |
| `chronicle-header` | `Very wide horizontal strip: a long hand-scroll (emakimono) style landscape drawn in sumi-e, reading left to right: bamboo, a bridge, mist, a mountain, a river, snow, with long empty paper margins on both ends. Light and airy, very low contrast so text can sit on it.` |

### 3.3 `03-clima` (fondos suaves, centro libre, bajo contraste)

Prompt común: `Atmospheric backdrop in diluted sumi-e washes, very low contrast, the centre oval is completely empty paper-toned, details only in the corners and edges. Do not draw any figure.`

| Clave | Añadir |
|---|---|
| `weather-snow` | `Falling snow dots made with white gouache over pale grey wash, bare pine branches in the top corners, a few snow-covered rocks lower left and right.` |
| `weather-petals` | `Spring: cherry blossom branch in the upper right corner dripping pale pink-grey petals (use diluted vermilion at 15% as the only tint), petals drifting across the edges.` |
| `weather-summer` | `Summer: dense green-grey bamboo stalks along the left and right edges, hazy sun as a pale disc, dragonflies as tiny strokes.` |
| `weather-leaves` | `Autumn: maple branches in the upper corners with leaves in diluted vermilion and ochre-grey, fallen leaves at the bottom corners.` |
| `weather-rain` | `Rain: diagonal fine dry-brush lines across the whole image, ink wash clouds heavy at the top, a few reeds bent at the bottom corners.` |
| `weather-fog` | `Fog: layered pale grey horizontal washes, the silhouettes of distant pines emerging at the left and right edges.` |
| `weather-dust` | `Dust storm in a barren landscape: ochre-grey horizontal drifts, a dry tree silhouette at the edge, scattered stones.` |

### 3.4 `04-cartas` (900×1275, motivo arriba, 40 % inferior vacío)

| Clave | Prompt |
|---|---|
| `char-catalyst` | `Bamboo stalks with leaves painted in quick bold strokes, a dragonfly resting on a stalk, ink splatters around, vermilion drop on the dragonfly's wing. Motif in the upper 60%, lower 40% almost empty.` |
| `char-victim` | `A crane in flight with wings open, drawn in a few wet brush strokes, a splatter of ink where it was wounded, a single vermilion drop. Upper 60% motif, lower 40% empty paper.` |
| `char-coveted` | `A lotus flower in full bloom with large leaves, soft grey washes in the petals, thin dark veins, small stamen in vermilion. Upper 60%, lower 40% empty.` |
| `theme-trust` | `Two koi fish swimming in a gentle circle, one black and one pale grey, wet ink bleeding, calm, harmonious. Upper 60%, lower 40% empty.` |
| `theme-line` | `A single black koi leaping against the current through splashing ink waves, aggressive diagonal brush strokes, a vermilion drop at the mouth, tension. Upper 60%, lower 40% empty.` |
| `theme-promise` | `A small koi at the bottom of a quiet pond, small dots of ink as bubbles rising, ripple rings, delicate and still, a tiny vermilion dot at the eye. Upper 60%, lower 40% empty.` |

### 3.5 `05-tinta` (tinta negra sobre blanco puro)

| Clave | Prompt |
|---|---|
| `splat-01` … `splat-08` | `A single black ink splatter on pure white background, one centred main blot with satellite droplets, different shape in each of the eight: round with long streaks, split in two, with a tail, tiny speckles, dry-brush edge, ragged ring, comet shape, scattered mist. Pure black ink on #FFFFFF, no paper texture, no shadow.` |
| `stroke-01` … `stroke-05` | `One horizontal calligraphic brush stroke across a pure white background, thick at the start, tapering to dry bristle marks at the end, slight curve. Variations: straight, rising, falling, double-stroke, broken stroke. Black ink on #FFFFFF.` |
| `enso` | `A single hand-painted Zen enso circle with a gap at the lower right, thick wet brush at the start and dry bristles at the end, black ink on pure white #FFFFFF.` |
| `grass-01` … `grass-03` | `Tall grass blades painted in fast ink strokes, bending in the wind, rooted along the bottom edge of the frame, extending upward, pure black on #FFFFFF, three different densities: sparse, medium, dense.` |
| `bamboo-01`, `bamboo-02` | `Two vertical bamboo stalks with joints and a few leaves, painted in ink, pure black on #FFFFFF, tall composition.` |

---

## 4. Lote B · Otras ambientaciones — **APARCADO, no generar ahora**

> Se pedirá más adelante, cuando se desarrollen como módulos aparte. Se conserva como borrador (carpeta futura `06-ambientaciones/`).

Cada ambientación es la **misma historia de dos rivales** contada en otro género. Cada una tiene su propio *style anchor*. Cada una entrega: `cover`, `table`, `scene` (16:9, 1920×1080) y siete `virtue-N` (800×800).

Para cada imagen, antepone el *style anchor* de su ambientación y añade los negativos de §1.3 (quita de ellos `photograph`/`vector clip art` si el estilo lo necesita).

### 4.1 `west` · Salvaje Oeste

**Style anchor**
```
WESTERN STYLE ANCHOR:
Nineteenth-century wood-type poster and woodcut illustration, sepia and black ink on aged cream paper (#E8DDC4),
hand-engraved cross-hatching, rough print texture, paper stains and burnt corners, dust. Single accent colour:
rust red #A33B20 used sparingly. Strong shapes, low horizon, huge sky. Gritty, dry, sun-baked and silent.
```
| Clave | Prompt |
|---|---|
| `west-cover` | `A sheriff and an outlaw standing apart on a dusty main street at high noon, long shadows, empty saloon fronts, a lone tumbleweed. Huge sky.` |
| `west-table` | `Top-down view of a worn wooden saloon table: scratched wood, a whiskey glass ring, a deck of loose cards at the corners, a revolver at the edge. Centre empty.` |
| `west-scene` | `Dry desert canyon at dusk, a lone horse rider far away, a wooden cross marker, rock arch, large empty sky.` |
| `west-virtue-1` | `Respeto: a cowboy hat held to the chest by a hand, centred.` |
| `west-virtue-2` | `Peligro: a coiled rattlesnake ready to strike.` |
| `west-virtue-3` | `Salvaje: a lone cactus beyond a broken wooden fence, wild open land.` |
| `west-virtue-4` | `Puntería: a revolver with a bullet and a tin can on a post, targeting.` |
| `west-virtue-5` | `Suerte: an ace of spades with a pair of dice.` |
| `west-virtue-6` | `Sin miedo: an empty street with a lone silhouette stepping forward, centred.` |
| `west-virtue-7` | `Explosiones: a bundle of dynamite sticks with a lit fuse.` |

### 4.2 `knight` · Destino de caballero

**Style anchor**
```
MEDIEVAL STYLE ANCHOR:
Medieval illuminated manuscript and woodblock print, black ink linework with flat gold-leaf accents (#C9A35C)
on aged parchment (#EADFC2), flat perspective, heavy outlines, tapestry-like pattern fills, a deep blue
(#2D3D58) accent used sparingly. Solemn, ceremonial, heraldic. No text in the image.
```
| Clave | Prompt |
|---|---|
| `knight-cover` | `Two knights in full armour facing each other in a muddy field, banners hanging limp, castle on a distant hill, heraldic composition.` |
| `knight-table` | `Top-down view of a stone table with a parchment map, a chalice and a dagger at the edges, centre empty.` |
| `knight-scene` | `A cold dawn on a battlefield, banners and broken lances, a lone raven, empty sky.` |
| `knight-virtue-1` | `Justicia: a pair of scales balanced over a sword.` |
| `knight-virtue-2` | `Coraje: a lion's head on a shield.` |
| `knight-virtue-3` | `Generosidad: an open hand giving a loaf of bread.` |
| `knight-virtue-4` | `Piedad: a hand lowering a sword with a white dove.` |
| `knight-virtue-5` | `Modestia: a bowed head wearing a plain monastic hood.` |
| `knight-virtue-6` | `Templanza: a chalice and a pitcher pouring in balance.` |
| `knight-virtue-7` | `Fe: a lit candle in a cathedral window.` |

### 4.3 `pulp` · Acción trepidante pulp

**Style anchor**
```
PULP STYLE ANCHOR:
1930s pulp magazine cover illustration done as bold ink drawing with halftone dots, flat limited colour:
cream paper (#F1E5CC), black ink, brick red (#B3302A), teal (#2F6F73). Dramatic diagonals, heroic poses,
dynamic perspective, motion lines. Adventurous, over the top, a bit absurd but drawn with conviction.
```
| Clave | Prompt |
|---|---|
| `pulp-cover` | `A jetpack hero and a rival flying across a city skyline of art-deco towers, a zeppelin in the distance, dramatic diagonals.` |
| `pulp-table` | `Top-down view of a chart table with an old map, a compass, a revolver and a magnifier at the edges, centre empty.` |
| `pulp-scene` | `A jungle temple entrance with torches, vines, a vintage biplane parked at the left, huge sky.` |
| `pulp-virtue-1` | `Descubrimiento: a map and a compass pointing to an unknown ruin.` |
| `pulp-virtue-2` | `Orgullo: a gloved hand lifting a chin under a top hat.` |
| `pulp-virtue-3` | `Hospitalidad: an open door with a lit lamp and tea cups.` |
| `pulp-virtue-4` | `Traición: a dagger behind a back during a handshake.` |
| `pulp-virtue-5` | `Persecuciones suicidas: a speeding steam train and a biplane racing side by side.` |
| `pulp-virtue-6` | `Sacrificio: a burning artifact and an open hand releasing it.` |
| `pulp-virtue-7` | `Gánsteres: a tommy gun and a fedora silhouette.` |

### 4.4 `space` · Ópera espacial

**Style anchor**
```
SPACE OPERA STYLE ANCHOR:
Technical blueprint line art combined with inked retro sci-fi illustration, dark navy background (#0C1A2B),
cyan line work (#6FD3E0), warm white highlights, a small amber accent (#E3A34B). Crisp thin lines, grid
paper, starfields as dots, glowing lines done flat (no soft glow). Calm, vast, lonely.
```
| Clave | Prompt |
|---|---|
| `space-cover` | `Two spaceships on opposite sides of an alien planet with rings, tiny against the vastness, a star far behind.` |
| `space-table` | `Top-down holographic star-chart table with faint grid, constellations, a datapad at the edge, centre empty.` |
| `space-scene` | `The bridge of a starship seen from behind the captain's seat, a large window onto a nebula, empty centre.` |
| `space-virtue-1` | `Descubrimiento: an alien planet with a ringed sky.` |
| `space-virtue-2` | `Deber: a command insignia over a helmet with visor.` |
| `space-virtue-3` | `Galimatías: tangled circuitry and gears glitching.` |
| `space-virtue-4` | `Traición: two ships, one firing on the other.` |
| `space-virtue-5` | `Agujero negro: a black hole with an accretion disc.` |
| `space-virtue-6` | `Fe: a lone figure kneeling before a glowing orb.` |
| `space-virtue-7` | `Aislamiento: a lone astronaut drifting in the void.` |

### 4.5 `romcom` · ROMCOM

**Style anchor**
```
ROMCOM STYLE ANCHOR:
Loose ink linework with soft watercolour washes on white paper (#FBF7F2), warm pink (#E7A6A1) and soft
peach with a sprinkle of sky blue (#8FBFD9), expressive and playful drawing with delicate lines, small hearts
and petals drifting, charming, light, slightly nostalgic. Looks like a sketchbook of a hopeful romantic.
```
| Clave | Prompt |
|---|---|
| `romcom-cover` | `Two silhouettes under a shared umbrella in a rainy city street at dusk, warm window lights, petals floating.` |
| `romcom-table` | `Top-down view of a small café table with two cups, a letter and a flower at the edges, centre empty.` |
| `romcom-scene` | `A rooftop with string lights at night, a city skyline in washes, two chairs, empty centre.` |
| `romcom-virtue-1` | `A primera vista: two silhouettes across a crowded street, eyes meeting.` |
| `romcom-virtue-2` | `Amigos: a group of friends around a café table.` |
| `romcom-virtue-3` | `Diferencias: two umbrellas of different colours.` |
| `romcom-virtue-4` | `Descubrimiento secreto: a love letter half hidden in a pocket.` |
| `romcom-virtue-5` | `Confianza: two hands about to hold on a bridge.` |
| `romcom-virtue-6` | `Conflicto: a torn photograph and a cracked heart in the rain.` |
| `romcom-virtue-7` | `Reconocimiento: a person running through a crowd at an airport.` |

---

## 5. Cómo yo lo uso

- `scripts/import-art.py` recorre `art-inbox/` **recursivamente**, toma el nombre del archivo como clave, recorta al encuadre, reduce, convierte a WebP y lo coloca en `assets/`.
- Los sprites de tinta (carpeta `05-tinta`): convierto el blanco en transparencia (luminosidad → alfa) y los guardo con canal alfa.
- Las 7 virtudes del Bushido son kanji: las genero yo por código con una fuente de pincel (Yuji Boku), con el mismo filtro de tinta.

## 6. Atribución

El juego original es de Tobie Abad (texto CC BY 4.0). Este arte es **original y propio**: no uses ilustraciones del libro (de Daniel Jimbert) ni de The Hills Press como referencia visual directa.
