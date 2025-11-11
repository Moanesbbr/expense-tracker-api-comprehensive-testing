/**
 * Unit Tests for Delete Transaction Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const validator = require('validator');
const deleteTransaction = require('../../modules/transactions/controllers/deleteTransaction');

// Mock dependencies
jest.mock('mongoose');
jest.mock('validator');

describe('Delete Transaction', () => {
  let req, res;
  let mockTransactionsModel, mockUsersModel;

  beforeEach(() => {
    req = {
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockTransactionsModel = {
      findOne: jest.fn(),
      deleteOne: jest.fn().mockResolvedValue({}),
    };

    mockUsersModel = {
      updateOne: jest.fn().mockResolvedValue({}),
    };

    mongoose.model = jest.fn((modelName) => {
      if (modelName === 'users') return mockUsersModel;
      if (modelName === 'transactions') return mockTransactionsModel;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Transaction Deletion', () => {
    test('should delete income transaction and update balance correctly', async () => {
      req.params = {
        transaction_id: '507f1f77bcf86cd799439011',
      };

      const mockTransaction = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 'user123',
        amount: 500,
        remarks: 'Salary',
        transaction_type: 'income',
      };

      mockTransactionsModel.findOne.mockResolvedValue(mockTransaction);
      validator.isMongoId.mockReturnValue(true);

      await deleteTransaction(req, res);

      expect(validator.isMongoId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockTransactionsModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
      expect(mockUsersModel.updateOne).toHaveBeenCalledWith(
        { _id: 'user123' },
        { $inc: { balance: -500 } },
        { runValidators: true }
      );
      expect(mockTransactionsModel.deleteOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'Deleted successfully!',
      });
    });

    test('should delete expense transaction and update balance correctly', async () => {
      req.params = {
        transaction_id: '507f1f77bcf86cd799439011',
      };

      const mockTransaction = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 'user123',
        amount: 100,
        remarks: 'Grocery',
        transaction_type: 'expense',
      };

      mockTransactionsModel.findOne.mockResolvedValue(mockTransaction);
      validator.isMongoId.mockReturnValue(true);

      await deleteTransaction(req, res);

      expect(mockUsersModel.updateOne).toHaveBeenCalledWith(
        { _id: 'user123' },
        { $inc: { balance: 100 } },
        { runValidators: true }
      );
      expect(mockTransactionsModel.deleteOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'Deleted successfully!',
      });
    });
  });

  describe('Validation Errors', () => {
    test('should throw error when transaction_id is not a valid MongoId', async () => {
      req.params = {
        transaction_id: 'invalid_id',
      };

      validator.isMongoId.mockReturnValue(false);

      await expect(deleteTransaction(req, res)).rejects.toBe('Please provide a valid id!');
    });

    test('should throw error when transaction does not exist', async () => {
      req.params = {
        transaction_id: '507f1f77bcf86cd799439011',
      };

      mockTransactionsModel.findOne.mockResolvedValue(null);
      validator.isMongoId.mockReturnValue(true);

      await expect(deleteTransaction(req, res)).rejects.toBe('Transaction not found!');
    });
  });
});

