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

## MODULE 4 — Scalabilité, Sécurité & Supervision 🚀 *(Spécialisation Djangou V1 Finale)*

> Durée estimée : 3 à 4 semaines
> *Note : L'intégration d'un portail dédié au Ministère de l'Éducation pour les concours officiels a été scindée et sera développée dans un projet distinct (Djangou V2).*

### Étape 20 — Supervision WebRTC (LamineDev + Bah_Bouba)

**Tâche : `feature/webrtc-supervision`**

    Implémenter la vidéo-surveillance en direct pendant les évaluations et les quiz importants.
    - Demander l'autorisation caméra `getUserMedia` côté Frontend.
    - Utiliser WebRTC / Socket.IO pour streamer ou envoyer des "snapshots" (photos toutes les X secondes) vers le Dashboard enseignant.
    - Le professeur voit une grille en temps réel de tous les élèves en train de composer.

```js
// src/sockets/supervision.socket.js
// Gère l'échange de signaux WebRTC (offers/answers/ice-candidates) ou snapshots
```

**Critère de validation** : un enseignant qui lance une évaluation voit les visages des étudiants en direct. Si un étudiant quitte l'onglet, sa bordure devient rouge.

**Dépend de** : Module 3 entièrement déployé en production.

---

### Étape 21 — Correction Massive & Traitement par Lots (Yassine)

**Tâche : `feature/mass-scoring`**

    Optimiser le moteur de correction (`scoring.service.js`) pour supporter des évaluations massives (des milliers d'étudiants).
    - Mettre en place un système de traitement par Queue (ex: `bullmq` avec Redis) ou des batches Firestore (limités à 500 opérations) pour éviter les timeouts lors de la soumission de 5000 copies d'un coup.

```js
// src/services/scoring.queue.js
// processAnswersBatch(), calcule silencieusement et massivement
```

**Critère de validation** : terminer une évaluation de 1000 élèves ne bloque pas le serveur Node.js et les résultats sont disponibles en moins d'une minute de manière fiable.

**Dépend de** : Étape 20 mergée.

---

### Étape 22 — Scalabilité Horizontale Socket.IO (Bah_Bouba)

**Tâche : `feature/socket-redis-adapter`**

    Préparer notre serveur temps réel à encaisser des milliers de connexions simultanées, utile pour les gros tournois ou évaluations de masse.
    - Installer et configurer `@socket.io/redis-adapter` pour relier plusieurs processus Node.js s'ils tournent sur plusieurs serveurs (ou instances Render).

```js
// src/config/socket.js
// Ajout du RedisAdapter (pub/sub)
```

**Critère de validation** : un test de charge avec 500+ connexions simultanées via Artillery ou un outil de test Socket.IO passe avec succès.

**Dépend de** : Étape 21 mergée. Tâche technique critique — réservée à Bah_Bouba.

---

### Étape 23 — Export Officiel PDF/Excel (LamineDev)

**Tâche : `feature/eval-export`**

    Route `GET /api/evaluations/:id/export/pdf` et `GET /api/evaluations/:id/export/excel`.
    - Permettre au professeur de télécharger le classement définitif, avec noms, scores et alertes de triche en fichier physique (utilisable comme PV).

```js
// src/services/export.service.js
// exportToPDF() : génère le classement en PDF officiel
// exportToExcel() : génère le classement en fichier Excel (.xlsx)
```

**Critère de validation** : un enseignant clique sur un bouton et reçoit un fichier Excel bien formaté avec la note de tous ses élèves.

**Dépend de** : Étape 22 mergée.

---

### Fin du Module 4 (V1 COMPLETE) — Résultat Djangou ultime

- La plateforme peut gérer des universités entières simultanément sans crash.
- La triche est traquée visuellement et automatiquement signalée.
- Les professeurs ont une maîtrise et une visibilité parfaite sur les étudiants à distance (WebRTC).
- Toutes les données sont exportables proprement.
- Déployé en production sur `main`. Djangou V1 est prêt à être commercialisé massivement !

---

## Comment progresser ensemble ?

- **LamineDev** démarre seul sur toute la configuration de base (étape 1)
    pour donner une fondation stable à l'équipe, puis prend des tâches transverses (admin, évaluations, réinitialisation mot de passe).

- **Bah_Bouba** prend les tâches les plus techniques (Socket.IO, anti-triche, 
    sécurité, connexion) et review en priorité les Pull Requests de LamineDev et Yassine.
- **Yassine** prend les tâches d'authentification et de logique métier 
    (inscription, refresh token, quiz solo, CRUD cours).

- En cas de blocage, on en discute ensemble avant de merger — mieux vaut prendre 30 minutes de plus que de pousser du code cassé sur `backend` avec des `CONFLITS`.