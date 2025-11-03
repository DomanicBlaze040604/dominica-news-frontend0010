import request from 'supertest';
import express from 'express';
import { registerValidation, loginValidation, categoryValidation } from './validators';
import { validationResult } from 'express-validator';

// Create a test app for validation testing
const createTestApp = (validationMiddleware: any[]) => {
  const app = express();
  app.use(express.json());
  
  app.post('/test', validationMiddleware, (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    res.json({ success: true });
  });
  
  return app;
};

describe('Validators', () => {
  describe('registerValidation', () => {
    const app = createTestApp(registerValidation);

    it('should pass with valid registration data', async () => {
      const validData = {
        email: 'admin@example.com',
        password: 'Password123',
        fullName: 'Admin User',
      };

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123',
        fullName: 'Admin User',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Please provide a valid email address',
          }),
        ])
      );
    });

    it('should fail with weak password', async () => {
      const invalidData = {
        email: 'admin@example.com',
        password: 'weak',
        fullName: 'Admin User',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should fail with password missing uppercase', async () => {
      const invalidData = {
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
          }),
        ])
      );
    });

    it('should fail with password missing number', async () => {
      const invalidData = {
        email: 'admin@example.com',
        password: 'Password',
        fullName: 'Admin User',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
          }),
        ])
      );
    });

    it('should fail with invalid full name', async () => {
      const invalidData = {
        email: 'admin@example.com',
        password: 'Password123',
        fullName: 'A',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Full name must be between 2 and 100 characters',
          }),
        ])
      );
    });

    it('should fail with full name containing numbers', async () => {
      const invalidData = {
        email: 'admin@example.com',
        password: 'Password123',
        fullName: 'Admin User 123',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Full name can only contain letters and spaces',
          }),
        ])
      );
    });
  });

  describe('loginValidation', () => {
    const app = createTestApp(loginValidation);

    it('should pass with valid login data', async () => {
      const validData = {
        email: 'admin@example.com',
        password: 'anypassword',
      };

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'anypassword',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Please provide a valid email address',
          }),
        ])
      );
    });

    it('should fail with missing password', async () => {
      const invalidData = {
        email: 'admin@example.com',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password is required',
          }),
        ])
      );
    });

    it('should fail with empty password', async () => {
      const invalidData = {
        email: 'admin@example.com',
        password: '',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password is required',
          }),
        ])
      );
    });
  });

  describe('categoryValidation', () => {
    const app = createTestApp(categoryValidation);

    it('should pass with valid category data', async () => {
      const validData = {
        name: 'Technology',
        description: 'Technology related news',
        displayOrder: 1,
      };

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should pass with minimal category data', async () => {
      const validData = {
        name: 'Sports',
      };

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with missing name', async () => {
      const invalidData = {
        description: 'Some description',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Category name must be between 2 and 100 characters',
          }),
        ])
      );
    });

    it('should fail with name too short', async () => {
      const invalidData = {
        name: 'A',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Category name must be between 2 and 100 characters',
          }),
        ])
      );
    });

    it('should fail with invalid characters in name', async () => {
      const invalidData = {
        name: 'Tech@News!',
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Category name can only contain letters, numbers, spaces, hyphens, and ampersands',
          }),
        ])
      );
    });

    it('should allow valid special characters in name', async () => {
      const validData = {
        name: 'News & Updates',
      };

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});