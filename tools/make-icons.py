"""Fabrique les icônes PNG (192, 512, maskable) à partir d'un SVG, avec Chromium (Playwright)."""
import os
from playwright.sync_api import sync_playwright
ROOT = os.path.join(os.path.dirname(__file__), '..')
TILES = open(os.path.join(os.path.dirname(__file__), 'icon-tiles.txt'), encoding='utf8').read()
def svg(maskable):
    r = 0 if maskable else 112
    inner = 'transform="translate(96 96) scale(4.5)"' if maskable else 'transform="translate(48 48) scale(6.5)"'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B4C7E"/><stop offset="1" stop-color="#1F3A63"/></linearGradient></defs>
<rect width="512" height="512" rx="{r}" fill="url(#g)"/><g {inner}>{TILES}</g></svg>'''
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, size, mask in (('icon-512.png', 512, False), ('icon-192.png', 192, False), ('icon-180.png', 180, False), ('favicon-32.png', 32, False), ('favicon-48.png', 48, False), ('icon-maskable-512.png', 512, True)):
        pg = b.new_page(viewport={'width': size, 'height': size})
        pg.set_content(f'<body style="margin:0;background:transparent">{svg(mask).replace("width=\"512\" height=\"512\"", f"width=\"{size}\" height=\"{size}\"")}</body>')
        pg.screenshot(path=os.path.join(ROOT, name), omit_background=True)
    b.close()
print('icônes ok')
