#!/usr/bin/env python3
"""Generate Chrome extension icon assets from the master source logo.

Crops the generated source artwork to a centered square, then produces the
resized PNG icons required by manifest.json (16/32/48/128 px) as well as a
larger 512x512 logo used in documentation.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "source" / "logo-source.png"
ICONS_DIR = ROOT / "public" / "icons"
DOCS_ASSETS_DIR = ROOT / "docs" / "assets"

ICON_SIZES = [16, 32, 48, 128]
LOGO_SIZE = 512


def center_square_crop(img: Image.Image) -> Image.Image:
    width, height = img.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return img.crop((left, top, left + side, top + side))


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Source logo not found: {SOURCE}")

    ICONS_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    original = Image.open(SOURCE).convert("RGBA")
    square = center_square_crop(original)

    for size in ICON_SIZES:
        resized = square.resize((size, size), Image.LANCZOS)
        out_path = ICONS_DIR / f"icon{size}.png"
        resized.save(out_path)
        print(f"Wrote {out_path}")

    logo = square.resize((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS)
    logo_path = DOCS_ASSETS_DIR / "logo.png"
    logo.save(logo_path)
    print(f"Wrote {logo_path}")


if __name__ == "__main__":
    main()
