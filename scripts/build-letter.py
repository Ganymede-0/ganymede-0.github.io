"""
Render the recommendation letter to the two images the site shows.

    python scripts/build-letter.py "docs/Letter of Recommendation ... .pdf"

Needs PyMuPDF (`pip install pymupdf`). It is a one-off, run on a developer
machine, so it is not a project dependency.

WHY THE PDF NEVER SHIPS
The letter is a private document and its PDF is gitignored. What the site shows
is a raster of it, with one thing removed: the author's email address. That is
a third party's contact detail, and it is not ours to publish.

HOW THE REDACTION WORKS, AND WHY IT CAN BE TRUSTED
The address is found in the PDF's own text layer — by PATTERN, so this file
never has to contain the address it hides — and removed with a true redaction:
MuPDF deletes the glyphs and any image pixels under the area from the page
content itself, then fills the space with the paper colour. Only then is the
page rasterised. There is no rectangle drawn over surviving text, and no text
layer in the output at all: the images are pixels, and the pixels that were the
address no longer exist.

The script refuses to write anything if it cannot find an address to remove,
so a changed or re-exported PDF cannot silently publish one.

OUTPUTS (public/media/leap/)
    letter-full.webp   300 dpi, for the in-site reader, where it is zoomed
    letter.webp        preview for the card in the Experience panel
"""

import re
import sys
from pathlib import Path

import pymupdf  # PyMuPDF
from PIL import Image

OUT_DIR = Path(__file__).resolve().parent.parent / "public" / "media" / "leap"

# 300 dpi. A4 is 595 pt wide, so this is 2480 px: sharp at the reader's highest
# zoom on a 2x display, and still well under a megabyte as WebP.
FULL_DPI = 300
PREVIEW_WIDTH = 960

EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

# How far past the glyph boxes the redaction reaches, in points. Enough to take
# anti-aliased edge pixels with it; not enough to touch the line above.
PAD = 1.5


def main(pdf_path: str) -> None:
    doc = pymupdf.open(pdf_path)
    if len(doc) != 1:
        sys.exit(f"expected a one-page letter, found {len(doc)} pages")
    page = doc[0]

    # Words carry their own boxes, so an address split into several spans still
    # comes back as one word with one rectangle.
    hits = [
        pymupdf.Rect(w[:4]) + (-PAD, -PAD, PAD, PAD)
        for w in page.get_text("words")
        if EMAIL.search(w[4])
    ]
    if not hits:
        sys.exit("no email address found to redact — refusing to render")

    for rect in hits:
        page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions()

    # Belt and braces: after redaction there must be nothing email-shaped left.
    if EMAIL.search(page.get_text()):
        sys.exit("an email address survived redaction — refusing to render")

    pix = page.get_pixmap(dpi=FULL_DPI, alpha=False)
    full = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Quality 86 keeps the serif hairlines clean when zoomed; `method=6` is the
    # slowest, smallest encoder setting, which costs nothing for a one-off.
    full.save(OUT_DIR / "letter-full.webp", "WEBP", quality=86, method=6)

    height = round(full.height * PREVIEW_WIDTH / full.width)
    full.resize((PREVIEW_WIDTH, height), Image.LANCZOS).save(
        OUT_DIR / "letter.webp", "WEBP", quality=84, method=6
    )

    print(f"redacted {len(hits)} address(es)")
    print(f"letter-full.webp  {full.width}x{full.height}")
    print(f"letter.webp       {PREVIEW_WIDTH}x{height}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
