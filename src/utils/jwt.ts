import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/config';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenType?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const { userId, email, role } = payload;
  const secret = config.jwtSecret;
  const expiresIn = config.jwtExpiresIn;
  
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  
  const options: SignOptions = {
    expiresIn: '24h',
    issuer: 'dominica-news',
    audience: 'dominica-news-users'
  };
  
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      tokenType: 'access'
    }, 
    secret, 
    options
  );
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const { userId, email, role } = payload;
  const secret = config.jwtSecret;
  
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  
  const options: SignOptions = {
    expiresIn: '7d', // Refresh tokens last 7 days
    issuer: 'dominica-news',
    audience: 'dominica-news-users'
  };
  
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      tokenType: 'refresh'
    }, 
    secret, 
    options
  );
};

export const generateTokenPair = (payload: JWTPayload): TokenPair => {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

export const verifyToken = (token: string): JWTPayload => {
  const secret = config.jwtSecret;
  
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  
  return jwt.verify(token, secret, {
    issuer: 'dominica-news',
    audience: 'dominica-news-users'
  }) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  const secret = config.jwtSecret;
  
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  
  const decoded = jwt.verify(token, secret, {
    issuer: 'dominica-news',
    audience: 'dominica-news-users'
  }) as JWTPayload;
  
  if (decoded.tokenType !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
};

export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  return expiration.getTime() < Date.now();
};