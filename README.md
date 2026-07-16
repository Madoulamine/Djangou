"# Djangou" 
# Djangou — Plateforme Éducative Intelligente

Djangou est une plateforme web éducative progressive (PWA) offline-first,
destinée aux élèves, enseignants et administrateurs de Guinée et d'Afrique
de l'Ouest francophone. Elle combine apprentissage en ligne, évaluations
numériques, quiz interactifs, compétition en temps réel, messagerie, badges,
certifications et organisation de concours officiels ministériels.

---

## 🎯 Objectifs

- Rendre l'éducation numérique accessible même sans connexion stable
- Permettre aux enseignants de créer et corriger des épreuves automatiquement
- Organiser des concours officiels en ligne au niveau régional et national
- Fidéliser les apprenants par les badges, défis et classements
- Intégrer un système de paiement Mobile Money (Orange, MTN, Wave) — futur

---

## 👥 Utilisateurs

| Rôle | Interface | Description |
|------|-----------|-------------|
| Élève / Étudiant | Interface Élève | Du primaire, secondaire ou université |
| Enseignant | Interface Enseignant | Crée cours, quiz, épreuves — tout niveau |
| Administrateur | Dashboard Admin | Contrôle total du système |
| Candidat concours | Interface Élève | Participe aux concours ministériels |

---

## 🛠️ Stack Technique

### Backend
- **Runtime** : Node.js v24
- **Framework** : Express.js
- **Temps réel** : Socket.IO
- **Auth** : JWT (access token 15min + refresh token 7j) + bcryptjs
- **Upload fichiers** : Multer → Cloudinary
- **Emails** : Nodemailer
- **Sécurité** : Helmet, CORS, express-validator, express-rate-limit
- **Logs** : Morgan
- **IDs sécurisés** : UUID
- **Base de données** : Firebase Firestore + Firebase Admin SDK
- **Hébergement** : Render

### Frontend
- **Framework** : React.js 18 + Vite + TypeScript
- **Styling** : Tailwind CSS
- **Routing** : React Router v6 (guards par rôle)
- **État global** : Zustand
- **HTTP** : Axios (intercepteurs JWT automatiques)
- **Temps réel** : Socket.IO-client
- **PWA** : vite-plugin-pwa + Workbox (offline-first)
- **Offline storage** : Dexie.js (IndexedDB)
- **Hébergement** : Vercel

### Base de données & Stockage
- **Base principale** : Firebase Firestore (12 collections)
- **Auth sociale** : Firebase Authentication
- **Fichiers** : Cloudinary (PDF, vidéos, images)
- **Cache offline** : IndexedDB via Dexie.js

---

## 🗄️ Collections Firestore

| Collection | Description |
|------------|-------------|
| `users` | Comptes élèves, enseignants, admins |
| `courses` | Cours avec ressources PDF/vidéo |
| `quizzes` | Quiz solo et multijoueur |
| `evaluations` | Épreuves numériques des enseignants |
| `quizResults` | Résultats des quiz |
| `evalResults` | Résultats des épreuves + anti-triche |
| `messages` | Messagerie privée |
| `notifications` | Notifications système |
| `badges` | Badges obtenus par les élèves |
| `certifications` | Certificats PDF générés |
| `defis` | Défis entre apprenants |
| `concours` | Concours officiels ministériels |

---

## 📁 Structure du projet
---

## 🔀 Branches Git

| Branche | Rôle | Responsable |
|---------|------|-------------|
| `backend` | Code API Node.js/Express | Dev backend |
| `frontend` | Code React/Vite/TypeScript | Devs frontend |
| `dev` | Intégration + staging | Chef de projet |
| `main` | Production stable | Chef de projet |

**Règle absolue** : jamais de push direct sur `dev` ou `main`.
Toujours via Pull Request depuis une branche feature.

---

## 📦 Modules de développement

### ✅ MODULE 1 — Fondations *(en cours)*
> Durée estimée : 4 à 6 semaines

- Authentification complète JWT (inscription, connexion, refresh, logout)
- Système de rôles : ELEVE, ENSEIGNANT, ADMIN
- Gestion des cours (CRUD, upload PDF/vidéo via Cloudinary)
- Dashboard Admin (gestion utilisateurs, modération, statistiques)
- PWA offline-first (Service Worker + Dexie.js IndexedDB)
- 3 interfaces de base (Élève, Enseignant, Admin)

**Critères de validation** : un élève peut accéder à un cours hors-ligne,
un enseignant peut publier un cours, l'admin peut bloquer un compte,
l'app s'installe comme PWA sur Android.

---

### ⏳ MODULE 2 — Interactivité *(après Module 1 en production)*
> Durée estimée : 4 à 6 semaines

- Quiz solo avec timer et correction automatique
- Quiz multijoueur en temps réel via Socket.IO (online uniquement)
- Évaluations numériques avec lien sécurisé UUID
- Notation automatique selon niveau (/10 primaire-université, /20 secondaire)
- Système anti-triche temps réel (Page Visibility API + Socket.IO)
- Interface de surveillance pour l'enseignant

---

### ⏳ MODULE 3 — Engagement *(après Module 2 en production)*
> Durée estimée : 3 à 5 semaines

- Badges automatiques selon critères (triggers backend)
- Génération de certificats PDF
- Messagerie privée élèves/enseignants
- Défis 1v1 et tournois entre apprenants
- Classements globaux et par matière
- Notifications push PWA (Service Worker)

---

### ⏳ MODULE 4 — Concours Officiels Ministériels *(après Module 3 en production)*
> Durée estimée : 5 à 8 semaines

- Concours régionaux et nationaux en ligne organisés par le Ministère
  de l'Enseignement Pré-universitaire de Guinée
- Inscription des candidats par région avec numéro de candidature unique
- Passage simultané de l'épreuve en temps réel (Socket.IO rooms par région)
- Correction automatique + classement régional → qualification nationale
- Système anti-triche complet identique au Module 2
- Scalabilité prévue pour des milliers de candidats simultanés
- Export des résultats PDF/Excel

---

## 🔒 Sécurité

- JWT access token (15min) + refresh token (7j)
- Hash bcryptjs (salt 12) — aucun mot de passe en clair
- Helmet.js — headers HTTP sécurisés
- CORS — liste blanche des origines autorisées
- Rate limiting — 100 req/15min sur `/api/auth`
- express-validator — validation de toutes les entrées
- Multer + liste blanche MIME — uploads sécurisés
- Liens d'épreuves sécurisés par UUID unique
- `.env` jamais dans le repo (gitignore strict)

---

## 🌍 Contexte

Conçu pour le marché africain avec une connectivité intermittente.
L'architecture offline-first est non négociable :
- Quiz solo disponible hors-ligne
- Cours et ressources cachés dans IndexedDB
- Synchronisation automatique au retour du réseau
- Quiz multijoueur et concours = online uniquement (Socket.IO)

---

## 🚀 Démarrage rapide

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## 📄 Licence

MIT — Djangou EdTech Platform © 2026


