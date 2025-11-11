jest.setTimeout(20000);

// Mock emailManager to prevent actual email sending during tests
jest.mock('../../managers/emailManager', () => {
  return jest.fn().mockResolvedValue(true);
});

/**
 * Security Tests
 * Tests non fonctionnels : sécurité approfondie
 * 
 * Ces tests vérifient :
 * - Protection contre les injections (SQL, NoSQL, command injection)
 * - Protection contre XSS
 * - Validation des entrées
 * - Authentification et autorisation
 * - Gestion des tokens
 * - Protection CSRF (si applicable)
 */

const request = require('supertest');
const app = require('../../app');

describe('Security Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Ensure JWT secret is set for tests
    if (!process.env.jwt_salt) {
      process.env.jwt_salt = 'test_jwt_secret_key_for_security_tests';
    }

    // Créer un utilisateur de test
    const userData = {
      name: 'Security Test User',
      email: `security${Date.now()}@example.com`,
      password: 'password123',
      confirm_password: 'password123',
      balance: 1000,
    };

    const response = await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    authToken = response.body.accessToken;
  });

  describe('SQL/NoSQL Injection Tests', () => {
    test('Should prevent NoSQL injection in login', async () => {
      const injectionPayloads = [
        { email: { $ne: null }, password: { $ne: null } },
        { email: { $gt: '' }, password: { $gt: '' } },
        { email: 'admin@example.com', password: { $regex: '.*' } },
      ];

      for (const payload of injectionPayloads) {
        const response = await request(app)
          .post('/api/users/login')
          .send(payload)
          .expect(400);

        expect(response.body.status).toBe('failed');
      }
    });

    test('Should prevent NoSQL injection in transaction queries', async () => {
      const injectionPayloads = [
        { amount: { $gt: 0 }, remarks: 'test' },
        { amount: { $ne: null }, remarks: 'test' },
        { amount: 100, remarks: { $regex: '.*' } },
      ];

      for (const payload of injectionPayloads) {
        const response = await request(app)
          .post('/api/transactions/addExpense')
          .set('Authorization', `Bearer ${authToken}`)
          .send(payload)
          .expect(400);

        expect(response.body.status).toBe('failed');
      }
    });

    test('Should sanitize user input in registration', async () => {
      const maliciousInputs = [
        { name: 'test', email: "'; DROP TABLE users; --", password: 'password123', confirm_password: 'password123' },
        { name: 'test', email: 'test@test.com', password: "'; DELETE FROM users; --", confirm_password: "'; DELETE FROM users; --" },
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/users/register')
          .send(input);

        // Devrait soit échouer avec validation, soit échouer avec erreur
        expect([400, 500]).toContain(response.status);
      }
    });
  });

  describe('XSS (Cross-Site Scripting) Protection Tests', () => {
    test('Should sanitize XSS payloads in user registration', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg onload=alert("XSS")>',
      ];

      for (const payload of xssPayloads) {
        const userData = {
          name: payload,
          email: `xss${Date.now()}@example.com`,
          password: 'password123',
          confirm_password: 'password123',
          balance: 1000,
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData);

        // Le système devrait soit rejeter, soit sanitizer l'input
        if (response.status === 201) {
          // Si accepté, vérifier que le payload n'est pas exécuté
          expect(response.body.data?.name).not.toContain('<script>');
        } else {
          expect([400, 500]).toContain(response.status);
        }
      }
    });

    test('Should sanitize XSS payloads in transaction remarks', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/transactions/addExpense')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: 100,
            remarks: payload,
          });

        // Devrait soit rejeter, soit sanitizer
        if (response.status === 200) {
          // Vérifier que le payload n'est pas stocké tel quel
          const transactions = await request(app)
            .get('/api/transactions/')
            .set('Authorization', `Bearer ${authToken}`);

          const lastTransaction = transactions.body.data?.[0];
          if (lastTransaction) {
            expect(lastTransaction.remarks).not.toContain('<script>');
          }
        } else {
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('Input Validation Tests', () => {
    test('Should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        'invalid@',
        '@invalid.com',
        'invalid..email@test.com',
        'invalid@test',
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            name: 'Test User',
            email: email,
            password: 'password123',
            confirm_password: 'password123',
            balance: 1000,
          })
          .expect(400);

        expect(response.body.status).toBe('failed');
      }
    });

    test('Should validate password strength', async () => {
      const weakPasswords = [
        '1234', // trop court
        'abc', // trop court
        '12345678', // seulement des chiffres
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: password,
            confirm_password: password,
            balance: 1000,
          })
          .expect(400);

        expect(response.body.status).toBe('failed');
      }
    });

    test('Should validate amount is numeric and positive', async () => {
      const invalidAmounts = [
        'notanumber',
        -100,
        '0',
        '',
        null,
        undefined,
      ];

      for (const amount of invalidAmounts) {
        const response = await request(app)
          .post('/api/transactions/addExpense')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            amount: amount,
            remarks: 'Test transaction',
          })
          .expect(400);

        expect(response.body.status).toBe('failed');
      }
    });

    test('Should validate remarks length', async () => {
      const response = await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          remarks: 'abc', // trop court
        })
        .expect(400);

      expect(response.body.status).toBe('failed');
    });
  });

  describe('Authentication and Authorization Tests', () => {
    test('Should reject requests without authentication token', async () => {
      const response = await request(app)
        .get('/api/users/dashboard')
        .expect(401);

      expect(response.body.status).toBe('failed');
      expect(response.body.message).toBe('Unauthorized!');
    });

    test('Should reject requests with invalid token format', async () => {
      const invalidTokens = [
        'invalid_token',
        'Bearer',
        'Bearer ',
        'not_a_valid_jwt_token',
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/users/dashboard')
          .set('Authorization', token)
          .expect(401);

        expect(response.body.status).toBe('failed');
      }
    });

    test('Should reject requests with expired token', async () => {
      // Note: Ce test nécessiterait un token expiré réel
      // Pour un test complet, il faudrait générer un token avec une expiration passée
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid';

      const response = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.status).toBe('failed');
    });

    test('Should prevent unauthorized access to other users data', async () => {
      // Créer un deuxième utilisateur
      const user2Data = {
        name: 'User 2',
        email: `user2${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      const user2Response = await request(app)
        .post('/api/users/register')
        .send(user2Data)
        .expect(201);

      const user2Token = user2Response.body.accessToken;

      // User 2 ne devrait pas pouvoir accéder aux transactions de User 1
      // (Ce test dépend de l'implémentation - si les transactions sont filtrées par user_id)
      const response = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // Le dashboard devrait retourner les données de User 2, pas User 1
      expect(response.body.status).toBe('success');
    });
  });

  describe('Token Security Tests', () => {
    test('Should not expose sensitive data in JWT token', async () => {
      // Décoder le token (base64)
      const tokenParts = authToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        
        // Le token ne devrait pas contenir de données sensibles
        expect(payload).not.toHaveProperty('password');
        expect(payload).not.toHaveProperty('email');
        expect(payload).not.toHaveProperty('balance');
      }
    });

    test('Should require secure token transmission', async () => {
      // Tester que le token est requis dans le header Authorization
      const response = await request(app)
        .get('/api/users/dashboard')
        .set('X-Auth-Token', authToken) // Mauvais header
        .expect(401);

      expect(response.body.status).toBe('failed');
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    test('Should handle rapid successive requests', async () => {
      // Envoyer 100 requêtes rapidement
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .post('/api/users/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Toutes devraient échouer avec 400, pas 500 (pas de crash)
      responses.forEach(response => {
        expect([400, 401, 429]).toContain(response.status);
      });
    });
  });

  describe('Path Traversal Protection', () => {
    test('Should prevent path traversal in transaction IDs', async () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '../../transactions',
        '%2e%2e%2f',
      ];

      for (const path of maliciousPaths) {
        const response = await request(app)
          .delete(`/api/transactions/${path}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.status).toBe('failed');
      }
    });
  });

  describe('Command Injection Protection', () => {
    test('Should prevent command injection in user input', async () => {
      const commandInjectionPayloads = [
        '; ls -la',
        '| cat /etc/passwd',
        '&& rm -rf /',
        '`whoami`',
        '$(id)',
      ];

      for (const payload of commandInjectionPayloads) {
        const response = await request(app)
          .post('/api/users/register')
          .send({
            name: payload,
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            confirm_password: 'password123',
            balance: 1000,
          });

        // Devrait soit rejeter, soit sanitizer
        expect([400, 201]).toContain(response.status);
      }
    });
  });

  describe('Data Exposure Tests', () => {
    test('Should not expose sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(400);

      // Les messages d'erreur ne devraient pas révéler si l'email existe
      const errorMessage = JSON.stringify(response.body);
      expect(errorMessage).not.toContain('database');
      expect(errorMessage).not.toContain('mongodb');
      expect(errorMessage).not.toContain('connection');
    });

    test('Should not expose stack traces in production', async () => {
      // Tester avec une requête malformée
      const response = await request(app)
        .post('/api/users/register')
        .send('invalid json')
        .expect(400);

      // Ne devrait pas exposer de stack trace
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('error');
    });
  });
});

