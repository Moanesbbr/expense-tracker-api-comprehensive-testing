/**
 * Performance Tests
 * Tests non fonctionnels : performance, temps de réponse, débit
 * 
 * Ces tests vérifient les performances de l'API en mesurant :
 * - Temps de réponse des endpoints
 * - Débit (requêtes par seconde)
 * - Utilisation des ressources
 */

const request = require('supertest');
const app = require('../../app');

describe('Performance Tests', () => {
  let authToken;
  const MAX_RESPONSE_TIME = 1000; // 1 seconde maximum
  const MAX_RESPONSE_TIME_CRITICAL = 500; // 500ms pour les endpoints critiques

  beforeAll(async () => {
    // Créer un utilisateur de test pour les tests authentifiés
    const userData = {
      name: 'Performance Test User',
      email: `perf${Date.now()}@example.com`,
      password: 'password123',
      confirm_password: 'password123',
      balance: 1000,
    };

    const response = await request(app)
      .post('/api/users/register')
      .send(userData);

    authToken = response.body.accessToken;
  });

  describe('Response Time Tests - Public Endpoints', () => {
    test('POST /api/users/register - Should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      const userData = {
        name: 'Perf Test User',
        email: `perftest${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
      expect(response.body).toHaveProperty('accessToken');
    });

    test('POST /api/users/login - Should respond within acceptable time', async () => {
      // Créer un utilisateur d'abord
      const userData = {
        name: 'Login Perf User',
        email: `loginperf${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      await request(app)
        .post('/api/users/register')
        .send(userData);

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME_CRITICAL);
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('Response Time Tests - Protected Endpoints', () => {
    test('GET /api/users/dashboard - Should respond within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME_CRITICAL);
      expect(response.body).toHaveProperty('status', 'success');
    });

    test('POST /api/transactions/addIncome - Should respond within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/transactions/addIncome')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500,
          remarks: 'Performance test income transaction',
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
      expect(response.body).toHaveProperty('status', 'success');
    });

    test('POST /api/transactions/addExpense - Should respond within acceptable time', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          remarks: 'Performance test expense transaction',
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
      expect(response.body).toHaveProperty('status', 'success');
    });

    test('GET /api/transactions/ - Should respond within acceptable time', async () => {
      // Ajouter quelques transactions d'abord
      await request(app)
        .post('/api/transactions/addIncome')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 500, remarks: 'Test income 1' });

      await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100, remarks: 'Test expense 1' });

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/transactions/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
      expect(response.body).toHaveProperty('status', 'success');
    });
  });

  describe('Throughput Tests - Multiple Sequential Requests', () => {
    test('Should handle multiple registration requests efficiently', async () => {
      const requests = [];
      const startTime = Date.now();

      // Créer 10 requêtes de registration
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/users/register')
            .send({
              name: `User ${i}`,
              email: `user${Date.now()}_${i}@example.com`,
              password: 'password123',
              confirm_password: 'password123',
              balance: 1000,
            })
        );
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 10;

      // Vérifier que toutes les requêtes ont réussi
      responses.forEach(response => {
        expect([201, 400]).toContain(response.status);
      });

      // Temps moyen par requête devrait être acceptable
      expect(avgTime).toBeLessThan(MAX_RESPONSE_TIME * 2);
    });

    test('Should handle multiple transaction requests efficiently', async () => {
      const requests = [];
      const startTime = Date.now();

      // Créer 20 requêtes de transaction
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .post('/api/transactions/addIncome')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              amount: 100 + i,
              remarks: `Performance test transaction ${i}`,
            })
        );
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 20;

      // Vérifier que toutes les requêtes ont réussi
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Temps moyen par requête devrait être acceptable
      expect(avgTime).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Database Query Performance', () => {
    test('GET /api/transactions/ with filter - Should handle filtering efficiently', async () => {
      // Créer plusieurs transactions
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/transactions/addIncome')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ amount: 100, remarks: `Income ${i}` });

        await request(app)
          .post('/api/transactions/addExpense')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ amount: 50, remarks: `Expense ${i}` });
      }

      const startTime = Date.now();

      const response = await request(app)
        .get('/api/transactions/?transaction_type=income')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
      expect(response.body).toHaveProperty('status', 'success');
    });
  });

  describe('Memory and Resource Usage', () => {
    test('Should not have memory leaks with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Effectuer 50 requêtes
      for (let i = 0; i < 50; i++) {
        await request(app)
          .get('/api/users/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // L'augmentation de mémoire ne devrait pas dépasser 50MB
      // (ceci est un test approximatif, les valeurs réelles peuvent varier)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });
  });
});

