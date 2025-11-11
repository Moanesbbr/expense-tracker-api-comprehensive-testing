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

  describe('Password Reset Flow', () => {
    let testEmail;
    let resetCode;

    beforeEach(async () => {
      // Register a user for password reset tests
      const userData = {
        name: 'Password Reset Test User',
        email: `passwordreset${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      testEmail = userData.email;

      await request(app)
        .post('/api/users/register')
        .send(userData);
    });

    test('POST /api/users/forgotpw - Should send reset code successfully', async () => {
      const response = await request(app)
        .post('/api/users/forgotpw')
        .send({ email: testEmail })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Reset code sent to email successfully!');
    });

    test('POST /api/users/forgotpw - Should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/users/forgotpw')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
      expect(response.body).toHaveProperty('error', 'Email is required!');
    });

    test('POST /api/users/forgotpw - Should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/users/forgotpw')
        .send({ email: 'nonexistent@example.com' })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('POST /api/users/resetpw - Should fail with missing reset code', async () => {
      const response = await request(app)
        .post('/api/users/resetpw')
        .send({
          email: testEmail,
          new_password: 'newpassword123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('POST /api/users/resetpw - Should fail with short password', async () => {
      const response = await request(app)
        .post('/api/users/resetpw')
        .send({
          email: testEmail,
          new_password: '1234',
          reset_code: '12345',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });
  });

  describe('Transaction Edit and Delete', () => {
    let testAuthToken;
    let testTransactionId;

    beforeEach(async () => {
      // Register user and get token
      const userData = {
        name: 'Edit Delete Test User',
        email: `editdelete${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData);

      testAuthToken = registerResponse.body.accessToken;

      // Create a transaction to edit/delete
      const expenseResponse = await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ amount: 100, remarks: 'Test expense for editing' });

      // Get transactions to find the ID
      const transactionsResponse = await request(app)
        .get('/api/transactions/')
        .set('Authorization', `Bearer ${testAuthToken}`);

      if (Array.isArray(transactionsResponse.body.data) && transactionsResponse.body.data.length > 0) {
        testTransactionId = transactionsResponse.body.data[0]._id;
      }
    });

    test('PATCH /api/transactions/ - Should edit transaction successfully', async () => {
      if (!testTransactionId) {
        // If we couldn't get transaction ID, skip this test
        return;
      }

      const response = await request(app)
        .patch('/api/transactions/')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({
          transaction_id: testTransactionId,
          remarks: 'Updated remarks for transaction',
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Transaction updated successfully!');
    });

    test('PATCH /api/transactions/ - Should fail with missing transaction_id', async () => {
      const response = await request(app)
        .patch('/api/transactions/')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({
          remarks: 'Updated remarks',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('PATCH /api/transactions/ - Should fail with invalid transaction_id', async () => {
      const response = await request(app)
        .patch('/api/transactions/')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({
          transaction_id: 'invalid_id',
          remarks: 'Updated remarks',
        })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('DELETE /api/transactions/:transaction_id - Should delete transaction successfully', async () => {
      if (!testTransactionId) {
        // If we couldn't get transaction ID, skip this test
        return;
      }

      const response = await request(app)
        .delete(`/api/transactions/${testTransactionId}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Deleted successfully!');
    });

    test('DELETE /api/transactions/:transaction_id - Should fail with invalid transaction_id', async () => {
      const response = await request(app)
        .delete('/api/transactions/invalid_id')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('DELETE /api/transactions/:transaction_id - Should fail with non-existent transaction', async () => {
      // Use a valid MongoDB ObjectId format but non-existent ID
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/transactions/${fakeId}`)
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('PATCH /api/transactions/ - Should fail without authentication', async () => {
      const response = await request(app)
        .patch('/api/transactions/')
        .send({
          transaction_id: testTransactionId || '507f1f77bcf86cd799439011',
          remarks: 'Updated remarks',
        })
        .expect(401);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('DELETE /api/transactions/:transaction_id - Should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/transactions/${testTransactionId || '507f1f77bcf86cd799439011'}`)
        .expect(401);

      expect(response.body).toHaveProperty('status', 'failed');
    });
  });

  describe('Additional Transaction Tests', () => {
    let testAuthToken;

    beforeEach(async () => {
      const userData = {
        name: 'Additional Test User',
        email: `additional${Date.now()}@example.com`,
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      const registerResponse = await request(app)
        .post('/api/users/register')
        .send(userData);

      testAuthToken = registerResponse.body.accessToken;
    });

    test('POST /api/transactions/addIncome - Should fail with missing remarks', async () => {
      const response = await request(app)
        .post('/api/transactions/addIncome')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ amount: 500 })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('POST /api/transactions/addIncome - Should fail with short remarks', async () => {
      const response = await request(app)
        .post('/api/transactions/addIncome')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ amount: 500, remarks: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('POST /api/transactions/addExpense - Should fail with short remarks', async () => {
      const response = await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ amount: 100, remarks: 'Test' })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('POST /api/transactions/addExpense - Should fail with negative amount', async () => {
      const response = await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ amount: -100, remarks: 'Grocery shopping expense' })
        .expect(400);

      expect(response.body).toHaveProperty('status', 'failed');
    });

    test('GET /api/transactions/?transaction_type=expense - Should filter expense transactions', async () => {
      // Add transactions
      await request(app)
        .post('/api/transactions/addIncome')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ amount: 500, remarks: 'Salary payment' });

      await request(app)
        .post('/api/transactions/addExpense')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .send({ amount: 100, remarks: 'Grocery shopping' });

      const response = await request(app)
        .get('/api/transactions/?transaction_type=expense')
        .set('Authorization', `Bearer ${testAuthToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'success');
      if (Array.isArray(response.body.data)) {
        response.body.data.forEach(transaction => {
          expect(transaction.transaction_type).toBe('expense');
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

