"""Prepare site imagery: resize/compress photos to WebP and cut out portraits with rembg."""
import sys
from pathlib import Path
from PIL import Image, ImageOps

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "public" / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

# (source file, output name, optional crop box (l,t,r,b) on the original)
PHOTOS = [
    ("c5989931-image.jpg", "reading-calm", (0, 0, 736, 1110)),   # crops off third-party logo
    ("26999578-image.jpg", "mindful-prayer", None),
    ("5bc04bc8-image.jpg", "studio-stretch", None),
    ("df8618b4-image.jpg", "park-meditation", None),
    ("8cdae1d4-image.jpg", "listen-grey", None),
    ("a4e50af5-image.jpg", "listen-orange", None),
    ("078f695d-image.jpg", "listen-sky", None),
    ("bbab9ac4-image.jpg", "listen-yellow", None),
    ("90dfeffe-image.jpg", "listen-warm", None),
    ("ab0a9945-image.jpg", "window-rest", None),
    ("56256ca4-image.jpg", "poolside-calm", None),
]
CUTOUTS = ["listen-sky", "listen-warm", "listen-orange", "listen-grey", "listen-yellow"]

from rembg import remove, new_session
session = new_session("isnet-general-use")

for src, name, crop in PHOTOS:
    im = ImageOps.exif_transpose(Image.open(SRC / src)).convert("RGB")
    if crop:
        im = im.crop(crop)
    im.save(OUT / f"{name}.webp", "WEBP", quality=82, method=6)
    if name in CUTOUTS:
        cut = remove(im, session=session, post_process_mask=True)
        cut = cut.crop(cut.getbbox())
        cut.save(OUT / f"{name}-cutout.webp", "WEBP", quality=85, method=6)
    print("ok", name, im.size)
