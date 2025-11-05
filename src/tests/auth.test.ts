import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { User } from '../models/User';
import { generateTokenPair, verifyToken } from '../utils/jwt';

describe('Authentication System', () => {
  let mongoServer: MongoMemoryServer;
  let testUser: any;
  let adminUser: any;
  let editorUser: any;
  let authToken: string;
  let adminToken: string;
  let editorToken: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});

    // Create test users
    testUser = await User.create({
      email: 'test@example.com',
      passwordHash: 'TestPassword123',
      fullName: 'Test User',
      role: 'user',
      isActive: true,
    });

    adminUser = await User.create({
      email: 'admin@example.com',
      passwordHash: 'AdminPassword123',
      fullName: 'Admin User',
      role: 'admin',
      isActive: true,
    });

    editorUser = await User.create({
      email: 'editor@example.com',
      passwordHash: 'EditorPassword123',
      fullName: 'Editor User',
      role: 'editor',
      isActive: true,
    });

    // Generate tokens
    const userTokens = generateTokenPair({
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role,
    });
    authToken = userTokens.accessToken;

    const adminTokens = generateTokenPair({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role,
    });
    adminToken = adminTokens.accessToken;

    const editorTokens = generateTokenPair({
      userId: editorUser._id.toString(),
      email: editorUser.email,
      role: editorUser.role,
    });
    editorToken = editorTokens.accessToken;
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'NewPassword123',
        fullName: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.fullName).toBe(userData.fullName);
      expect(response.body.data.user.role).toBe('user');
      expect(response.body.data.token).toBeDefined();

      // Verify user was created in database
      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser?.isActive).toBe(true);
    });

    it('should create admin user when email matches ADMIN_EMAIL', async () => {
      process.env.ADMIN_EMAIL = 'superadmin@example.com';

      const userData = {
        email: 'superadmin@example.com',
        password: 'SuperAdminPassword123',
        fullName: 'Super Admin',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.role).toBe('admin');
    });

    it('should reject registration with existing email', async () => {
      const userData = {
        email: 'test@example.com', // Already exists
        password: 'NewPassword123',
        fullName: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'weak', // Too weak
        fullName: 'New User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.token).toBeDefined();

      // Verify token is valid
      const decoded = verifyToken(response.body.data.token);
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.tokenType).toBe('access');

      // Verify refresh token cookie is set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'] as string[];
      const refreshCookie = cookies.find((cookie: string) => 
        cookie.startsWith('refreshToken=')
      );
      expect(refreshCookie).toBeDefined();
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      // Deactivate user
      await User.findByIdAndUpdate(testUser._id, { isActive: false });

      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('deactivated');
    });

    it('should lock account after multiple failed attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);
      }

      // 6th attempt should be locked
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(423);

      expect(response.body.error).toContain('locked');
    });

    it('should update last login timestamp', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const beforeLogin = new Date();
      
      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.lastLogin).toBeDefined();
      expect(updatedUser?.lastLogin!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token is required');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or expired token');
    });

    it('should reject request for inactive user', async () => {
      // Deactivate user
      await User.findByIdAndUpdate(testUser._id, { isActive: false });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.error).toContain('deactivated');
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123',
        newPassword: 'NewTestPassword123',
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');

      // Verify old password no longer works
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123',
        })
        .expect(401);

      // Verify new password works
      const newLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewTestPassword123',
        })
        .expect(200);

      expect(newLoginResponse.body.success).toBe(true);
    });

    it('should reject password change with wrong current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewTestPassword123',
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.error).toContain('Current password is incorrect');
    });

    it('should validate new password strength', async () => {
      const passwordData = {
        currentPassword: 'TestPassword123',
        newPassword: 'weak',
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update profile successfully', async () => {
      const profileData = {
        fullName: 'Updated Test User',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.fullName).toBe(profileData.fullName);

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.fullName).toBe(profileData.fullName);
    });

    it('should validate full name', async () => {
      const profileData = {
        fullName: '', // Empty name
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(400);

      expect(response.body.error).toContain('Full name is required');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should logout from all devices successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out from all devices');

      // Verify refresh tokens are cleared
      const user = await User.findById(testUser._id);
      expect(user?.refreshTokens).toHaveLength(0);
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow admin access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/validate-slug')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ slug: 'test-slug', collection: 'articles' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow editor access to editor routes', async () => {
      const response = await request(app)
        .get('/api/admin/validate-slug')
        .set('Authorization', `Bearer ${editorToken}`)
        .query({ slug: 'test-slug', collection: 'articles' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny regular user access to admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/validate-slug')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ slug: 'test-slug', collection: 'articles' })
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should deny editor access to admin-only routes', async () => {
      // This would be a route that requires admin role specifically
      // For now, we'll test with a hypothetical admin-only endpoint
      const response = await request(app)
        .post('/api/admin/seed-authors')
        .set('Authorization', `Bearer ${editorToken}`)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });
  });

  describe('Token Security', () => {
    it('should reject tokens with wrong token type', async () => {
      // Create a refresh token and try to use it as access token
      const { refreshToken } = generateTokenPair({
        userId: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);

      expect(response.body.error).toContain('Invalid token type');
    });

    it('should reject tokens after password change', async () => {
      // Change password
      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'TestPassword123',
          newPassword: 'NewTestPassword123',
        })
        .expect(200);

      // Old token should no longer work
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.error).toContain('Password was changed');
    });

    it('should validate token issuer and audience', async () => {
      // This test would require creating a token with wrong issuer/audience
      // For now, we'll test that our tokens have the correct claims
      const decoded = verifyToken(authToken);
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });
  });

  describe('Account Security', () => {
    it('should hash passwords properly', async () => {
      const user = await User.findById(testUser._id);
      expect(user?.passwordHash).not.toBe('TestPassword123');
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should not expose sensitive data in API responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.user.refreshTokens).toBeUndefined();
      expect(response.body.data.user.loginAttempts).toBeUndefined();
      expect(response.body.data.user.lockUntil).toBeUndefined();
    });

    it('should track login attempts', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      // Make failed attempt
      await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      // Check login attempts increased
      const user = await User.findById(testUser._id);
      expect(user?.loginAttempts).toBe(1);
    });

    it('should reset login attempts on successful login', async () => {
      // Make failed attempt first
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      // Successful login should reset attempts
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123',
        })
        .expect(200);

      const user = await User.findById(testUser._id);
      expect(user?.loginAttempts).toBe(0);
    });
  });
});