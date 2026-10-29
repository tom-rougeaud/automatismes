<h1 align="center">Automatismes · feuilles imprimables</h1>

<p align="center"><b>Des feuilles d’automatismes A4 avec corrigé, par chapitre, pour la voie professionnelle.</b><br>
Les nombres sont tirés au hasard, les réponses sont calculées : chaque feuille est différente.</p>

<p align="center"><a href="https://tom-rougeaud.github.io/automatismes/"><b>▶ Ouvrir l’application</b></a></p>

---

## En bref

1. On coche des chapitres ou des notions (CAP, 3ᵉ Prépa-Métiers, 2de pro, 1re pro, Tle pro) et un nombre de questions.
2. On obtient une feuille A4 avec figures, tableaux et graphiques, et son corrigé.
3. On déplace, modifie, remplace ou ajoute des questions, on règle le titre, la police et la taille.
4. On télécharge un PDF nommé `niveau_chapitres_nombre-questions.pdf`, ou on imprime.

## Fonctions

- **Questions** : 479 notions réparties sur 5 niveaux (avec figures), classées en chapitres. Un titre de chapitre, un thème et une consigne précèdent les questions ; place pour les calculs et barème (identique ou différencié) réglables.
- **Types de questions** : réponse libre, QCM, vrai/faux, association, mise en ordre, estimation, étape fausse à repérer.
- **Édition** : glisser-déposer ou ↑ ↓, modifier l’énoncé, la réponse et l’explication (formules entre `$…$`), masquer une figure, autre question de la même notion, ajout, suppression.
- **Présentation** : titre, sous-titre, police, taille, 1 ou 2 colonnes, champs Nom/Classe/Date, noir et blanc.
- **Sorties** : PDF (pages A4 en images nettes), impression (PDF vectoriel via le navigateur), export et import de la feuille en `.json` (liste des questions et graines de tirage).
- **Installable** sur l’écran d’accueil (PWA), utilisable hors connexion.

## Confidentialité

Aucune donnée collectée, aucun cookie, aucun traceur, aucun appel à un site extérieur : polices, formules et questions sont intégrées à la page. La feuille en cours est gardée dans le navigateur de l’appareil uniquement.

## Construire et tester

Prérequis : Node.js 18 ou plus ; Python 3 avec `playwright` et `pypdf` pour les tests de bout en bout.

```
node build.js                # assemble index.html, manifest.webmanifest, sw.js
node tests/test-core.js 150  # chaque notion sur 150 tirages
python3 tests/test-app.py    # parcours complet dans Chromium, export PDF
python3 tests/test-robust.py # import piégé, stockage bloqué, petit écran
python3 tests/test-print.py  # impression vectorielle
python3 tools/make-icons.py  # icônes
```

| Dossier | Rôle |
|---|---|
| `src/` | cœur (`core.js`), interface (`app.js`, `app.css`), feuille A4 (`sheet.css`), gabarit, KaTeX et polices |
| `sources/flash/` | moteur de questions (palette de figures sobre) |
| `sources/mcv2de/` | générateurs de questions |
| `tests/` | tests automatiques |

## Auteur et licence

Conçu par **Tom Rougeaud**, professeur de mathématiques-sciences (académie de Dijon).
Licence **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/deed.fr)** : utilisation, adaptation et partage libres, sans usage commercial, en citant l’auteur.
