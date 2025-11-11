/**
 * Unit Tests for Forgot Password Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const forgotPassword = require('../../modules/users/controllers/forgotPassword');
const emailManager = require('../../managers/emailManager');

// Mock dependencies
jest.mock('mongoose');
jest.mock('../../managers/emailManager');

describe('Forgot Password', () => {
  let req, res;
  let mockUsersModel;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockUsersModel = {
      findOne: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
    };

    mongoose.model = jest.fn().mockReturnValue(mockUsersModel);
    emailManager.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Password Reset Request', () => {
    test('should send reset code successfully', async () => {
      req.body = {
        email: 'test@example.com',
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
      };

      mockUsersModel.findOne.mockResolvedValue(mockUser);

      await forgotPassword(req, res);

      expect(mockUsersModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockUsersModel.updateOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        expect.objectContaining({
          reset_code: expect.any(Number),
        }),
        { runValidators: true }
      );
      expect(emailManager).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'Reset code sent to email successfully!',
      });
    });
  });

  describe('Validation Errors', () => {
    test('should throw error when email is missing', async () => {
      req.body = {};

      await expect(forgotPassword(req, res)).rejects.toBe('Email is required!');
    });

    test('should throw error when email does not exist', async () => {
      req.body = {
        email: 'nonexistent@example.com',
      };

      mockUsersModel.findOne.mockResolvedValue(null);

      await expect(forgotPassword(req, res)).rejects.toBe('This email doesnot exist in the system!');
    });
  });
});

