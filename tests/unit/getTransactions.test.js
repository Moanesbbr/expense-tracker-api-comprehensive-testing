/**
 * Unit Tests for Get Transactions Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const getTransactions = require('../../modules/transactions/controllers/getTransactions');

// Mock dependencies
jest.mock('mongoose');

describe('Get Transactions', () => {
  let req, res;
  let mockTransactionsModel;

  beforeEach(() => {
    req = {
      user: { _id: 'user123' },
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockTransactionsModel = {
      find: jest.fn().mockResolvedValue([]),
    };

    mongoose.model = jest.fn().mockReturnValue(mockTransactionsModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Transaction Retrieval', () => {
    test('should get all transactions for user', async () => {
      const mockTransactions = [
        {
          _id: 'trans1',
          user_id: 'user123',
          amount: 500,
          remarks: 'Salary',
          transaction_type: 'income',
        },
        {
          _id: 'trans2',
          user_id: 'user123',
          amount: 100,
          remarks: 'Grocery',
          transaction_type: 'expense',
        },
      ];

      mockTransactionsModel.find.mockResolvedValue(mockTransactions);

      await getTransactions(req, res);

      expect(mockTransactionsModel.find).toHaveBeenCalledWith({
        user_id: 'user123',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockTransactions,
      });
    });

    test('should filter transactions by transaction_type', async () => {
      req.query = { transaction_type: 'income' };

      const mockTransactions = [
        {
          _id: 'trans1',
          user_id: 'user123',
          amount: 500,
          remarks: 'Salary',
          transaction_type: 'income',
        },
      ];

      mockTransactionsModel.find.mockResolvedValue(mockTransactions);

      await getTransactions(req, res);

      expect(mockTransactionsModel.find).toHaveBeenCalledWith({
        user_id: 'user123',
        transaction_type: 'income',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockTransactions,
      });
    });

    test('should return message when no transactions exist', async () => {
      mockTransactionsModel.find.mockResolvedValue([]);

      await getTransactions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: 'no transactions yet, try to add some income or expense',
      });
    });
  });
});

