"""Build mirotalk/branding/logo.svg from the main website's logo.

MiroTalk shows ``images/logo.svg`` on its loading and login/waiting screens. An SVG
used as an <img> cannot load external files, so the site logo is embedded as a
data URI. docker-compose.yml mounts the result over MiroTalk's own logo.svg.

Re-run after changing web/public/assets/logo.webp:
    python3 mirotalk/branding/make_logo_svg.py
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "web" / "public" / "assets" / "logo.webp"
TARGET = Path(__file__).resolve().parent / "logo.svg"
SIZE = 458  # logo.webp is square, 458x458

data = base64.b64encode(SOURCE.read_bytes()).decode("ascii")
TARGET.write_text(
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE}" height="{SIZE}" viewBox="0 0 {SIZE} {SIZE}">'
    f'<image width="{SIZE}" height="{SIZE}" href="data:image/webp;base64,{data}"/></svg>\n'
)
print(f"wrote {TARGET.relative_to(ROOT)} ({TARGET.stat().st_size} bytes) from {SOURCE.relative_to(ROOT)}")
