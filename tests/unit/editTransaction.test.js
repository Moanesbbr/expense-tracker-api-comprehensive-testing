/**
 * Unit Tests for Edit Transaction Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const validator = require('validator');
const editTransaction = require('../../modules/transactions/controllers/editTransaction');

// Mock dependencies
jest.mock('mongoose');
jest.mock('validator');

describe('Edit Transaction', () => {
  let req, res;
  let mockTransactionsModel;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockTransactionsModel = {
      findOne: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
    };

    mongoose.model = jest.fn().mockReturnValue(mockTransactionsModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Transaction Edit', () => {
    test('should edit transaction successfully with valid data', async () => {
      req.body = {
        transaction_id: '507f1f77bcf86cd799439011',
        remarks: 'Updated remarks for transaction',
      };

      const mockTransaction = {
        _id: '507f1f77bcf86cd799439011',
        user_id: 'user123',
        amount: 100,
        remarks: 'Old remarks',
        transaction_type: 'expense',
      };

      mockTransactionsModel.findOne.mockResolvedValue(mockTransaction);
      validator.isMongoId.mockReturnValue(true);

      await editTransaction(req, res);

      expect(validator.isMongoId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockTransactionsModel.findOne).toHaveBeenCalledWith({
        _id: '507f1f77bcf86cd799439011',
      });
      expect(mockTransactionsModel.updateOne).toHaveBeenCalledWith(
        { _id: '507f1f77bcf86cd799439011' },
        { remarks: 'Updated remarks for transaction' },
        { runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'Transaction updated successfully!',
      });
    });
  });

  describe('Validation Errors', () => {
    test('should throw error when transaction_id is missing', async () => {
      req.body = {
        remarks: 'Updated remarks',
      };

      await expect(editTransaction(req, res)).rejects.toBe('Transaction id is required!');
    });

    test('should throw error when transaction_id is not a valid MongoId', async () => {
      req.body = {
        transaction_id: 'invalid_id',
        remarks: 'Updated remarks',
      };

      validator.isMongoId.mockReturnValue(false);

      await expect(editTransaction(req, res)).rejects.toBe('Please provide a valid id!');
    });

    test('should throw error when transaction does not exist', async () => {
      req.body = {
        transaction_id: '507f1f77bcf86cd799439011',
        remarks: 'Updated remarks',
      };

      mockTransactionsModel.findOne.mockResolvedValue(null);
      validator.isMongoId.mockReturnValue(true);

      await expect(editTransaction(req, res)).rejects.toBe('Transaction not found!');
    });
  });
});

