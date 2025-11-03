import { generateToken, verifyToken, JWTPayload } from './jwt';
import jwt from 'jsonwebtoken';

describe('JWT Utilities', () => {
  const mockPayload: JWTPayload = {
    userId: '507f1f77bcf86cd799439011',
    email: 'admin@example.com',
    role: 'admin',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { ...mockPayload, userId: 'user1' };
      const payload2 = { ...mockPayload, userId: 'user2' };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.iat).toBeDefined(); // issued at
      expect(decoded.exp).toBeDefined(); // expires at
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';

      expect(() => {
        verifyToken(malformedToken);
      }).toThrow();
    });

    it('should throw error for token with wrong secret', () => {
      // Generate token with different secret
      const tokenWithWrongSecret = jwt.sign(mockPayload, 'wrong-secret');

      expect(() => {
        verifyToken(tokenWithWrongSecret);
      }).toThrow();
    });
  });

  describe('Token roundtrip', () => {
    it('should generate and verify token successfully', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });
  });
});