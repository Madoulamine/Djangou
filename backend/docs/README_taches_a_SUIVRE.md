# Djangou Backend — Répartition des tâches

## EQUIPE

| Nom | Rôle | Profil |
|---|---|---|
| **LamineDev** | PDG Djangou FullStack | Backend(demare)
| **Bah_Bouba** | Développeur FullStack | Backend 
| **Yassine**   | Développeur FullStack | Backend 

Tous les trois DEV. Bah_Bouba Yassine LamineDev

## REGLE AVANT DE COMMENCER

1. **Jamais de push direct** sur `backend`, `dev` ou `main`. Plutôt de
    CREER Toujours une BRANCHE `feature/nom-de-la-tache` où TRAVAILLER.

2. **Chaque tâche = une Pull Request** vers `backend`, reviewée avant 
    le merge.

3. **Commentaires en français** sur les grandes lignes de code
    uniquement — pas besoin de commenter chaque ligne, mais chaque 
    fonction importante doit avoir une courte explication de ce qu'elle fait.

4. **Convention de commit** — chaque message de commit Git (par example:`git commit -m "XXX:..."`) doit commencer par un mot-clé (XXX:)indiquant le type de changement comme:
   - `feat:` → nouvelle fonctionnalité (ex : `feat: ajout de la route login`)
   - `fix:` → correction de bug (ex : `fix: correction de l'erreur 500 sur /register`)
   - `refactor:` → réorganisation du code sans changer son comportement (ex : `refactor: simplification du service email`)
   - `docs:` → modification de documentation uniquement (ex : `docs: mise à jour du README`)
   - `chore:` → tâche technique sans logique métier (ex : `chore: création de la structure des dossiers`)

5. **Optimisation du code** :
   - Pas de duplication — si un bout de code se répète 3 fois, on en fait une fonction réutilisable dans `utils/` ou `services/`.
   - Toujours utiliser `async/await`, jamais de `.then().catch()` imbriqués.
   - Toujours gérer les erreurs avec `try/catch` et les transmettre au middleware `errorHandler.js`.
   - Toujours valider les données reçues avec `express-validator` avant de les traiter.

6. **Avant de commencer une tâche**, vérifier que la tâche précédente
    dans la liste est bien mergée sur `backend` — certaines tâches dépendent des précédentes.

7. **Bah_Bouba review en priorité** les Pull Requests de LamineDev 
    et Yassine — c'est notre référent technique pour les questions difficiles.

8. **En cas de DOUTE**, on en DISCUTE en GROUPE WHATSAPP avant 
    de MERGER.

---

## MODULE 1 — Fondations

### Étape 1 — Toute la configuration de base (LamineDev)

LamineDev(moi) démarre seul sur toute la configuration initiale, pour que vous 2 vous ayez une base stable sur laquelle travailler.

**Tâche : `feature/init-server`**

    Créer `server.js` et `src/app.js`. Le serveur Express doit démarrer, écouter sur le port défini dans `.env`, et répondre `OK` sur `GET /api/health`.

```js
// server.js — point d'entrée principal
// Démarre le serveur HTTP et initialise Socket.IO
```

**Tâche : `feature/firebase-config`**

    Créer `src/config/firebase.js`. Initialiser Firebase Admin SDK avec les clés du `.env`. Exporter l'instance Firestore pour qu'elle soit utilisable partout dans le projet.

```js
// src/config/firebase.js
// Initialise la connexion à Firebase Admin SDK et exporte Firestore
```

**Tâche : `feature/cloudinary-config`**

    Créer `src/config/cloudinary.js` et `src/config/multer.js`. Configurer Multer pour accepter uniquement PDF, images et vidéos, et transférer automatiquement vers Cloudinary.

```js
// src/config/cloudinary.js
// Configure la connexion à Cloudinary avec les clés du .env

// src/config/multer.js
// Configure Multer : liste blanche MIME, taille max, stockage temporaire
```

**Tâche : `feature/error-handler`**

Créer `src/middleware/errorHandler.js`. Toutes les erreurs de 
    l'application doivent passer par ce middleware et renvoyer une réponse JSON cohérente : `{ success: false, message: "..." }`.

```js
// src/middleware/errorHandler.js
// Centralise la gestion des erreurs et renvoie une réponse JSON uniforme
```

