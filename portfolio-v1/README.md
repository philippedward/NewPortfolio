# Bilan d'activité eikonlab — Template annuel

Ce projet est un **template reproductible** : chaque année, une nouvelle instance est créée pour générer le bilan d'activité d'eikonlab. La structure reste la même, seul le contenu et style visuel changent.

---

## Vue d'ensemble

Le projet repose sur deux activités bien distinctes :

**1. Saisie du contenu** — via l'interface d'administration (Decap CMS) ou directement dans les fichiers JSON du dossier `src/_data/`. Aucune connaissance technique requise pour cette partie.

**2. Mise en page et intégration** — les templates `.njk`, les styles SCSS et le JavaScript donnent forme aux données. C'est ici que travaillent les stagiaires.

---

## Démarrage

Le projet requiert **Node.js 24**. Un fichier `.nvmrc` est inclus à la racine — si tu utilises [nvm](https://github.com/nvm-sh/nvm), un simple `nvm use` dans le dossier bascule automatiquement sur la bonne version.

```bash
nvm use           # bascule sur Node 24 (si nvm est installé)
npm install       # à faire une seule fois
npm run dev       # lance le serveur local
```

Un seul terminal suffit : `npm run dev` démarre simultanément Eleventy, la compilation SCSS, le bundler JS et le proxy CMS.

| URL                            | Description                |
| ------------------------------ | -------------------------- |
| `http://localhost:8080`        | Site en développement      |
| `http://localhost:8080/admin/` | Interface d'administration |

---

## Mise en ligne

```bash
npm run build
```

Le dossier `_site/` contient le site compilé — des fichiers HTML, CSS et JS statiques prêts à déposer sur un hébergeur. Le CSS et le JS sont automatiquement minifiés et compressés. L'interface d'administration est exclue du build (usage local uniquement).

| Méthode         | Instructions                                  |
| --------------- | --------------------------------------------- |
| FTP (CyberDuck) | Déposer le contenu de `_site/` sur le serveur |

> Le dossier `_site/` est regénéré à chaque build — ne pas le modifier manuellement.

### Hébergement dans un sous-dossier

Si le site est publié dans un sous-dossier (ex. `https://prenom-nom.at-eikon.ch/bilan-activite/`), passer la variable `PATH_PREFIX` au moment du build :

```bash
PATH_PREFIX=/nom-du-dossier/ npm run build
```

Tous les liens internes et les assets s'adaptent automatiquement. Pour une URL racine (ex. `https://2025.bilan-activite.ch`), un `npm run build` sans variable suffit.

### Déploiement automatique via GitHub Actions

Le fichier `.github/workflows/deploy.yml` automatise le build et le déploiement FTP à chaque push sur la branche `main`. Le dossier distant est vidé puis remplacé intégralement par le contenu de `_site/` — le serveur reflète toujours exactement le dernier build.

**1. Configurer les secrets** (Settings → Secrets and variables → Actions → Secrets) :

| Secret         | Description                                    |
| -------------- | ---------------------------------------------- |
| `FTP_SERVER`   | Adresse du serveur FTP (ex. `ftp.at-eikon.ch`) |
| `FTP_USERNAME` | Identifiant FTP                                |
| `FTP_PASSWORD` | Mot de passe FTP                               |

**2. Configurer les variables** (Settings → Secrets and variables → Actions → Variables) :

| Variable         | Description                                                                |
| ---------------- | -------------------------------------------------------------------------- |
| `FTP_SERVER_DIR` | Chemin vers le ossier cible sur le serveur (ex. `/www/bilan-activite/`)    |
| `PATH_PREFIX`    | Préfixe d'URL si sous-dossier (ex. `/bilan-activite/`), laisser vide sinon |

Une fois configuré, pousser sur `main` suffit à mettre le site à jour. Il est aussi possible de déclencher le déploiement manuellement depuis l'onglet **Actions** du dépôt GitHub.

---

## Les deux faces du projet

### Face 1 — Contenu : `src/_data/`

Toutes les données du site vivent dans ce dossier sous forme de fichiers JSON. Ils peuvent être édités directement dans un éditeur de texte ou via l'interface d'administration.

```
src/_data/
├── config.json          ← Infos générales : titre, organisation, édito, partenaires…
├── encadrants.json      ← Liste des encadrant·es (nom, photo, titre, secteurs)
├── stagiaires.json      ← Stagiaires groupés par session (août–déc, jan–avr, avr–juil)
└── projets/             ← Un fichier JSON par projet
    ├── miam.json
    └── ecole-de-couture.json
```

Chaque fichier projet contient : titre, sessions, stagiaires associé·es, type de mandat, client·es, description, images, vidéos, compétences, liens, témoignage client.

`projets.js` lit automatiquement tous les fichiers du dossier `projets/` et les expose comme un tableau dans les templates — son nom de fichier devient l'identifiant URL du projet (`miam.json` → `/projets/miam/`).

### Face 2 — Intégration : templates, styles, JS

C'est ici que les données prennent forme. Trois technologies sont impliquées :

- **Nunjucks (`.njk`)** — templates HTML avec logique d'affichage
- **SCSS** — feuilles de style avec variables et imbrication
- **JavaScript (esbuild)** — interactivité et animations

---

## Les templates Nunjucks (`.njk`)

### Qu'est-ce que c'est ?

Un fichier `.njk` est du HTML enrichi de balises Nunjucks — un langage de templates qui permet d'injecter des données, de faire des boucles et des conditions.

```njk
{# Ceci est un commentaire Nunjucks — il n'apparaît pas dans le HTML final #}

{# Afficher une variable #}
<h1>{{ config.titre }}</h1>

{# Boucle sur un tableau #}
{% for projet in projets %}
  <p>{{ projet.titre }}</p>
{% endfor %}

{# Condition : afficher uniquement si le champ est renseigné #}
{% if projet.clients %}
  <p>{{ projet.clients }}</p>
{% endif %}
```

Eleventy exécute ces templates au moment du build et génère du HTML statique classique. Le navigateur ne voit jamais de code Nunjucks.

### Layouts et composants

Le projet distingue deux types de templates :

**Layouts** (`src/views/_layouts/`) — squelettes de pages. Chaque page déclare quel layout elle utilise dans son front matter :

```njk
---
layout: base.njk
title: Accueil
---

<h1>Mon contenu ici</h1>
```

`base.njk` fournit le `<head>`, les balises `<html>`, `<body>`, le chargement du CSS et du JS commun. `projet.njk` hérite de `base.njk` et ajoute la structure de la page projet, ainsi que le chargement de `projet.js`.

**Composants** (`src/views/_includes/`) — fragments réutilisables inclus dans les templates :

```njk
{% for projet in projets %}
  {% include "carte-projet.njk" %}
{% endfor %}
```

Le fichier inclus a accès aux mêmes variables que le template parent — ici `projet` est disponible dans `carte-projet.njk` sans passer de paramètre.

---

## Les styles SCSS (`src/assets/styles/`)

SCSS est une extension de CSS qui ajoute des variables, de l'imbrication et des imports. Il est compilé en CSS standard au build.

```
src/assets/styles/
├── main.scss          ← Point d'entrée — importe tous les autres fichiers
├── _variables.scss    ← Couleurs, polices, espacements — commencer ici
├── _base.scss         ← Reset global, typographie, polices Google
└── _pages.scss        ← Mise en page des sections, cartes, blockquotes…
```

`main.scss` importe tout :

```scss
@use "variables" as *; // rend les variables disponibles partout avec $
@use "base";
@use "pages";
```

Modifier `_variables.scss` en premier — couleurs, typographie et espacements se propagent à tout le site.

---

## Le JavaScript (`src/assets/js/`)

| Fichier     | Chargé sur                                     |
| ----------- | ---------------------------------------------- |
| `main.js`   | Toutes les pages (via `base.njk`)              |
| `projet.js` | Les pages projet uniquement (via `projet.njk`) |

Les fichiers sont bundlés par esbuild : les imports npm sont résolus, le code est minifié pour la production.

---

### Ajouter une librairie tierce (ex. GSAP)

```bash
npm install gsap
```

```js
// src/assets/js/main.js
import gsap from "gsap";

gsap.from("h1", { opacity: 0, y: 30, duration: 1 });
```

esbuild (le bundler) détecte l'import, intègre GSAP dans le fichier final et génère un seul fichier JS optimisé. Aucune configuration supplémentaire n'est nécessaire.

---

## Structure complète du projet

```
bilan-eleventy/
│
├── src/
│   ├── _data/                 ← Contenu (JSON) — saisie via CMS ou éditeur
│   │   ├── config.json
│   │   ├── encadrants.json
│   │   ├── stagiaires.json
│   │   ├── projets.js         ← Lit le dossier projets/ et retourne un tableau
│   │   └── projets/
│   │       └── *.json
│   │
│   ├── views/                 ← Tous les fichiers de templates
│   │   ├── _layouts/          ← Squelettes de pages
│   │   │   ├── base.njk       ← Wrappeur universel (head, body, CSS, JS)
│   │   │   └── projet.njk     ← Page de détail d'un projet
│   │   ├── _includes/         ← Composants réutilisables
│   │   │   └── carte-projet.njk
│   │   ├── index.njk          ← Page d'accueil
│   │   └── projets.njk        ← Génère une page par projet (pagination Eleventy)
│   │
│   ├── assets/                ← Fichiers compilés/bundlés par les outils de build
│   │   ├── styles/
│   │   │   ├── main.scss
│   │   │   ├── _variables.scss
│   │   │   ├── _base.scss
│   │   │   ├── _pages.scss
│   │   │   └── components/
│   │   └── js/
│   │       ├── main.js
│   │       └── projet.js
│   │
│   ├── admin/                 ← Interface Decap CMS (dev uniquement, non déployé)
│   │   ├── index.html
│   │   └── config.yml         ← Configuration des collections CMS
│   │
│   └── public/                ← Images et fichiers statiques (copiés tels quels)
│       └── images/
│
├── _site/                     ← Build final (généré — ne pas modifier)
├── eleventy.config.js         ← Configuration Eleventy
├── package.json
└── README.md
```

---

## Commandes

| Commande        | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `npm install`   | Installe les dépendances (une seule fois)                      |
| `npm run dev`   | Serveur local avec rechargement automatique + proxy CMS        |
| `npm run build` | Compile et minifie le site dans `_site/` pour la mise en ligne |
