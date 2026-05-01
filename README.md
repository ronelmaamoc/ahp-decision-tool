# 🎯 AHP Decision Tool

**Auteur : MAAMOC KENGUIM RONEL — Matricule : 22T2942**

Application web d'aide à la décision multicritères basée sur la méthode
**AHP (Analytical Hierarchy Process)** de Saaty.

---

## 🛠️ Technologies

- **Backend** : Python 3.10 + Django + Django REST Framework
- **Frontend** : ReactJS + Recharts

---

## 📋 Fonctionnalités

- Définition des critères (numériques ou catégoriels avec échelle de préférence)
- Saisie des alternatives avec scores par critère
- Construction de la matrice de comparaisons par paires (échelle de Saaty)
- Calcul automatique :
  - Matrice normalisée (Σ lignes et colonnes)
  - Tableau Criteria Weight Somme
  - λmax, CI, RI, CR → vérification de cohérence
  - Classement des alternatives (même si matrice incohérente)
- Téléchargement du rapport PDF complet

---

## 🚀 Installation & Lancement

### Prérequis
- Python 3.10+
- Node.js 18+
- npm

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
pip install -r requirements.txt
python manage.py runserver 8000
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

L'application est accessible sur **http://localhost:3000**

---

## 📖 Guide d'utilisation

### Étape 1 — Critères
- Cliquez **+ Ajouter critère**
- Entrez le nom (ex: *Processor Speed*)
- Cochez **Catégoriel** si les valeurs sont des labels (ex: Dell, Apple)
  → Définissez alors l'échelle : `Dell → 9`, `Apple → 7`, etc.
- Ajoutez au minimum **2 critères**

### Étape 2 — Alternatives
- Entrez le nom de chaque alternative (ex: *Machine 1*)
- Renseignez la valeur pour chaque critère
- Ajoutez au minimum **2 alternatives**

### Étape 3 — Matrice de comparaisons
- Comparez chaque paire de critères via l'échelle de Saaty :
  - `1` = Égale importance
  - `3` = Modérément important
  - `5` = Fortement important
  - `7` = Très fortement important
  - `9` = Extrêmement important
- Le triangle inférieur est rempli automatiquement (1/valeur)
- Cliquez **Calculer AHP**

### Étape 4 — Résultats
- **Onglet 1** : Matrice initiale + sommes colonnes
- **Onglet 2** : Matrice normalisée + Σ lignes/colonnes + poids
- **Onglet 3** : Tableau Criteria Weight Somme + λi
- **Onglet 4** : λmax, CI, RI, CR — verdict de cohérence
- **Onglet 5** : Classement des alternatives (toujours affiché)
- **Bouton PDF** : Télécharger le rapport complet

> ⚠️ Si CR ≥ 0.10, la matrice est incohérente. Le classement est
> quand même fourni à titre indicatif avec les paires problématiques identifiées.

---

## 🌐 Déploiement

- Backend : [Railway](https://railway.app) / [Render](https://render.com)
- Frontend : [Vercel](https://vercel.com) / [Netlify](https://netlify.com)

---

## 📚 Référence

> Saaty, T.L. (1980). *The Analytic Hierarchy Process*. McGraw-Hill.