**Critère de validation global de l'étape 1** : `npm run dev` démarre
    sans erreur, `http://localhost:5000/api/health` répond, Firestore est accessible, un fichier test uploadé apparaît dans Cloudinary, une erreur volontaire renvoie le bon format JSON.

**Une fois cette étape mergée sur `backend`, Bah_Bouba et Yassine 
    peuvent démarrer leurs tâches respectives.**

---

### Étape 2 — Middlewares de sécurité (Bah_Bouba)

**Tâche : `feature/middleware-auth`**

    Créer `src/middleware/authMiddleware.js` (vérifie le JWT dans le header `Authorization`) et `src/middleware/roleMiddleware.js` (vérifie que le rôle de l'utilisateur correspond à ce qui est autorisé sur la route).

```js
// src/middleware/authMiddleware.js
// Vérifie que le token JWT est valide avant d'autoriser la requête

// src/middleware/roleMiddleware.js
// Vérifie que le rôle de l'utilisateur (ELEVE, ENSEIGNANT, ADMIN) correspond
```

**Critère de validation** : une requête sans token est rejetée avec un code 401. Une requête avec un mauvais rôle est rejetée avec un code 403.

**Dépend de** : Étape 1 mergée.

---

### Étape 3 — Inscription (Yassine)

**Tâche : `feature/auth-register`**

    Route `POST /api/auth/register`. Vérifier que l'email n'existe pas déjà dans Firestore, hasher le mot de passe avec `bcryptjs` (salt 12), créer l'utilisateur, renvoyer une réponse de succès.

```js
// src/controllers/auth.controller.js
// register() : crée un nouvel utilisateur avec mot de passe hashé

// src/services/auth.service.js
// Logique métier : vérification email unique, hashage, création Firestore
```

**Critère de validation** : un nouvel utilisateur est créé dans 
    Firestore avec un mot de passe hashé (jamais en clair). Tenter de réinscrire le même email renvoie une erreur claire.

**Dépend de** : Étape 1 mergée. 
    Peut démarrer en même temps que l'étape 2.

---

### Étape 4 — Connexion (Bah_Bouba)

**Tâche : `feature/auth-login`**

    Route `POST /api/auth/login`. Vérifier l'email et le mot de passe, générer un access token (15 min) et un refresh token (7 jours), stocker le refresh token en base, renvoyer les deux tokens.

```js
// src/controllers/auth.controller.js
// login() : vérifie les identifiants et génère les tokens JWT
```

**Critère de validation** : une connexion réussie renvoie un access  
      token et un refresh token valides. Un mauvais mot de passe renvoie une erreur 401.

**Dépend de** : Étape 2 et Étape 3 mergées.

---

### Étape 5 — Refresh token et déconnexion (Yassine)

**Tâche : `feature/auth-refresh-logout`**

    Routes `POST /api/auth/refresh` (génère un nouvel access token à partir du refresh token) et `POST /api/auth/logout` (invalide le refresh token en base).

```js
// src/controllers/auth.controller.js
// refreshToken() : génère un nouvel access token
// logout() : invalide le refresh token stocké
```

**Critère de validation** : après un logout, l'ancien refresh token ne 
    peut plus générer de nouveau access token.

**Dépend de** : Étape 4 mergée.

---

### Étape 6 — Réinitialisation mot de passe (LamineDev)

**Tâche : `feature/auth-forgot-password`**

    Route `POST /api/auth/forgot-password`. Générer un token UUID temporaire, l'enregistrer en base avec une date d'expiration, envoyer un email via Nodemailer contenant le lien de réinitialisation.

```js
// src/services/email.service.js
// sendResetPasswordEmail() : envoie l'email avec le lien de réinitialisation

// src/controllers/auth.controller.js
// forgotPassword() et resetPassword()
```

**Critère de validation** : un email est bien reçu avec un lien 
    fonctionnel, le token expire après 1 heure.

**Dépend de** : Étape 3 mergée.

---

### Étape 7 — Gestion des cours, CRUD complet (Yassine + Bah_Bouba en binôme)

**Tâche : `feature/courses-crud`**

    Routes `GET /api/courses`, `POST /api/courses`, `PUT /api/courses/:id`, `DELETE /api/courses/:id`. Seul l'enseignant propriétaire du cours (ou Admin) peut modifier/supprimer. Upload du PDF/vidéo via Multer + Cloudinary.
    - Ajout du mode Brouillon (`isPublished` booléen).
    - Pagination pour la route GET (par lots de 100 cours) et filtrables.
    - Compteur de consultations (`viewCount`).

```js
// src/controllers/courses.controller.js
// getCourses(), createCourse(), updateCourse(), deleteCourse()

// src/services/firebase.service.js
// Fonctions génériques réutilisables pour lire/écrire dans Firestore
```

**Critère de validation** : un enseignant peut créer un cours avec un 
    PDF, le modifier, le supprimer. Un élève ne peut que consulter.

**Dépend de** : Étape 1 mergée. Tâche plus complexe — en binôme pour
    partager la charge.

---

### Étape 8 — Gestion des utilisateurs côté Admin (LamineDev)

**Tâche : `feature/users-admin`**

    Routes `GET /api/users` (liste tous les comptes), `PUT /api/users/:id/block` (bloque/débloque un compte), `DELETE /api/users/:id`. Accessible uniquement au rôle ADMIN.

```js
// src/controllers/users.controller.js
// getAllUsers(), blockUser(), deleteUser()
```

**Critère de validation** : un admin peut bloquer un utilisateur, 
    l'utilisateur bloqué ne peut plus se connecter.

**Dépend de** : Étape 2 mergée.

---

### Fin du Module 1 — Ce que nous devons avoir, je pense bien

- Un élève peut s'inscrire, se connecter, et accéder à un cours d'un enseignant.
- Un enseignant peut créer et publier un cours avec PDF.
- L'admin a le controlle général de tout ce qui se passe à l'interieur de la
  plateforme bloquer un compte.
- Tous les tests manuels passent en staging sur `dev`.
- Déployé sur Render en production via `main`.

---

## MODULE 2 — Interactivité

### Étape 9 — Configuration Socket.IO (Bah_Bouba)

**Tâche : `feature/socket-config`**

    Créer `src/config/socket.js`. Initialiser Socket.IO, gérer la connexion/déconnexion des clients, authentifier les sockets avec le JWT.

```js
// src/config/socket.js
// Initialise Socket.IO et authentifie chaque connexion via JWT
```

**Dépend de** : Module 1 entièrement merger en dev puis en production.

---

### Étape 10 — Quiz solo, CRUD (Yassine)

**Tâche : `feature/quiz-solo`**

    Routes pour créer un quiz, ajouter des questions QCM/réponses libres, configurer le timer. Route pour soumettre les réponses et calculer le score automatiquement.

```js
// src/controllers/quizzes.controller.js
// createQuiz(), submitQuizAnswers()

// src/services/scoring.service.js
// calculateScore() : corrige automatiquement les réponses
```

**Dépend de** : Étape 9 mergée.

---

### Étape 11 — Quiz multijoueur en temps réel (Bah_Bouba)

**Tâche : `feature/quiz-multiplayer`**

    Créer `src/sockets/quiz.socket.js`. Gérer la création de salle, la connexion des participants, l'envoi synchronisé des questions, le classement en temps réel.

```js
// src/sockets/quiz.socket.js
// Gère les événements : créer salle, rejoindre salle, répondre, classement live
```

**Dépend de** : Étape 10 mergée. Tâche complexe — réservée à Bah_Bouba.

---

### Étape 12 — Évaluations numériques (LamineDev)

**Tâche : `feature/evaluations-crud`**

    Routes pour créer une épreuve avec lien sécurisé UUID, date/heure de début, durée, niveau. Route pour accéder à l'épreuve via le lien.

```js
// src/controllers/evaluations.controller.js
// createEvaluation(), getEvaluationByLink()
```

**Dépend de** : Étape 7 mergée.

---

### Étape 13 — Système anti-triche (Bah_Bouba)

**Tâche : `feature/anti-cheat`**

    Créer `src/sockets/evaluation.socket.js`. Recevoir l'événement de changement de visibilité depuis le frontend, exclure automatiquement le candidat, attribuer la note 01/10 ou 01/20, notifier l'enseignant en temps réel. Activer la caméras de l'appareil du candidats en question pendant l'évaluation que ça soit dans desktop ou tablette ou android

```js
// src/sockets/evaluation.socket.js
// Gère la détection de triche, l'exclusion automatique et l'alerte enseignant
```

**Dépend de** : Étape 12 mergée. Tâche critique — réservée à Bah_Bouba avec review de LamineDev.

---

### Fin du Module 2 — Ce que nous devons avoir comme resultats pour ce module aussi

- Un quiz solo se corrige automatiquement.
- Un quiz multijoueur fonctionne avec 10 participants simultanés.
- Le système anti-triche exclut un candidat en moins de 2 secondes.
- Déployé en production sur `main`.

---

## MODULE 3 — Engagement *(après Module 2 en production)*

> Durée estimée : 3 à 5 semaines

### Étape 14 — Système de badges automatiques (LamineDev)

**Tâche : `feature/badges-system`**

    Créer la collection `badges` dans Firestore. Implémenter les triggers backend qui attribuent automatiquement un badge à un élève selon des critères définis (ex : 5 quiz réussis, score parfait, 10 cours terminés). Route `GET /api/badges/:userId` pour récupérer les badges d'un utilisateur.

```js
// src/services/badges.service.js
// checkAndAwardBadges() : vérifie les critères et attribue les badges mérités

// src/controllers/badges.controller.js
// getUserBadges() : retourne la liste des badges d'un utilisateur
```

**Critère de validation** : après avoir réussi 5 quiz, un badge "Quiz Master" apparaît automatiquement dans le profil de l'élève. Les badges ne sont attribués qu'une seule fois.

**Dépend de** : Module 2 entièrement déployé en production.

---

### Étape 15 — Génération de certificats PDF (Yassine)

**Tâche : `feature/certificates-pdf`**

    Utiliser `pdfkit` ou `puppeteer` pour générer un certificat PDF personnalisé (nom de l'élève, matière, score, date) après la validation d'un cours ou d'une évaluation. Stocker le PDF sur Cloudinary et enregistrer le lien dans la collection `certifications`.

```js
// src/services/certificate.service.js
// generateCertificate() : génère le PDF et l'upload sur Cloudinary

// src/controllers/certificates.controller.js
// getCertificate() : retourne le lien du certificat d'un utilisateur
```

**Critère de validation** : un élève ayant terminé un cours reçoit un certificat PDF téléchargeable avec son nom et le nom du cours.

**Dépend de** : Étape 7 (cours CRUD) et Étape 10 (quiz solo) mergées.

---

### Étape 16 — Messagerie privée élèves/enseignants (Bah_Bouba)

**Tâche : `feature/messaging`**

    Créer `src/sockets/messaging.socket.js`. Gérer l'envoi et la réception de messages privés en temps réel entre élèves et enseignants via Socket.IO. Stocker les messages dans la collection `messages`. Route `GET /api/messages/:conversationId` pour l'historique.

```js
// src/sockets/messaging.socket.js
// Gère les événements : sendMessage, receiveMessage, markAsRead

// src/controllers/messages.controller.js
// getConversationHistory() : retourne les messages d'une conversation
```

**Critère de validation** : un élève envoie un message à son enseignant, l'enseignant le reçoit en temps réel sans recharger la page. L'historique est persistant.

**Dépend de** : Étape 9 (socket config) mergée. Tâche complexe — réservée à Bah_Bouba.

---

### Étape 17 — Défis 1v1 et tournois (LamineDev + Yassine en binôme)

**Tâche : `feature/defis-tournois`**

    Routes pour créer un défi 1v1 entre deux apprenants sur un quiz existant. Gérer l'acceptation du défi, le déroulement en temps réel via Socket.IO, et la désignation du vainqueur. Stocker les résultats dans la collection `defis`.

```js
// src/sockets/defi.socket.js
// Gère les événements : challengeUser, acceptChallenge, submitAnswer, declareWinner

// src/controllers/defis.controller.js
// createDefi(), getDefiStatus()
```

**Critère de validation** : deux élèves participent à un défi 1v1, le gagnant est désigné automatiquement à la fin et son score est mis à jour.

**Dépend de** : Étape 11 (quiz multijoueur) et Étape 16 mergées.

---

### Étape 18 — Classements globaux et par matière (Yassine)

**Tâche : `feature/leaderboards`**

    Route `GET /api/leaderboard` pour le classement général. Route `GET /api/leaderboard/:subject` pour le classement par matière. Calculer le score cumulatif de chaque élève à partir des `quizResults` et `evalResults`. Résultats paginés par 50.

```js
// src/services/leaderboard.service.js
// computeLeaderboard() : agrège les scores depuis Firestore et trie les résultats

// src/controllers/leaderboard.controller.js
// getGlobalLeaderboard(), getLeaderboardBySubject()
```

**Critère de validation** : le classement global affiche les 50 meilleurs élèves avec leur score total. Le classement par matière filtre correctement.

**Dépend de** : Étape 10 et Étape 12 mergées.

---

### Étape 19 — Notifications push PWA (Bah_Bouba)

**Tâche : `feature/push-notifications`**

    Implémenter le système de notifications push via l'API Web Push (VAPID keys). Stocker les souscriptions des utilisateurs dans Firestore. Envoyer des notifications push lors d'événements clés : nouveau message, badge obtenu, défi reçu, résultat de quiz disponible.

```js
// src/services/push.service.js
// sendPushNotification() : envoie une notification push via web-push

// src/controllers/notifications.controller.js
// subscribeToNotifications(), getNotifications()
```

**Critère de validation** : un élève reçoit une notification push sur son téléphone (même avec l'app fermée) quand son enseignant lui envoie un message.

**Dépend de** : Étape 16 mergée.

---

### Fin du Module 3 — Ce que nous devons avoir comme résultats

- Un élève cumule des badges automatiquement selon ses performances.
- Les certificats PDF sont générables et téléchargeables.
- La messagerie privée fonctionne en temps réel.
- Les défis 1v1 entre apprenants sont opérationnels.
- Les classements global et par matière s'affichent correctement.
- Les notifications push arrivent sur mobile hors-ligne.
- Déployé en production sur `main`.

---

## MODULE 4 — Concours Officiels Ministériels *(après Module 3 en production)*

> Durée estimée : 5 à 8 semaines

### Étape 20 — Création et gestion des concours (LamineDev)

**Tâche : `feature/concours-crud`**

    Routes CRUD pour créer un concours officiel (titre, matière, niveau, région, date/heure, durée). Génération automatique du numéro de candidature unique (UUID region-based). Stocker dans la collection `concours`. Accessible uniquement au rôle ADMIN.

```js
// src/controllers/concours.controller.js
// createConcours(), getConcoursById(), updateConcours(), deleteConcours()

// src/services/concours.service.js
// generateCandidatureNumber() : génère un numéro de candidature unique par région
```

**Critère de validation** : un admin crée un concours régional, chaque candidat inscrit reçoit un numéro de candidature unique au format `REG-2026-XXXXX`.

**Dépend de** : Module 3 entièrement déployé en production.

---

### Étape 21 — Inscription des candidats par région (Yassine)

**Tâche : `feature/concours-inscription`**

    Route `POST /api/concours/:id/inscription` pour inscrire un candidat à un concours par région. Vérifier que la date d'inscription est ouverte, que le candidat n'est pas déjà inscrit, et que sa région est éligible. Envoyer un email de confirmation avec le numéro de candidature.

```js
// src/controllers/concours.controller.js
// inscrireCandidats() : inscrit un élève et lui attribue son numéro de candidature

// src/services/email.service.js
// sendInscriptionConfirmation() : envoie l'email de confirmation avec le numéro
```

**Critère de validation** : un candidat reçoit un email de confirmation avec son numéro de candidature. Tenter de s'inscrire deux fois renvoie une erreur claire.

**Dépend de** : Étape 20 mergée.

---

### Étape 22 — Passage simultané de l'épreuve en temps réel (Bah_Bouba)

**Tâche : `feature/concours-socket`**

    Créer `src/sockets/concours.socket.js`. Gérer les salles Socket.IO par région (ex : room `concours_kalinko_2026`). Synchroniser le démarrage de l'épreuve pour tous les candidats d'une région simultanément. Gérer le timer centralisé côté serveur (non manipulable côté client).

```js
// src/sockets/concours.socket.js
// Gère les événements : joinConcoursRoom, startEpreuve, syncTimer, submitAnswers

// src/services/concours.service.js
// startConcoursForRegion() : déclenche l'épreuve pour tous les candidats d'une room
```

**Critère de validation** : 100 candidats d'une même région reçoivent le signal de démarrage en moins de 500ms. Le timer est identique pour tous et ne peut pas être manipulé côté client.

**Dépend de** : Étape 21 mergée. Tâche critique — réservée à Bah_Bouba.

---

### Étape 23 — Correction automatique + classement régional (Yassine)

**Tâche : `feature/concours-scoring`**

    À la fin du temps imparti, corriger automatiquement les réponses de tous les candidats d'une région. Calculer le classement régional. Identifier les candidats qualifiés pour le niveau national selon un seuil de score défini. Mettre à jour la collection `concours` avec les résultats.

```js
// src/services/scoring.service.js
// calculateConcoursScore() : corrige et note chaque candidat à la fin de l'épreuve

// src/services/concours.service.js
// computeRegionalRanking() : classe les candidats et détermine les qualifiés national
```

**Critère de validation** : après la fin du concours, le classement régional est disponible en moins de 5 secondes. Les candidats qualifiés pour le national sont identifiés automatiquement.

**Dépend de** : Étape 22 mergée.

---

### Étape 24 — Système anti-triche concours (Bah_Bouba + LamineDev en review)

**Tâche : `feature/concours-anti-cheat`**

    Adapter `src/sockets/evaluation.socket.js` pour les concours. Détecter le changement d'onglet, la perte de focus, la tentative de copier-coller. Exclure automatiquement le candidat avec la note `01/20`, notifier l'admin en temps réel. Activation de la caméra obligatoire sur desktop, tablette et Android pendant toute la durée de l'épreuve.

```js
// src/sockets/concours.socket.js
// Gère la détection de triche en concours : exclusion auto + alerte admin en temps réel
```

**Critère de validation** : un candidat qui change d'onglet est exclu en moins de 2 secondes avec la note `01/20`. L'admin voit l'alerte instantanément sur son dashboard.

**Dépend de** : Étape 22 mergée. Tâche critique — review obligatoire de LamineDev avant merge.

---

### Étape 25 — Scalabilité et optimisation (Bah_Bouba)

**Tâche : `feature/concours-scalability`**

    Optimiser l'architecture Socket.IO pour supporter des milliers de candidats simultanés. Utiliser `socket.io-redis` (adapter Redis) pour la scalabilité horizontale. Implémenter un système de queue pour la correction massive des réponses (ex : `bull` ou traitement par batch Firestore).

```js
// src/config/socket.js
// Configuration Redis adapter pour la scalabilité horizontale de Socket.IO

// src/services/concours.service.js
// processAnswersBatch() : traite les réponses par lots pour éviter les timeouts Firestore
```

**Critère de validation** : un test de charge avec 500 connexions simultanées sur le même concours ne provoque aucune erreur ni timeout.

**Dépend de** : Étape 23 mergée. Tâche technique avancée — réservée à Bah_Bouba.

---

### Étape 26 — Export des résultats PDF/Excel (LamineDev)

**Tâche : `feature/concours-export`**

    Route `GET /api/concours/:id/export/pdf` et `GET /api/concours/:id/export/excel` pour exporter le classement complet d'un concours. Utiliser `pdfkit` pour le PDF et `exceljs` pour le fichier Excel. Accessible uniquement au rôle ADMIN.

```js
// src/services/export.service.js
// exportToPDF() : génère le classement en PDF officiel
// exportToExcel() : génère le classement en fichier Excel (.xlsx)

// src/controllers/concours.controller.js
// exportConcoursResults() : route d'export selon le format demandé
```

**Critère de validation** : un admin exporte le classement d'un concours régional en PDF et en Excel avec : numéro de candidature, nom, région, score, rang. Les fichiers s'ouvrent correctement.

**Dépend de** : Étape 23 mergée.

---

### Fin du Module 4 — Ce que nous devons avoir comme résultats

- Un admin peut créer et gérer des concours régionaux et nationaux.
- Les candidats s'inscrivent par région avec un numéro de candidature unique.
- L'épreuve démarre simultanément pour tous les candidats d'une région.
- Le classement régional est calculé automatiquement à la fin.
- Le système anti-triche exclut un candidat en moins de 2 secondes.
- La plateforme supporte des milliers de candidats simultanés sans crash.
- Les résultats sont exportables en PDF et Excel par l'admin.
- Déployé en production sur `main`.

---

## Comment progresser ensemble ?

- **LamineDev** démarre seul sur toute la configuration de base (étape 1)
    pour donner une fondation stable à l'équipe, puis prend des tâches transverses (admin, évaluations, réinitialisation mot de passe).

- **Bah_Bouba** prend les tâches les plus techniques (Socket.IO, anti-triche, 
    sécurité, connexion) et review en priorité les Pull Requests de LamineDev et Yassine.
- **Yassine** prend les tâches d'authentification et de logique métier 
    (inscription, refresh token, quiz solo, CRUD cours).

- En cas de blocage, on en discute ensemble avant de merger — mieux vaut prendre 30 minutes de plus que de pousser du code cassé sur `backend` avec des `CONFLITS`.