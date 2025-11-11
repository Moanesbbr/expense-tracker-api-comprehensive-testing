/**
 * Unit Tests for User Dashboard Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const userDashboard = require('../../modules/users/controllers/userDashboard');

// Mock dependencies
jest.mock('mongoose');

describe('User Dashboard', () => {
  let req, res;
  let mockUsersModel, mockTransactionsModel;

  beforeEach(() => {
    req = {
      user: { _id: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockUsersModel = {
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          balance: 1000,
        }),
      }),
    };

    mockTransactionsModel = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([
            {
              _id: 'trans1',
              amount: 500,
              remarks: 'Salary',
              transaction_type: 'income',
            },
            {
              _id: 'trans2',
              amount: 100,
              remarks: 'Grocery',
              transaction_type: 'expense',
            },
          ]),
        }),
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

  describe('Successful Dashboard Retrieval', () => {
    test('should retrieve user dashboard with transactions', async () => {
      await userDashboard(req, res);

      expect(mockUsersModel.findOne).toHaveBeenCalledWith({
        _id: 'user123',
      });
      expect(mockUsersModel.findOne().select).toHaveBeenCalledWith('-password');
      expect(mockTransactionsModel.find).toHaveBeenCalledWith({
        user_id: 'user123',
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          _id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          balance: 1000,
        },
        transactions: [
          {
            _id: 'trans1',
            amount: 500,
            remarks: 'Salary',
            transaction_type: 'income',
          },
          {
            _id: 'trans2',
            amount: 100,
            remarks: 'Grocery',
            transaction_type: 'expense',
          },
        ],
      });
    });
  });
});

