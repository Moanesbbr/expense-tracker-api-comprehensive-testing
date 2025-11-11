/**
 * Unit Tests for JWT Manager
 * White-box testing approach
 */

const jsonwebtoken = require('jsonwebtoken');
const jwtManager = require('../../managers/jwtManager');

// Mock dependencies
jest.mock('jsonwebtoken');

describe('JWT Manager', () => {
  beforeEach(() => {
    process.env.jwt_salt = 'test_secret_key';
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Token Generation', () => {
    test('should generate JWT token successfully', () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockToken = 'mock_jwt_token';
      jsonwebtoken.sign.mockReturnValue(mockToken);

      const result = jwtManager(mockUser);

      expect(jsonwebtoken.sign).toHaveBeenCalledWith(
        {
          _id: 'user123',
          name: 'Test User',
        },
        'test_secret_key'
      );
      expect(result).toBe(mockToken);
    });

    test('should generate token with correct payload structure', () => {
      const mockUser = {
        _id: 'user456',
        name: 'Another User',
        email: 'another@example.com',
        balance: 1000,
      };

      const mockToken = 'another_mock_token';
      jsonwebtoken.sign.mockReturnValue(mockToken);

      jwtManager(mockUser);

      expect(jsonwebtoken.sign).toHaveBeenCalledWith(
        {
          _id: 'user456',
          name: 'Another User',
        },
        'test_secret_key'
      );
      // Verify that email and balance are not included in token
      const callArgs = jsonwebtoken.sign.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('email');
      expect(callArgs).not.toHaveProperty('balance');
    });
  });
});

