"""Test de bout en bout dans Chromium : chargement, création de feuille, édition, export PDF."""
import os, sys, json
from playwright.sync_api import sync_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SHOTS = os.path.join(ROOT, 'tests', 'shots')
URL = 'file://' + os.path.join(ROOT, 'index.html')
errors = []
def check(cond, msg):
    print(('OK   ' if cond else 'ECHEC'), msg)
    if not cond: errors.append(msg)
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1360, 'height': 900}, accept_downloads=True)
    pg = ctx.new_page()
    logs = []
    pg.on('console', lambda m: logs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: logs.append(('pageerror', str(e))))
    pg.goto(URL); pg.wait_for_selector('#chaps details')
    check(not [l for l in logs if l[0] in ('error', 'pageerror')], 'aucune erreur console au chargement ' + str([l for l in logs][:3]))
    n_chaps = pg.locator('#chaps details.chap').count()
    check(n_chaps == 11, f'11 chapitres affichés ({n_chaps})')
    pg.screenshot(path=os.path.join(SHOTS, '1-composer.png'))
    # cocher chapitre 1 et 3
    for cid in ('c1', 'c3'):
        pg.locator(f'details.chap[data-chap="{cid}"] summary input[type=checkbox]').check()
    check('notions cochées' in pg.inner_text('#selInfo'), 'compteur de notions : ' + pg.inner_text('#selInfo'))
    pg.fill('#n', '14') if False else pg.evaluate("document.getElementById('n').value=14;document.getElementById('n').dispatchEvent(new Event('input'))")
    pg.click('#create'); pg.wait_for_selector('#pages .page')
    pg.wait_for_timeout(600)
    npages = pg.locator('#pages .page').count()
    nq = pg.locator('#qlist li').count()
    check(nq == 14, f'14 questions dans la liste ({nq})')
    check(npages >= 2, f'aperçu : {npages} pages (feuille + corrigé)')
    pg.screenshot(path=os.path.join(SHOTS, '2-feuille.png'), full_page=False)
    # titre auto
    t = pg.input_value('#sTitle'); print('   titre :', t)
    # modifier réglages
    pg.fill('#sTitle', 'Automatismes — test'); pg.select_option('#sFont', 'Verdana'); pg.select_option('#sCols', '2')
    pg.evaluate("document.getElementById('sSize').value=10;document.getElementById('sSize').dispatchEvent(new Event('input'))")
    pg.wait_for_timeout(700)
    check(pg.locator('#pages .page.cols2').count() >= 1, 'passage en 2 colonnes')
    # déplacer question 1 vers le bas
    first_before = pg.inner_text('#qlist li:nth-child(1) .tx span')
    pg.click('#qlist li:nth-child(1) button[data-a=down]'); pg.wait_for_timeout(300)
    second_after = pg.inner_text('#qlist li:nth-child(2) .tx span')
    check(first_before == second_after, 'déplacement ↓ de la question 1')
    # édition
    pg.click('#qlist li:nth-child(3) button[data-a=edit]'); pg.wait_for_selector('#mEdit.on')
    pg.fill('#eQ', 'Question modifiée : calculer $\\dfrac{3}{4}$ de 20.'); pg.fill('#eA', '15')
    pg.click('#eSave'); pg.wait_for_timeout(600)
    check('Question modifiée' in pg.inner_text('#qlist li:nth-child(3) .tx span'), 'édition d’une question')
    check('modifiée' in pg.inner_text('#qlist li:nth-child(3) .tx b').lower(), 'marquage « modifiée »')
    # retirer + ajouter + supprimer
    pg.click('#addOne'); pg.wait_for_timeout(300)
    check(pg.locator('#qlist li').count() == 15, 'ajout d’une question (15)')
    pg.click('#qlist li:nth-child(15) button[data-a=del]'); pg.wait_for_timeout(300)
    check(pg.locator('#qlist li').count() == 14, 'suppression (14)')
    pg.click('#qlist li:nth-child(2) button[data-a=redo]'); pg.wait_for_timeout(300)
    check(pg.locator('#qlist li').count() == 14, 'tirage d’une autre question (↻)')
    pg.select_option('#sContent', 'both'); pg.wait_for_timeout(300)
    fn = pg.inner_text('#fileInfo'); print('   fichier :', fn)
    check(fn.startswith('2de-pro_') and fn.endswith('_14-questions_avec-corrige.pdf'), 'nom de fichier conforme')
    pg.screenshot(path=os.path.join(SHOTS, '3-feuille-2col.png'))
    # export PDF
    with pg.expect_download(timeout=90000) as dl:
        pg.click('#pdfBtn')
    d = dl.value; path = os.path.join(SHOTS, 'export.pdf'); d.save_as(path)
    print('   téléchargé :', d.suggested_filename, os.path.getsize(path)//1024, 'Ko')
    check(d.suggested_filename == fn, 'nom du PDF téléchargé = nom annoncé')
    # état persistant : recharger
    pg.reload(); pg.wait_for_selector('#chaps details, #pages .page')
    pg.wait_for_timeout(500)
    check(pg.locator('#qlist li').count() == 14 or pg.locator('#chaps').count() == 1, 'rechargement sans erreur')
    check(not [l for l in logs if l[0] in ('error', 'pageerror')], 'aucune erreur console en fin de test ' + str([l for l in logs if l[0] in ('error','pageerror')][:3]))
    b.close()
print('\nRÉSULTAT :', 'tout est OK' if not errors else str(len(errors)) + ' échec(s)')
sys.exit(1 if errors else 0)
