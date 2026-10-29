"""Impression : remplit #printRoot via le bouton Imprimer (window.print simulé), puis génère le PDF vectoriel en média « print »."""
import os, json
from playwright.sync_api import sync_playwright
from pypdf import PdfReader
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SH = os.path.join(ROOT, 'tests', 'shots')
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1360, 'height': 900})
    pg.add_init_script("window.print = function(){ window.__printed = document.title; window.__np = document.querySelectorAll('#printRoot .page').length; };")
    pg.goto('file://' + os.path.join(ROOT, 'index.html')); pg.wait_for_selector('#chaps details')
    pg.set_input_files('#importFile', os.path.join(SH, 'qa-sheet.json')); pg.wait_for_selector('#pages .page'); pg.wait_for_timeout(600)
    pg.select_option('#sContent', 'both'); pg.click('#printBtn'); pg.wait_for_timeout(900)
    printed = pg.evaluate('window.__printed'); npages = pg.evaluate('window.__np')
    print('titre pendant impression :', printed, '| pages dans printRoot :', npages)
    pg.emulate_media(media='print'); out = os.path.join(SH, 'print.pdf'); pg.pdf(path=out, prefer_css_page_size=True, print_background=True)
    r = PdfReader(out); print('PDF vectoriel :', len(r.pages), 'pages', [round(float(x)) for x in r.pages[0].mediabox[2:]])
    txt = r.pages[0].extract_text()[:120].replace('\n', ' '); print('texte sélectionnable :', txt)
    assert len(r.pages) == npages, 'nombre de pages différent'
    b.close()
print('impression OK')
