"""Robustesse : import malveillant ou invalide, stockage indisponible, petit écran."""
import os, json, sys
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')); SH = os.path.join(ROOT, 'tests', 'shots')
URL = 'file://' + os.path.join(ROOT, 'index.html'); fails = []
def check(c, m):
    print(('OK   ' if c else 'ECHEC'), m); 
    if not c: fails.append(m)
evil = {'app': 'automatismes', 'version': 1, 'sheet': {'title': '<img src=x onerror="window.__xss=1"> Titre $\\href{javascript:alert(1)}{x}$', 'subtitle': '<script>window.__xss=2</script>',
  'font': 'Comic<script>', 'size': 999, 'cols': 7, 'content': 'zzz', 'chapIds': ['../../etc/passwd', 'c1'], 'seed': 'abc',
  'items': [{'src': 'flash', 'id': 'pct_de', 'seed': 5, 'o': {'q': '<img src=x onerror="window.__xss=3"> calcule <sub>2</sub> $\\frac{1}{2}$', 'a': '<b>12</b><script>1</script>', 'e': '<iframe src=//x></iframe>'}},
            {'src': 'flash', 'id': 'inconnu', 'seed': 1}, {'src': 'zzz', 'id': 'x'}, 'pas un objet', {'src': 'mcv', 'id': 'pctOf', 'seed': -5}]}}
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1360, 'height': 900}); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('#chaps details')
    path = os.path.join(SH, 'evil.json'); json.dump(evil, open(path, 'w'))
    pg.set_input_files('#importFile', path); pg.wait_for_selector('#pages .page'); pg.wait_for_timeout(700)
    check(pg.locator('#qlist li').count() == 2, 'import : questions invalides ignorées (2 conservées)')
    check(pg.evaluate('window.__xss === undefined'), 'import : aucun script exécuté')
    check(pg.locator('#pages img, #pages script, #pages iframe, #pages a').count() == 0, 'import : aucune balise dangereuse dans les pages')
    check(pg.evaluate("document.querySelector('#pages .page').style.getPropertyValue('--sz')") == '18pt', 'import : taille bornée à 18 pt')
    fn = pg.inner_text('#fileInfo'); print('   fichier :', fn); check('/' not in fn and '..' not in fn, 'import : nom de fichier sans caractères dangereux')
    # fichier non valide
    bad = os.path.join(SH, 'bad.json'); open(bad, 'w').write('{pas du json')
    pg.set_input_files('#importFile', bad); pg.wait_for_timeout(300)
    check('valide' in pg.inner_text('#toast'), 'import : message pour un fichier invalide')
    check(not errs, 'aucune exception JS : ' + str(errs[:2]))
    # effacer
    pg.once('dialog', lambda d: d.accept()); pg.click('#clearBtn2'); pg.wait_for_timeout(300)
    check(pg.locator('#v-compose:not([hidden])').count() == 1, 'effacer : retour à Composer')
    ctx.close()
    # stockage indisponible
    ctx2 = b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True); pg2 = ctx2.new_page(); e2 = []
    pg2.on('pageerror', lambda e: e2.append(str(e)))
    pg2.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('bloqué')}});")
    pg2.goto(URL); pg2.wait_for_selector('#chaps details')
    pg2.locator('details.chap[data-chap="c7"] summary input[type=checkbox]').check(); pg2.click('#create'); pg2.wait_for_selector('#pages .page'); pg2.wait_for_timeout(600)
    check(pg2.locator('#qlist li').count() == 12, 'sans stockage : la feuille se crée quand même')
    pg2.screenshot(path=os.path.join(SH, 'mobile-feuille.png'))
    pg2.click('nav.tabs button[data-go=privacy]'); pg2.wait_for_timeout(200)
    check('indisponible' in pg2.inner_text('#storeInfo'), 'sans stockage : message d’information')
    check(not e2, 'sans stockage : aucune exception ' + str(e2[:2]))
    pg2.goto(URL); pg2.wait_for_selector('#chaps details'); pg2.screenshot(path=os.path.join(SH, 'mobile-composer.png'))
    sw = pg2.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'); check(sw, 'mobile : pas de défilement horizontal de la page')
    b.close()
sys.exit(1 if fails else 0)
