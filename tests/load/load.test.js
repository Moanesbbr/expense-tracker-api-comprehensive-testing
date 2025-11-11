// Mock emailManager to prevent actual email sending during tests
jest.mock('../../managers/emailManager', () => {
  return jest.fn().mockResolvedValue(true);
});

/**
 * Load and Stress Tests
 * Tests de charge et stress : vérification des performances en conditions réelles et en pic de trafic
 * 
 * Ces tests simulent :
 * - Charge normale
 * - Pic de trafic
 * - Stress test (charge maximale)
 * - Endurance test (charge prolongée)
 */

const request = require('supertest');
const app = require('../../app');

describe('Load and Stress Tests', () => {
  let authTokens = [];
  const CONCURRENT_USERS_NORMAL = 10;
  const CONCURRENT_USERS_HIGH = 50;
  const CONCURRENT_USERS_STRESS = 100;

  // Ensure JWT secret is set for tests
  beforeAll(() => {
    if (!process.env.jwt_salt) {
      process.env.jwt_salt = 'test_jwt_secret_key_for_load_tests';
    }
  });

  beforeAll(async () => {
    // Créer plusieurs utilisateurs pour les tests de charge
    const userPromises = [];
    for (let i = 0; i < 20; i++) {
      userPromises.push(
        request(app)
          .post('/api/users/register')
          .send({
            name: `Load Test User ${i}`,
            email: `loadtest${Date.now()}_${i}@example.com`,
            password: 'password123',
            confirm_password: 'password123',
            balance: 1000,
          })
      );
    }

    const responses = await Promise.all(userPromises);
    authTokens = responses
      .filter(res => res.status === 201)
      .map(res => res.body.accessToken);
  });

  describe('Normal Load Tests', () => {
    test('Should handle normal concurrent user load (10 users)', async () => {
      const startTime = Date.now();
      const requests = [];

      // Simuler 10 utilisateurs simultanés accédant au dashboard
      for (let i = 0; i < CONCURRENT_USERS_NORMAL; i++) {
        const token = authTokens[i % authTokens.length];
        requests.push(
          request(app)
            .get('/api/users/dashboard')
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // Vérifier que toutes les requêtes ont réussi
      const successCount = responses.filter(res => res.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(CONCURRENT_USERS_NORMAL * 0.9); // 90% de succès minimum

      // Le temps total devrait être raisonnable
      expect(totalTime).toBeLessThan(5000); // 5 secondes maximum
    });

    test('Should handle normal concurrent transaction creation', async () => {
      const startTime = Date.now();
      const requests = [];

      // Simuler 10 utilisateurs créant des transactions simultanément
      for (let i = 0; i < CONCURRENT_USERS_NORMAL; i++) {
        const token = authTokens[i % authTokens.length];
        requests.push(
          request(app)
            .post('/api/transactions/addIncome')
            .set('Authorization', `Bearer ${token}`)
            .send({
              amount: 100 + i,
              remarks: `Load test transaction ${i}`,
            })
        );
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(res => res.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(CONCURRENT_USERS_NORMAL * 0.9);

      expect(totalTime).toBeLessThan(10000); // 10 secondes maximum
    });
  });

  describe('High Load Tests', () => {
    test('Should handle high concurrent user load (50 users)', async () => {
      const startTime = Date.now();
      const requests = [];

      // Simuler 50 utilisateurs simultanés
      for (let i = 0; i < CONCURRENT_USERS_HIGH; i++) {
        const token = authTokens[i % authTokens.length];
        requests.push(
          request(app)
            .get('/api/users/dashboard')
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(res => res.status === 200).length;
      
      // Avec une charge élevée, on accepte au moins 80% de succès
      expect(successCount).toBeGreaterThanOrEqual(CONCURRENT_USERS_HIGH * 0.8);
      
      // Le temps total devrait rester acceptable même sous charge
      expect(totalTime).toBeLessThan(15000); // 15 secondes maximum
    });

    test('Should handle high concurrent transaction operations', async () => {
      const startTime = Date.now();
      const requests = [];

      // Mélanger les opérations : lecture et écriture
      for (let i = 0; i < CONCURRENT_USERS_HIGH; i++) {
        const token = authTokens[i % authTokens.length];
        
        if (i % 3 === 0) {
          // Lecture
          requests.push(
            request(app)
              .get('/api/transactions/')
              .set('Authorization', `Bearer ${token}`)
          );
        } else {
          // Écriture
          requests.push(
            request(app)
              .post('/api/transactions/addIncome')
              .set('Authorization', `Bearer ${token}`)
              .send({
                amount: 100 + i,
                remarks: `High load test transaction ${i}`,
              })
          );
        }
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(res => [200, 201].includes(res.status)).length;
      expect(successCount).toBeGreaterThanOrEqual(CONCURRENT_USERS_HIGH * 0.8);

      expect(totalTime).toBeLessThan(20000); // 20 secondes maximum
    });
  });

  describe('Stress Tests', () => {
    test('Should handle stress load (100 concurrent requests)', async () => {
      const startTime = Date.now();
      const requests = [];

      // Simuler 100 requêtes simultanées
      for (let i = 0; i < CONCURRENT_USERS_STRESS; i++) {
        const token = authTokens[i % authTokens.length];
        requests.push(
          request(app)
            .get('/api/users/dashboard')
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(res => res.status === 200).length;
      
      // Sous stress, on accepte au moins 70% de succès
      expect(successCount).toBeGreaterThanOrEqual(CONCURRENT_USERS_STRESS * 0.7);
      
      // Le système devrait toujours répondre, même si c'est plus lent
      expect(totalTime).toBeLessThan(30000); // 30 secondes maximum
    });

    test('Should maintain data integrity under stress', async () => {
      const token = authTokens[0];
      let initialBalance;

      // Obtenir le solde initial
      const dashboardResponse = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      initialBalance = dashboardResponse.body.data?.balance || 1000;

      // Créer 50 transactions simultanées
      const requests = [];
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .post('/api/transactions/addIncome')
            .set('Authorization', `Bearer ${token}`)
            .send({
              amount: 10,
              remarks: `Stress test transaction ${i}`,
            })
        );
      }

      const responses = await Promise.all(requests);
      const successCount = responses.filter(res => res.status === 200).length;

      // Vérifier l'intégrité des données
      const finalDashboardResponse = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const finalBalance = finalDashboardResponse.body.data?.balance || 1000;
      const expectedBalance = initialBalance + (successCount * 10);

      // Le solde devrait correspondre au nombre de transactions réussies
      expect(finalBalance).toBe(expectedBalance);
    });
  });

  describe('Endurance Tests', () => {
    test('Should handle sustained load over time', async () => {
      const token = authTokens[0];
      const duration = 10000; // 10 secondes
      const interval = 200; // Une requête toutes les 200ms
      const startTime = Date.now();
      let requestCount = 0;
      let successCount = 0;

      while (Date.now() - startTime < duration) {
        const response = await request(app)
          .get('/api/users/dashboard')
          .set('Authorization', `Bearer ${token}`);

        requestCount++;
        if (response.status === 200) {
          successCount++;
        }

        // Attendre avant la prochaine requête
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      // Le taux de succès devrait rester élevé même sur une période prolongée
      const successRate = successCount / requestCount;
      expect(successRate).toBeGreaterThanOrEqual(0.95); // 95% de succès minimum
    });

    test('Should handle rapid sequential requests', async () => {
      const token = authTokens[0];
      const requests = [];

      // Créer 100 requêtes rapides
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .post('/api/transactions/addIncome')
            .set('Authorization', `Bearer ${token}`)
            .send({
              amount: 1,
              remarks: `Rapid request ${i}`,
            })
        );
      }

      const responses = await Promise.all(requests);
      const successCount = responses.filter(res => res.status === 200).length;

      // Le système devrait gérer la plupart des requêtes
      expect(successCount).toBeGreaterThanOrEqual(90); // Au moins 90% de succès
    });
  });

  describe('Peak Traffic Simulation', () => {
    test('Should handle sudden traffic spike', async () => {
      const startTime = Date.now();
      const spikeSize = 200; // Pic de 200 requêtes simultanées
      const requests = [];

      // Simuler un pic soudain de trafic
      for (let i = 0; i < spikeSize; i++) {
        const token = authTokens[i % authTokens.length];
        requests.push(
          request(app)
            .get('/api/users/dashboard')
            .set('Authorization', `Bearer ${token}`)
        );
      }

      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(res => res.status === 200).length;
      
      // Même avec un pic, le système devrait gérer au moins 60% des requêtes
      expect(successCount).toBeGreaterThanOrEqual(spikeSize * 0.6);
      
      // Le système ne devrait pas planter complètement
      expect(totalTime).toBeLessThan(60000); // 1 minute maximum
    });
  });
});

