# Documentation de Conception des Tests - Expense Tracker

# Introduction

Bienvenue sur le projet **Expense and Income Tracker - Back-End**. Ce système permet de gérer efficacement les utilisateurs et leurs transactions (revenus, dépenses), avec une forte emphase sur la sécurité, la performance et la robustesse cloud.

---

## Objectifs du Projet

- Offrir une API sécurisée pour gérer les utilisateurs, l’authentification et la réinitialisation de mot de passe.
- Permettre la gestion complète des transactions (ajout, suppression, édition, consultation).
- Garantir l’intégrité, la confidentialité et la traçabilité des données financières personnelles.
- Fournir des outils permettant de suivre et d’améliorer les performances du système.

---

## Technologies Utilisées

- **Node.js** : Serveur JavaScript asynchrone, performant et scalable
- **Express.js** : Framework minimaliste pour API REST
- **MongoDB (+ Mongoose ODM)** : Base NoSQL performante pour la gestion des données
- **JWT (JSON Web Token)** : Authentification utilisateur sécurisée
- **Nodemailer** : Notifications email (réinitialisation de mot de passe)
- **Jest** : Framework de tests unitaires/intégration/charge
- **Supertest** : Tests automatisés des endpoints HTTP
- **Postman/Newman** : Scénarios d’API manuels/automatisés

---

## Diagramme de cas d’utilisation

Voici une représentation simplifiée des cas d’utilisation principaux :

```
                                +-----------------+
                                |    Utilisateur  |
                                +--------+--------+
                                         |
      +-------------------------+---------+----------+----------------------+
      |                         |                    |                      |
+-----v------+        +---------v-----+       +------v---------+     +------v------+
| S'inscrire |        | S'authentifier|       | Réinitialiser  |     |  Gérer les  |
|  (register)|        |   (login)     |       |mot de passe    |     |transactions |
+------------+        +---------------+       +----------------+     +----------+--+
                                                                              |
                +--------------------+--------------------------+--------------+-----------+
                |                    |                          |                          |
        +-------v----+        +------v-------+          +-------v------+         +---------v------+
        |Ajouter      |        | Modifier     |          | Supprimer    |         |Lister          |
        |revenu/dép. |        | transaction  |          |transaction   |         |transactions    |
        +------------+        +--------------+          +-------------+         +---------------+
```

---

## 1. Conception des Tests

### Organisation

La stratégie de test est organisée en plusieurs niveaux selon la pyramide de tests :

```
tests/
├── unit/              # Tests unitaires (base de la pyramide)
├── api/               # Tests d'intégration API
├── performance/       # Tests de performance
├── load/              # Tests de charge et stress
├── security/          # Tests de sécurité
└── postman/           # Tests manuels via Postman
```

### Outils Choisis

- **Jest** : Framework de test JavaScript pour tests unitaires et d'intégration
- **Supertest** : Bibliothèque pour tester les APIs HTTP
- **Postman/Newman** : Tests d'API et collection pour tests manuels
- **Coverage** : Mesure de couverture de code intégrée à Jest

### Stratégie de Test

**Approche hybride** combinant :

- **Tests unitaires** (boîte blanche) : Validation du code source
- **Tests d'intégration** (boîte noire) : Validation via scénarios utilisateurs
- **Tests non fonctionnels** : Performance, sécurité, charge
- **Tests manuels** : Validation via Postman

---

## 2. Scénarios de Test Détaillés

### Fonctionnalité 1 : Gestion des Utilisateurs

#### 2.1 Inscription (Register)

**Objectif** : Vérifier la création d'un nouveau compte utilisateur.

**Pré-requis** : Aucun (endpoint public)

**Environnement** : API REST, base de données MongoDB

**Cas de test principaux** :

1. Inscription réussie avec données valides → Token JWT retourné
2. Échec avec email manquant → Erreur 400
3. Échec avec mot de passe trop court → Erreur 400
4. Échec avec emails dupliqués → Erreur 400
5. Validation du format email → Rejet des formats invalides

**Outils** :

- Jest + Supertest (tests automatisés)
- Postman (tests manuels)

**Données de test** :

- Email : `test@example.com`
- Mot de passe : `password123`
- Nom : `Test User`
- Solde initial : `1000 DT`

**Observations** :

- Vérifier la génération du token JWT
- Confirmer le hachage du mot de passe (bcrypt)
- Vérifier l'absence d'exposition de données sensibles

#### 2.2 Connexion (Login)

**Objectif** : Vérifier l'authentification d'un utilisateur existant.

**Pré-requis** : Utilisateur enregistré

