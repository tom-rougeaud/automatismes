"""Contrôle visuel : une feuille avec tous les types de questions et de figures → captures des pages."""
import json, os, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SH = os.path.join(ROOT, 'tests', 'shots')
SPEC = [('flash','prop_tableau'),('flash','prop_graph'),('flash','lecture_diag'),('flash','stats_tab'),('flash','droite_eq'),('flash','pyth_fig'),('flash','thales'),('flash','trigo_fig'),
        ('flash','vol_estim'),('flash','algo_var'),('flash','sci_ordre'),('flash','fn_types'),('flash','frac_comp'),('flash','estim_calc'),('flash','prio_err'),('flash','eq_err'),
        ('flash','cc_puissances'),('mcv','og1'),('mcv','ineq'),('mcv','thales'),('mcv','tcCompare'),('flash','repere'),('flash','aire_disque'),('flash','lect_image')]
cols = int(sys.argv[1]) if len(sys.argv) > 1 else 1
items = [{'src': s, 'id': i, 'seed': 320 + k * 11, 'o': {}} for k, (s, i) in enumerate(SPEC)]
sheet = {'title': 'Contrôle visuel — tous les types', 'subtitle': 'Test des figures et des zones de réponse', 'items': items, 'cols': cols, 'content': 'both', 'seed': 777, 'chapIds': ['c1'], 'expl': True}
path = os.path.join(SH, 'qa-sheet.json'); json.dump({'app': 'automatismes', 'version': 1, 'sheet': sheet}, open(path, 'w'))
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1360, 'height': 900})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.join(ROOT, 'index.html')); pg.wait_for_selector('#chaps details')
    pg.set_input_files('#importFile', path); pg.wait_for_selector('#pages .page'); pg.wait_for_timeout(800)
    n = pg.evaluate("""()=>{const pages=__auto.buildPages(__auto.state().sheet,'both');const d=document.createElement('div');d.id='qa';d.style.cssText='position:absolute;left:0;top:0;z-index:999;background:#ccc;padding:0';pages.forEach(p=>{p.style.transform='none';p.style.margin='0 0 10px';d.appendChild(p)});document.body.appendChild(d);return pages.length}""")
    print('pages :', n, 'erreurs :', errs)
    for i in range(n):
        pg.locator('#qa .page').nth(i).screenshot(path=os.path.join(SH, f'qa-{cols}c-{i+1}.png'))
    b.close()
