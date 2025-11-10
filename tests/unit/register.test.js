/**
 * Unit Tests for User Registration
 * White-box testing approach
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const register = require('../../modules/users/controllers/register');
const jwtManager = require('../../managers/jwtManager');
const emailManager = require('../../managers/emailManager');

// Mock dependencies
jest.mock('mongoose');
jest.mock('bcrypt');
jest.mock('../../managers/jwtManager');
jest.mock('../../managers/emailManager');

describe('User Registration', () => {
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
      create: jest.fn(),
    };

    mongoose.model = jest.fn().mockReturnValue(mockUsersModel);
    bcrypt.hash.mockResolvedValue('hashed_password');
    jwtManager.mockReturnValue('mock_jwt_token');
    emailManager.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Registration', () => {
    test('should register user successfully with valid data', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirm_password: 'password123',
        balance: 1000,
      };

      mockUsersModel.findOne.mockResolvedValue(null);
      mockUsersModel.create.mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        balance: 1000,
      });

      await register(req, res);

      expect(mockUsersModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockUsersModel.create).toHaveBeenCalled();
      expect(jwtManager).toHaveBeenCalled();
      expect(emailManager).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'User registered successfully!',
        accessToken: 'mock_jwt_token',
      });
    });
  });

  describe('Validation Errors', () => {
    test('should throw error when email is missing', async () => {
      req.body = {
        name: 'Test User',
        password: 'password123',
        confirm_password: 'password123',
      };

      await expect(register(req, res)).rejects.toBe('Email must be provided!');
    });

    test('should throw error when password is missing', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        confirm_password: 'password123',
      };

      await expect(register(req, res)).rejects.toBe('Password must be provided!');
    });

    test('should throw error when password is too short', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: '1234',
        confirm_password: '1234',
      };

      await expect(register(req, res)).rejects.toBe('Password must be at least 5 characters long.');
    });

    test('should throw error when name is missing', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        confirm_password: 'password123',
      };

      await expect(register(req, res)).rejects.toBe('Name is required');
    });

    test('should throw error when passwords do not match', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirm_password: 'password456',
      };

      await expect(register(req, res)).rejects.toBe('Password and confirmed password doesnot match!');
    });

    test('should throw error when email already exists', async () => {
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirm_password: 'password123',
      };

      mockUsersModel.findOne.mockResolvedValue({ email: 'test@example.com' });

      await expect(register(req, res)).rejects.toBe('This email already exists!');
    });
  });
});