**Cas de test principaux** :

1. Connexion réussie avec identifiants valides → Token JWT
2. Échec avec mot de passe incorrect → Erreur 400
3. Échec avec email inexistant → Erreur 400
4. Protection contre les attaques par force brute

**Observations** :

- Temps de réponse < 500ms
- Token JWT valide et non expiré

#### 2.3 Tableau de bord (Dashboard)

**Objectif** : Vérifier l'affichage des informations utilisateur.

**Pré-requis** : Utilisateur connecté (token JWT valide)

**Cas de test principaux** :

1. Accès autorisé avec token valide → Données utilisateur
2. Accès refusé sans token → Erreur 401
3. Accès refusé avec token invalide → Erreur 401
4. Affichage correct du solde utilisateur

---

### Fonctionnalité 2 : Gestion des Transactions

#### 2.1 Ajout de Revenu (Add Income)

**Objectif** : Vérifier l'ajout d'une transaction de revenu et la mise à jour du solde.

**Pré-requis** : Utilisateur connecté, solde initial connu

**Environnement** : API REST, base de données MongoDB

**Cas de test principaux** :

1. Ajout de revenu valide → Transaction créée, solde mis à jour
2. Échec avec montant manquant → Erreur 400
3. Échec avec remarques trop courtes (< 5 caractères) → Erreur 400
4. Échec avec montant négatif → Erreur 400
5. Échec avec montant non numérique → Erreur 400
6. Calcul correct du nouveau solde → Solde initial + montant

**Outils** :

- Jest + Supertest (tests automatisés)
- Postman (tests manuels)

**Données de test** :

- Montant : `500 DT`
- Remarques : `Salaire mensuel`
- Solde initial : `1000 DT`
- Solde attendu : `1500 DT`

**Observations** :

- Vérifier la réactivité de la mise à jour du solde
- Confirmer l'intégrité transactionnelle (rollback en cas d'erreur)
- Vérifier le type de transaction = "income"

#### 2.2 Ajout de Dépense (Add Expense)

**Objectif** : Vérifier l'ajout d'une transaction de dépense et la mise à jour du solde.

**Pré-requis** : Utilisateur connecté, solde suffisant

**Cas de test principaux** :

1. Ajout de dépense valide → Transaction créée, solde décrémenté
2. Validation des montants négatifs → Rejet
3. Calcul correct du nouveau solde → Solde initial - montant
4. Vérification du type de transaction = "expense"

**Données de test** :

- Montant : `100 DT`
- Remarques : `Achat de courses`
- Solde initial : `1000 DT`
- Solde attendu : `900 DT`

**Observations** :

- Vérifier la décrémentation correcte du solde
- Confirmer l'absence de solde négatif non autorisé

#### 2.3 Liste des Transactions (Get Transactions)

**Objectif** : Vérifier la récupération et le filtrage des transactions.

**Pré-requis** : Utilisateur connecté, transactions existantes

**Cas de test principaux** :

1. Récupération de toutes les transactions → Liste complète
2. Filtrage par type "income" → Seulement les revenus
3. Filtrage par type "expense" → Seulement les dépenses
4. Isolation des données utilisateur → Pas d'accès aux transactions d'autres utilisateurs

**Observations** :

- Vérifier la performance avec de nombreuses transactions
- Confirmer le filtrage correct par type
- Vérifier la sécurité (isolation des données)

#### 2.4 Modification de Transaction (Edit Transaction)

**Objectif** : Vérifier la mise à jour d'une transaction existante.

**Pré-requis** : Utilisateur connecté, transaction existante

**Cas de test principaux** :

1. Modification réussie → Transaction mise à jour
2. Échec avec ID de transaction invalide → Erreur 400
3. Échec avec ID de transaction inexistant → Erreur 400
4. Vérification de l'appartenance de la transaction à l'utilisateur

**Observations** :

- Vérifier la mise à jour des remarques
- Confirmer l'intégrité des données

#### 2.5 Suppression de Transaction (Delete Transaction)

**Objectif** : Vérifier la suppression d'une transaction et la mise à jour du solde.

**Pré-requis** : Utilisateur connecté, transaction existante

**Cas de test principaux** :

1. Suppression réussie → Transaction supprimée, solde ajusté
2. Échec avec ID invalide → Erreur 400
3. Échec avec transaction inexistante → Erreur 400
4. Vérification de la mise à jour du solde après suppression

**Observations** :

- Vérifier l'ajustement correct du solde (ajout si revenu, soustraction si dépense)
- Confirmer la suppression définitive de la transaction

---

### Fonctionnalité 3 : Réinitialisation de Mot de Passe

