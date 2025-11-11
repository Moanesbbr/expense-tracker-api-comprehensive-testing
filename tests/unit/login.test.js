/**
 * Unit Tests for Login Controller
 * White-box testing approach
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const login = require('../../modules/users/controllers/login');
const jwtManager = require('../../managers/jwtManager');

// Mock dependencies
jest.mock('mongoose');
jest.mock('bcrypt');
jest.mock('../../managers/jwtManager');

describe('User Login', () => {
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
    };

    mongoose.model = jest.fn().mockReturnValue(mockUsersModel);
    jwtManager.mockReturnValue('mock_jwt_token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Login', () => {
    test('should login successfully with valid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockUsersModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await login(req, res);

      expect(mockUsersModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(jwtManager).toHaveBeenCalledWith(mockUser);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'User logged in successfully!',
        accessToken: 'mock_jwt_token',
      });
    });
  });

  describe('Login Errors', () => {
    test('should throw error when email does not exist', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUsersModel.findOne.mockResolvedValue(null);

      await expect(login(req, res)).rejects.toBe('This email doesnot exist in the system!');
    });

    test('should throw error when password does not match', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
      };

      mockUsersModel.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(login(req, res)).rejects.toBe('Email and password do not match!');
    });
  });
});

