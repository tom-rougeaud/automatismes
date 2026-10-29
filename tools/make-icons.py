"""Fabrique les icônes PNG (192, 512, maskable) à partir d'un SVG, avec Chromium (Playwright)."""
import os
from playwright.sync_api import sync_playwright
ROOT = os.path.join(os.path.dirname(__file__), '..')
def svg(maskable):
    pad = 0 if maskable else 0
    r = 0 if maskable else 112
    inner = 'transform="translate(96 80) scale(5.2)"' if maskable else 'transform="translate(64 48) scale(5.8)"'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B4CF0"/><stop offset=".55" stop-color="#7C4DFF"/><stop offset="1" stop-color="#E64980"/></linearGradient></defs>
<rect width="512" height="512" rx="{r}" fill="url(#g)"/>
<g {inner}><rect x="14" y="8" width="36" height="48" rx="6" fill="#fff"/><rect x="20" y="16" width="16" height="4" rx="2" fill="#5B4CF0"/><rect x="20" y="25" width="24" height="3.5" rx="1.7" fill="#FFB020"/><rect x="20" y="33" width="24" height="3.5" rx="1.7" fill="#12B886"/><rect x="20" y="41" width="14" height="3.5" rx="1.7" fill="#E64980"/><path d="M47 30 40 44h5l-2 10 9-15h-5z" fill="#FF5A5F" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></g></svg>'''
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, size, mask in (('icon-512.png', 512, False), ('icon-192.png', 192, False), ('icon-maskable-512.png', 512, True)):
        pg = b.new_page(viewport={'width': size, 'height': size})
        pg.set_content(f'<body style="margin:0;background:transparent">{svg(mask).replace("width=\"512\" height=\"512\"", f"width=\"{size}\" height=\"{size}\"")}</body>')
        pg.screenshot(path=os.path.join(ROOT, name), omit_background=True)
    b.close()
print('icônes ok')