**Objectif** : Vérifier le processus de réinitialisation de mot de passe.

**Pré-requis** : Utilisateur enregistré avec email valide

**Cas de test principaux** :

1. Demande de réinitialisation → Code envoyé par email
2. Réinitialisation réussie avec code valide → Mot de passe changé
3. Échec avec code invalide → Erreur 400
4. Échec avec email inexistant → Erreur 400
5. Validation du nouveau mot de passe (longueur minimale)

**Observations** :

- Vérifier l'envoi de l'email
- Confirmer l'expiration du code de réinitialisation
- Vérifier la sécurité du processus

---

## 3. Couverture des Tests

### Approche Utilisée

#### Boîte Noire (Black Box)

**Localisation** : `tests/api/api.test.js`

- Validation via scénarios utilisateurs sans connaissance du code source
- Tests d'intégration des endpoints API
- Validation des comportements attendus
- **Couverture** : Tous les endpoints API publics et protégés

#### Boîte Blanche (White Box)

**Localisation** : `tests/unit/`

- Validation via accès au code source
- Tests unitaires de chaque composant isolément
- Mocking des dépendances (MongoDB, JWT, etc.)
- **Couverture** : Controllers, middleware, managers

**Exemples de tests boîte blanche** :

- `addExpense.test.js` : Validation de la logique métier
- `auth.test.js` : Validation du middleware d'authentification
- `jwtManager.test.js` : Validation de la génération de tokens

### Méthodes de Mesure

**Couverture de Code** :

```bash
npm test -- --coverage
```

**Métriques mesurées** :

- **Statement Coverage** : Pourcentage de lignes exécutées
- **Branch Coverage** : Pourcentage de branches testées
- **Function Coverage** : Pourcentage de fonctions testées
- **Line Coverage** : Pourcentage de lignes de code testées

**Objectif** : Maintenir une couverture > 80%

**Rapport généré** : `coverage/lcov-report/index.html`

---

## 4. Analyse des Résultats

### Indicateurs de Performance

#### Temps de Réponse

- **Endpoints publics** : < 1000ms
- **Endpoints critiques** (login, dashboard) : < 500ms
- **Endpoints de transaction** : < 1000ms

**Méthode de mesure** : Tests automatisés avec timestamps

#### Débit (Throughput)

- **Charge normale** : 10 requêtes simultanées → 90%+ de succès
- **Charge élevée** : 50 requêtes simultanées → 80%+ de succès
- **Stress** : 100+ requêtes simultanées → 70%+ de succès

**Méthode de mesure** : Tests de charge avec Promise.all()

#### Utilisation des Ressources

- **Mémoire** : Augmentation < 50MB sous charge prolongée
- **CPU** : Pas de surcharge détectée

### Indicateurs de Fiabilité

#### Taux de Succès

- **Tests unitaires** : > 95% de succès
- **Tests d'intégration** : > 90% de succès
- **Tests de charge** : > 70% de succès sous stress

#### Intégrité des Données

- **Transactions** : Aucune perte de données détectée
- **Soldes** : Calculs corrects dans tous les scénarios
- **Isolation** : Pas d'accès croisé aux données utilisateurs

### Indicateurs de Qualité

#### Sécurité

- **Injection** : Protection contre NoSQL injection validée
- **XSS** : Protection contre Cross-Site Scripting validée
- **Authentification** : Tokens JWT sécurisés
- **Validation** : Toutes les entrées validées

#### Maintenabilité

- **Code coverage** : > 80%
- **Tests maintenables** : Structure claire et modulaire
- **Documentation** : Tests documentés avec descriptions claires

### Exemple d'Analyse - Gestion des Transactions

**Scénario** : Ajout de 20 transactions simultanées

**Résultats** :

- ✅ Toutes les transactions créées avec succès
- ✅ Solde mis à jour correctement (1000 + 20×100 = 3000)
- ✅ Temps d'exécution : 2.5 secondes
- ✅ Aucune fuite mémoire détectée
- ✅ Intégrité des données préservée

**Interprétation** :

- Performance acceptable pour charge normale
- Système stable sous charge modérée
- Pas de problèmes d'intégrité détectés

---

## Conclusion

La stratégie de test mise en place couvre :

- ✅ Tests fonctionnels (boîte noire et boîte blanche)
- ✅ Tests non fonctionnels (performance, sécurité, charge)
- ✅ Couverture de code > 80%
- ✅ Validation de toutes les fonctionnalités clés

Les indicateurs de performance, fiabilité et qualité sont mesurés et suivis régulièrement pour garantir la qualité du système.
