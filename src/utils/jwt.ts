import jwt from 'jsonwebtoken';
import { config } from '../config/config';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: JWTPayload): string => {
  const { userId, email, role } = payload;
  return (jwt as any).sign({ userId, email, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return (jwt as any).verify(token, config.jwtSecret) as JWTPayload;
};