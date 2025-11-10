/**
 * API Integration Tests
 * Black-box testing approach using Supertest
 * 
 * Note: These tests require the server to be running
 * or can be run with a test database
 */

const request = require('supertest');
const app = require('../../app');

describe('API Integration Tests', () => {
  let authToken;
  let userId;
  let transactionId;

  describe('User Registration', () => {
    test('POST /api/users/register - Should register user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.status).toBe('User registered successfully!');
      expect(response.body.accessToken).toBeDefined();

      authToken = response.body.accessToken;
    });

    test('POST /api/users/register - Should fail with missing email', async () => {
      const userData = {
        name: 'Test User',
        password: 'password123',
        confirm_password: 'password123',
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/users/register - Should fail with short password', async () => {
      const userData = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: '1234',
        confirm_password: '1234',
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });
  });

  describe('User Login', () => {
    test('POST /api/users/login - Should login successfully', async () => {
      // First register a user
      const userData = {
        name: 'Login Test User',
        email: `logintest${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      await request(app)
        .post('/api/users/register')
        .send(userData);

      // Then login
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('message', 'User logged in successfully!');

      authToken = response.body.accessToken;
    });

    test('POST /api/users/login - Should fail with wrong password', async () => {
      const userData = {
        name: 'Login Test User',
        email: `logintest${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      await request(app)
        .post('/api/users/register')
        .send(userData);

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: userData.email,
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });
  });

  describe('Protected Routes - Authentication', () => {
    test('GET /api/users/dashboard - Should fail without token', async () => {
      const response = await request(app)
        .get('/api/users/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('status', 'failed');
      expect(response.body).toHaveProperty('message', 'Unauthorized!');
    });

    test('GET /api/users/dashboard - Should succeed with valid token', async () => {
      // First register and get token
      const userData = {
        name: 'Dashboard Test User',
        email: `dashboard${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData);

      const token = registerResponse.body.accessToken;

      const response = await request(app)
        .get('/api/users/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
    });
  });

  describe('Transaction Management', () => {
    beforeEach(async () => {
      // Register user and get token before each test
      const userData = {
        name: 'Transaction Test User',
        email: `transaction${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData);

      authToken = registerResponse.body.accessToken;
    });

    test('POST /api/transactions/addIncome - Should add income successfully', async () => {
      const incomeData = {
        amount: 500,
        remarks: 'Salary payment received',
      };

      const response = await request(app)
        .post('/api/transactions/addIncome')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incomeData)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Income added successfully!');
    });

    test('POST /api/transactions/addExpense - Should add expense successfully', async () => {
      const expenseData = {
        amount: 100,
        remarks: 'Grocery shopping expense',
      };

      const response = await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('message', 'Expense added successfully!');
    });

    test('POST /api/transactions/addExpense - Should fail with missing amount', async () => {
      const expenseData = {
        remarks: 'Grocery shopping expense',
      };

      const response = await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('GET /api/transactions/ - Should get all transactions', async () => {
      // First add some transactions
      await request(app)
        .post('/api/transactions/addIncome')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 500, remarks: 'Salary payment' });

      await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100, remarks: 'Grocery shopping' });

      const response = await request(app)
        .get('/api/transactions/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
    });

    test('GET /api/transactions/?transaction_type=income - Should filter income transactions', async () => {
      // Add transactions
      await request(app)
        .post('/api/transactions/addIncome')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 500, remarks: 'Salary payment' });

      await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100, remarks: 'Grocery shopping' });

      const response = await request(app)
        .get('/api/transactions/?transaction_type=income')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      if (Array.isArray(response.body.data)) {
        response.body.data.forEach(transaction => {
          expect(transaction.transaction_type).toBe('income');
        });
      }
    });
  });

  describe('Error Handling', () => {
    test('GET /api/nonexistent - Should return 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('status', 'failed');
      expect(response.body).toHaveProperty('message', 'Error 404 not found');
    });
  });
});

