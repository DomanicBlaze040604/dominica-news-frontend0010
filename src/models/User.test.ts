import { User } from './User';
import mongoose from 'mongoose';

describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'admin@example.com',
        passwordHash: 'password123',
        fullName: 'Admin User',
        role: 'admin' as const,
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.fullName).toBe(userData.fullName);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.passwordHash).not.toBe(userData.passwordHash); // Should be hashed
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should hash password before saving', async () => {
      const plainPassword = 'password123';
      const user = new User({
        email: 'test@example.com',
        passwordHash: plainPassword,
        fullName: 'Test User',
      });

      await user.save();
      expect(user.passwordHash).not.toBe(plainPassword);
      expect(user.passwordHash.length).toBeGreaterThan(plainPassword.length);
    });

    it('should not include passwordHash in JSON output', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'password123',
        fullName: 'Test User',
      });

      await user.save();
      const userJSON = user.toJSON();

      expect(userJSON.passwordHash).toBeUndefined();
      expect(userJSON.id).toBeDefined();
      expect(userJSON._id).toBeUndefined();
      expect(userJSON.__v).toBeUndefined();
    });
  });

  describe('User Validation', () => {
    it('should require email', async () => {
      const user = new User({
        passwordHash: 'password123',
        fullName: 'Test User',
      });

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    it('should require valid email format', async () => {
      const user = new User({
        email: 'invalid-email',
        passwordHash: 'password123',
        fullName: 'Test User',
      });

      await expect(user.save()).rejects.toThrow('Please enter a valid email address');
    });

    it('should require password', async () => {
      const user = new User({
        email: 'test@example.com',
        fullName: 'Test User',
      });

      await expect(user.save()).rejects.toThrow('Password is required');
    });

    it('should require full name', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'password123',
      });

      await expect(user.save()).rejects.toThrow('Full name is required');
    });

    it('should enforce unique email', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'password123',
        fullName: 'Test User',
      };

      await new User(userData).save();

      const duplicateUser = new User(userData);
      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should default role to admin', async () => {
      const user = new User({
        email: 'test@example.com',
        passwordHash: 'password123',
        fullName: 'Test User',
      });

      await user.save();
      expect(user.role).toBe('admin');
    });
  });

  describe('Password Comparison', () => {
    it('should compare passwords correctly', async () => {
      const plainPassword = 'password123';
      const user = new User({
        email: 'test@example.com',
        passwordHash: plainPassword,
        fullName: 'Test User',
      });

      await user.save();

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);

      const isWrongMatch = await user.comparePassword('wrongpassword');
      expect(isWrongMatch).toBe(false);
    });
  });
});