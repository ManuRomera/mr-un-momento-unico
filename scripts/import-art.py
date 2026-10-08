#!/usr/bin/env python3
"""Importa el arte de MR-UMU-Arte.zip: recorre la carpeta de entrada de forma recursiva,
toma el nombre del archivo como clave, recorta al encuadre, reduce y guarda WebP en assets/art/.

Uso:  python3 scripts/import-art.py <carpeta-con-las-imagenes> [carpeta-de-salida]
Requiere Pillow con soporte WebP.

Carpetas de salida (por tipo): brand/ table/ weather/ cards/ ink/
- Fondos: 1920x1080 (la mesa se recorta unos píxeles para quitar las esquinas redondeadas).
- Cartas: 900x1275 (recorte centrado a la proporción).
- Sprites de tinta: el blanco pasa a transparencia (luminosidad -> alfa) con tolerancia, tinta negra
  y recorte al contenido.
"""
import sys
from pathlib import Path
from PIL import Image

TINTA_GRUPOS = ("splat", "stroke", "grass", "bamboo", "enso")


def crop_ratio(im, w, h):
    """Recorte centrado a la proporción w:h y reducción a w x h."""
    r = w / h
    iw, ih = im.size
    if iw / ih > r:
        nw = round(ih * r)
        im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
    else:
        nh = round(iw / r)
        im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
    return im.resize((w, h), Image.LANCZOS)


def tinta(im, max_side):
    """Tinta negra con alfa a partir de la luminosidad; el blanco (y casi blanco) queda transparente."""
    g = im.convert("L")
    # tolerancia: por encima de 235 es papel; entre 0 y 235 se estira a alfa 255..0
    alfa = g.point(lambda v: 0 if v >= 235 else round(255 * (235 - v) / 235))
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.putalpha(alfa)
    caja = alfa.point(lambda v: 255 if v > 12 else 0).getbbox()
    if caja:
        m = 12
        out = out.crop((max(0, caja[0] - m), max(0, caja[1] - m), min(out.width, caja[2] + m), min(out.height, caja[3] + m)))
    out.thumbnail((max_side, max_side), Image.LANCZOS)
    return out


def destino(clave, carpeta):
    if clave.startswith(TINTA_GRUPOS):
        return "ink"
    if clave.startswith("weather-"):
        return "weather"
    if clave.startswith(("char-", "theme-", "virtue-")):
        return "cards"
    if carpeta == "01-marca":
        return "brand"
    return "table"


def procesa(ruta):
    clave = ruta.stem
    im = Image.open(ruta)
    grupo = destino(clave, ruta.parent.name)
    q = 82
    if grupo == "ink":
        lado = 1600 if clave.startswith(("stroke", "grass")) else 1400 if clave.startswith("bamboo") else 1000
        out = tinta(im, lado)
        q = 90
    else:
        im = im.convert("RGB")
        if clave == "table":
            im = im.crop((24, 24, im.width - 24, im.height - 24))
        if clave == "chronicle-header":
            out = crop_ratio(im, 2400, 700)
        elif grupo == "cards":
            out = crop_ratio(im, 900, 1275)
        elif grupo == "weather" or clave in ("cover", "table", "scene", "final-bg", "epilogue-bg"):
            out = crop_ratio(im, 1920, 1080)
        elif clave == "logo":
            out = im.resize((768, 768), Image.LANCZOS)
        else:  # retratos
            out = im.resize((800, round(800 * im.height / im.width)), Image.LANCZOS)
    return clave, grupo, out, q


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    entrada = Path(sys.argv[1])
    salida = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "assets" / "art"
    n = 0
    for ruta in sorted(entrada.rglob("*.png")):
        if ruta.stem == "style-ref":
            continue
        clave, grupo, out, q = procesa(ruta)
        (salida / grupo).mkdir(parents=True, exist_ok=True)
        final = salida / grupo / f"{clave}.webp"
        out.save(final, "WEBP", quality=q, method=6)
        print(f"{grupo}/{clave}.webp  {out.width}x{out.height}  {final.stat().st_size // 1024} KB")
        n += 1
    print(f"{n} imágenes importadas en {salida}")


if __name__ == "__main__":
    main()
