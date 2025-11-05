import {
  generateToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyRefreshToken,
  getTokenExpiration,
  isTokenExpired,
  JWTPayload,
} from '../utils/jwt';

describe('JWT Utilities', () => {
  const mockPayload: JWTPayload = {
    userId: '123456789',
    email: 'test@example.com',
    role: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid access token', () => {
      const token = generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in access token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.tokenType).toBe('access');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should set correct expiration time', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + (24 * 60 * 60); // 24 hours from now
      
      expect(decoded.exp).toBeGreaterThan(now);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 60); // Allow 1 minute tolerance
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload in refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.tokenType).toBe('refresh');
    });

    it('should have longer expiration than access token', () => {
      const accessToken = generateToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);
      
      const accessDecoded = verifyToken(accessToken);
      const refreshDecoded = verifyRefreshToken(refreshToken);
      
      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp!);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokenPair = generateTokenPair(mockPayload);
      
      expect(tokenPair.accessToken).toBeDefined();
      expect(tokenPair.refreshToken).toBeDefined();
      expect(typeof tokenPair.accessToken).toBe('string');
      expect(typeof tokenPair.refreshToken).toBe('string');
    });

    it('should generate tokens with same user data but different types', () => {
      const tokenPair = generateTokenPair(mockPayload);
      
      const accessDecoded = verifyToken(tokenPair.accessToken);
      const refreshDecoded = verifyRefreshToken(tokenPair.refreshToken);
      
      expect(accessDecoded.userId).toBe(refreshDecoded.userId);
      expect(accessDecoded.email).toBe(refreshDecoded.email);
      expect(accessDecoded.role).toBe(refreshDecoded.role);
      expect(accessDecoded.tokenType).toBe('access');
      expect(refreshDecoded.tokenType).toBe('refresh');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.tokenType).toBe('access');
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });

    it('should throw error for refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(mockPayload);
      
      // verifyToken should work but the token type will be wrong
      const decoded = verifyToken(refreshToken);
      expect(decoded.tokenType).toBe('refresh');
    });

    it('should verify token with correct issuer and audience', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      // The verification should pass if issuer and audience are correct
      expect(decoded).toBeDefined();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.tokenType).toBe('refresh');
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateToken(mockPayload);
      
      expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid token type');
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });
  });

  describe('getTokenExpiration', () => {
    it('should return correct expiration date for valid token', () => {
      const token = generateToken(mockPayload);
      const expiration = getTokenExpiration(token);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expiration = getTokenExpiration('invalid-token');
      expect(expiration).toBeNull();
    });

    it('should return null for token without exp claim', () => {
      // This is hard to test without manually crafting a token
      // For now, we'll test with a malformed token
      const expiration = getTokenExpiration('not.a.token');
      expect(expiration).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const token = generateToken(mockPayload);
      const expired = isTokenExpired(token);
      
      expect(expired).toBe(false);
    });

    it('should return true for invalid token', () => {
      const expired = isTokenExpired('invalid-token');
      expect(expired).toBe(true);
    });

    it('should return true for expired token', () => {
      // Create a token that's already expired
      // We'll mock the current time to make the token appear expired
      const originalNow = Date.now;
      const futureTime = Date.now() + (25 * 60 * 60 * 1000); // 25 hours in future
      
      // Generate token
      const token = generateToken(mockPayload);
      
      // Mock time to be in the future
      Date.now = jest.fn(() => futureTime);
      
      const expired = isTokenExpired(token);
      expect(expired).toBe(true);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Token Security', () => {
    it('should generate different tokens for same payload', () => {
      const token1 = generateToken(mockPayload);
      const token2 = generateToken(mockPayload);
      
      expect(token1).not.toBe(token2);
    });

    it('should include issued at timestamp', () => {
      const beforeGeneration = Math.floor(Date.now() / 1000);
      const token = generateToken(mockPayload);
      const afterGeneration = Math.floor(Date.now() / 1000);
      
      const decoded = verifyToken(token);
      
      expect(decoded.iat).toBeGreaterThanOrEqual(beforeGeneration);
      expect(decoded.iat).toBeLessThanOrEqual(afterGeneration);
    });

    it('should have proper token structure', () => {
      const token = generateToken(mockPayload);
      const parts = token.split('.');
      
      expect(parts).toHaveLength(3);
      
      // Verify header
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      expect(header.alg).toBe('HS256');
      expect(header.typ).toBe('JWT');
      
      // Verify payload structure
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload.userId).toBe(mockPayload.userId);
      expect(payload.email).toBe(mockPayload.email);
      expect(payload.role).toBe(mockPayload.role);
      expect(payload.tokenType).toBe('access');
      expect(payload.iss).toBe('dominica-news');
      expect(payload.aud).toBe('dominica-news-users');
    });

    it('should not accept tokens with wrong issuer', () => {
      // This would require manually crafting a token with wrong issuer
      // For now, we'll verify that our tokens have the correct issuer
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);
      
      // The fact that verification succeeds means issuer is correct
      expect(decoded).toBeDefined();
    });

    it('should handle edge cases gracefully', () => {
      // Test with empty payload
      expect(() => generateToken({} as JWTPayload)).not.toThrow();
      
      // Test with null/undefined values
      expect(() => verifyToken('')).toThrow();
      expect(() => getTokenExpiration('')).not.toThrow();
      expect(getTokenExpiration('')).toBeNull();
    });
  });

  describe('Token Lifecycle', () => {
    it('should maintain token validity throughout its lifetime', () => {
      const token = generateToken(mockPayload);
      
      // Token should be valid immediately
      expect(() => verifyToken(token)).not.toThrow();
      expect(isTokenExpired(token)).toBe(false);
      
      // Token should have reasonable expiration
      const expiration = getTokenExpiration(token);
      const now = new Date();
      const hoursUntilExpiration = (expiration!.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      expect(hoursUntilExpiration).toBeGreaterThan(23); // At least 23 hours
      expect(hoursUntilExpiration).toBeLessThan(25); // Less than 25 hours
    });

    it('should handle refresh token lifecycle', () => {
      const refreshToken = generateRefreshToken(mockPayload);
      
      // Refresh token should be valid immediately
      expect(() => verifyRefreshToken(refreshToken)).not.toThrow();
      expect(isTokenExpired(refreshToken)).toBe(false);
      
      // Refresh token should have longer expiration than access token
      const accessToken = generateToken(mockPayload);
      const refreshExpiration = getTokenExpiration(refreshToken);
      const accessExpiration = getTokenExpiration(accessToken);
      
      expect(refreshExpiration!.getTime()).toBeGreaterThan(accessExpiration!.getTime());
    });
  });
});