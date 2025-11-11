/**
 * Unit Tests for Add Income Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const validator = require('validator');
const addIncome = require('../../modules/transactions/controllers/addIncome');

// Mock dependencies
jest.mock('mongoose');
jest.mock('validator');

describe('Add Income', () => {
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
        amount: 500,
        remarks: 'Test income',
        transaction_type: 'income',
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

  describe('Successful Income Addition', () => {
    test('should add income successfully with valid data', async () => {
      req.body = {
        amount: 500,
        remarks: 'Salary payment received',
      };

      validator.isNumeric.mockReturnValue(true);

      await addIncome(req, res);

      expect(validator.isNumeric).toHaveBeenCalledWith('500');
      expect(mockTransactionsModel.create).toHaveBeenCalledWith({
        user_id: 'user123',
        amount: 500,
        remarks: 'Salary payment received',
        transaction_type: 'income',
      });
      expect(mockUsersModel.updateOne).toHaveBeenCalledWith(
        { _id: 'user123' },
        { $inc: { balance: 500 } },
        { runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Income added successfully!',
      });
    });
  });

  describe('Validation Errors', () => {
    test('should throw error when amount is missing', async () => {
      req.body = {
        remarks: 'Salary payment received',
      };

      await expect(addIncome(req, res)).rejects.toBe('Amount is required!');
    });

    test('should throw error when remarks is missing', async () => {
      req.body = {
        amount: 500,
      };

      await expect(addIncome(req, res)).rejects.toBe('Remarks is required!');
    });

    test('should throw error when remarks is too short', async () => {
      req.body = {
        amount: 500,
        remarks: 'Test',
      };

      await expect(addIncome(req, res)).rejects.toBe('Remarks must be at least 5 characters long!');
    });

    test('should throw error when amount is not numeric', async () => {
      req.body = {
        amount: 'abc',
        remarks: 'Salary payment received',
      };

      validator.isNumeric.mockReturnValue(false);

      await expect(addIncome(req, res)).rejects.toBe('Amount must be a valid number.');
    });

    test('should throw error when amount is negative', async () => {
      req.body = {
        amount: -500,
        remarks: 'Salary payment received',
      };

      validator.isNumeric.mockReturnValue(true);

      await expect(addIncome(req, res)).rejects.toBe('Amount must not be negative');
    });
  });
});

