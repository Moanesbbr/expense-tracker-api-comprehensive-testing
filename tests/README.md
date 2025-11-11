# Guide des Tests

Ce document décrit la structure et les types de tests disponibles dans le projet.

## Structure des Tests

```
tests/
├── api/              # Tests d'intégration API (Boîte noire)
├── unit/             # Tests unitaires (Boîte blanche)
├── performance/     # Tests de performance
├── load/             # Tests de charge et stress
├── security/         # Tests de sécurité approfondis
└── postman/          # Collection Postman
```

## Types de Tests

### 1. Tests Fonctionnels ✅

**Localisation:** `tests/api/`, `tests/unit/`

- **Tests d'intégration API** (`tests/api/api.test.js`)

  - Approche boîte noire
  - Validation via scénarios utilisateurs
  - Tests de tous les endpoints

- **Tests unitaires** (`tests/unit/`)
  - Approche boîte blanche
  - Validation via accès au code source
  - Tests de chaque composant isolément

### 2. Tests Non Fonctionnels ✅

**Localisation:** `tests/performance/`, `tests/load/`, `tests/security/`

#### Tests de Performance (`tests/performance/performance.test.js`)

- Temps de réponse des endpoints
- Débit (requêtes par seconde)
- Utilisation des ressources (mémoire)
- Performance des requêtes de base de données

**Exécution:**

```bash
npm run test:performance
```

#### Tests de Charge et Stress (`tests/load/load.test.js`)

- Charge normale (10 utilisateurs simultanés)
- Charge élevée (50 utilisateurs simultanés)
- Stress test (100+ utilisateurs simultanés)
- Tests d'endurance (charge prolongée)
- Simulation de pic de trafic

**Exécution:**

```bash
npm run test:load
```

#### Tests de Sécurité (`tests/security/security.test.js`)

- Protection contre les injections (SQL, NoSQL, command injection)
- Protection contre XSS (Cross-Site Scripting)
- Validation des entrées
- Authentification et autorisation
- Sécurité des tokens JWT
- Protection contre les attaques par force brute
- Protection contre le path traversal
- Prévention de l'exposition de données sensibles

**Exécution:**

```bash
npm run test:security
```

### 3. Boîte Noire ✅

**Localisation:** `tests/api/api.test.js`

Tests qui valident le comportement de l'API sans connaissance de l'implémentation interne.

### 4. Boîte Blanche ✅

**Localisation:** `tests/unit/`

Tests qui valident l'implémentation interne avec accès au code source.

### 5. Compatibilité Multi-Navigateurs ❌

**Non applicable** - Ce projet est une API backend (Node.js/Express), pas une application frontend.

### 6. Tests de Charge et Stress ✅

**Localisation:** `tests/load/load.test.js`

Voir section "Tests Non Fonctionnels" ci-dessus.

## Commandes de Test

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration API uniquement
npm run test:api

# Tests de performance
npm run test:performance

# Tests de charge et stress
npm run test:load

# Tests de sécurité
npm run test:security

# Tous les tests non fonctionnels
npm run test:non-functional

# Tests avec couverture de code
npm test -- --coverage

# Tests en mode watch
npm run test:watch
```

## Métriques de Performance

Les tests de performance vérifient que :

- Les endpoints publics répondent en moins de **1 seconde**
- Les endpoints critiques répondent en moins de **500ms**
- Le système peut gérer **10+ requêtes simultanées** sans dégradation
- L'utilisation mémoire reste stable sous charge

## Métriques de Charge

Les tests de charge vérifient que :

- **Charge normale (10 utilisateurs):** 90%+ de succès
- **Charge élevée (50 utilisateurs):** 80%+ de succès
- **Stress (100+ utilisateurs):** 70%+ de succès
- Le système maintient l'intégrité des données sous stress

## Bonnes Pratiques

1. **Exécuter les tests avant chaque commit**
2. **Vérifier la couverture de code** avec `npm test -- --coverage`
3. **Exécuter les tests de sécurité** régulièrement
4. **Surveiller les métriques de performance** lors des changements
5. **Exécuter les tests de charge** avant les déploiements majeurs

## Notes Importantes

- Les tests de charge peuvent prendre plusieurs minutes à s'exécuter
- Certains tests nécessitent une connexion à la base de données
- Les tests de sécurité peuvent échouer si de nouvelles vulnérabilités sont introduites
- Les métriques de performance peuvent varier selon l'environnement

## Dépannage

Si les tests échouent :

1. Vérifier que la base de données est accessible
2. Vérifier que les variables d'environnement sont configurées
3. Vérifier que le serveur peut être démarré
4. Consulter les logs pour plus de détails
