/**
 * Unit Tests for Reset Password Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const resetPassword = require('../../modules/users/controllers/resetPassword');
const emailManager = require('../../managers/emailManager');

// Mock dependencies
jest.mock('mongoose');
jest.mock('bcrypt');
jest.mock('../../managers/emailManager');

describe('Reset Password', () => {
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
    bcrypt.hash.mockResolvedValue('hashed_password');
    emailManager.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Password Reset', () => {
    test('should reset password successfully with valid reset code', async () => {
      req.body = {
        email: 'test@example.com',
        new_password: 'newpassword123',
        reset_code: '12345',
      };

      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        reset_code: '12345',
      };

      mockUsersModel.findOne.mockResolvedValue(mockUser);

      await resetPassword(req, res);

      expect(mockUsersModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
        reset_code: '12345',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(mockUsersModel.updateOne).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        {
          password: 'hashed_password',
          reset_code: '',
        },
        { runValidators: true }
      );
      expect(emailManager).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Password reseted succesfully!',
      });
    });
  });

  describe('Validation Errors', () => {
    test('should throw error when email is missing', async () => {
      req.body = {
        new_password: 'newpassword123',
        reset_code: '12345',
      };

      await expect(resetPassword(req, res)).rejects.toBe('Email is required');
    });

    test('should throw error when new_password is missing', async () => {
      req.body = {
        email: 'test@example.com',
        reset_code: '12345',
      };

      await expect(resetPassword(req, res)).rejects.toBe('Please provide new password!');
    });

    test('should throw error when reset_code is missing', async () => {
      req.body = {
        email: 'test@example.com',
        new_password: 'newpassword123',
      };

      await expect(resetPassword(req, res)).rejects.toBe('Reset code is required!');
    });

    test('should throw error when password is too short', async () => {
      req.body = {
        email: 'test@example.com',
        new_password: '1234',
        reset_code: '12345',
      };

      await expect(resetPassword(req, res)).rejects.toBe('Password must be at least 5 characters long!');
    });

    test('should throw error when reset code does not match', async () => {
      req.body = {
        email: 'test@example.com',
        new_password: 'newpassword123',
        reset_code: 'wrongcode',
      };

      mockUsersModel.findOne.mockResolvedValue(null);

      await expect(resetPassword(req, res)).rejects.toBe('Reset code does not match!');
    });
  });
});

