/**
 * Unit Tests for Authentication Middleware
 * White-box testing approach
 */

const auth = require('../../middleware/auth');
const jsonwebtoken = require('jsonwebtoken');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    process.env.jwt_salt = 'test_secret_key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Token', () => {
    test('should call next() when valid token is provided', () => {
      const mockPayload = { _id: '123', name: 'Test User' };
      const mockToken = 'valid_token';

      req.headers.authorization = `Bearer ${mockToken}`;
      jsonwebtoken.verify.mockReturnValue(mockPayload);

      auth(req, res, next);

      expect(jsonwebtoken.verify).toHaveBeenCalledWith(mockToken, process.env.jwt_salt);
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Token', () => {
    test('should return 401 when token is missing', () => {
      req.headers.authorization = undefined;

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'failed',
        message: 'Unauthorized!',
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when Bearer prefix is missing', () => {
      req.headers.authorization = 'invalid_token';

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 when token verification fails', () => {
      req.headers.authorization = 'Bearer invalid_token';
      jsonwebtoken.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      auth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'failed',
        message: 'Unauthorized!',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

