/**
 * Unit Tests for Add Expense Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const validator = require('validator');
const addExpense = require('../../modules/transactions/controllers/addExpense');

// Mock dependencies
jest.mock('mongoose');
jest.mock('validator');

describe('Add Expense', () => {
  let req, res;
  let mockUsersModel, mockTransactionsModel;

  beforeEach(() => {
    req = {
      body: {},
      user: { _id: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockUsersModel = {
      updateOne: jest.fn().mockResolvedValue({}),
    };

    mockTransactionsModel = {
      create: jest.fn().mockResolvedValue({
        _id: 'trans123',
        user_id: 'user123',
        amount: 100,
        remarks: 'Test expense',
        transaction_type: 'expense',
      }),
    };

    mongoose.model = jest.fn((modelName) => {
      if (modelName === 'users') return mockUsersModel;
      if (modelName === 'transactions') return mockTransactionsModel;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Expense Addition', () => {
    test('should add expense successfully with valid data', async () => {
      req.body = {
        amount: 100,
        remarks: 'Test expense description',
      };

      validator.isNumeric.mockReturnValue(true);

      await addExpense(req, res);

      expect(validator.isNumeric).toHaveBeenCalledWith('100');
      expect(mockTransactionsModel.create).toHaveBeenCalledWith({
        user_id: 'user123',
        amount: 100,
        remarks: 'Test expense description',
        transaction_type: 'expense',
      });
      expect(mockUsersModel.updateOne).toHaveBeenCalledWith(
        { _id: 'user123' },
        { $inc: { balance: -100 } },
        { runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Expense added successfully!',
      });
    });
  });

  describe('Validation Errors', () => {
    test('should throw error when amount is missing', async () => {
      req.body = {
        remarks: 'Test expense description',
      };

      await expect(addExpense(req, res)).rejects.toBe('Amount is required!');
    });

    test('should throw error when remarks is missing', async () => {
      req.body = {
        amount: 100,
      };

      await expect(addExpense(req, res)).rejects.toBe('Remarks is required!');
    });

    test('should throw error when remarks is too short', async () => {
      req.body = {
        amount: 100,
        remarks: 'Test',
      };

      await expect(addExpense(req, res)).rejects.toBe('Remarks must be at least 5 characters long!');
    });

    test('should throw error when amount is not numeric', async () => {
      req.body = {
        amount: 'abc',
        remarks: 'Test expense description',
      };

      validator.isNumeric.mockReturnValue(false);

      await expect(addExpense(req, res)).rejects.toBe('Amount must be a valid number.');
    });

    test('should throw error when amount is negative', async () => {
      req.body = {
        amount: -100,
        remarks: 'Test expense description',
      };

      validator.isNumeric.mockReturnValue(true);

      await expect(addExpense(req, res)).rejects.toBe('Amount must not be negative');
    });
  });
});

