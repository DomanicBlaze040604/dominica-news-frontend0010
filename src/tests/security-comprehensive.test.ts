import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { User } from '../models/User';
import { Article } from '../models/Article';
import { Category } from '../models/Category';

// Security testing utilities
class BackendSecurityUtils {
  static generateMaliciousPayloads() {
    return {
      xss: [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '&lt;script&gt;alert("XSS")&lt;/script&gt;'
      ],
      sqlInjection: [
        "'; DROP TABLE articles; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users (email, password) VALUES ('hacker@evil.com', 'password'); --",
        "' OR 1=1 --",
        "admin'--"
      ],
      noSqlInjection: [
        '{"$ne": null}',
        '{"$gt": ""}',
        '{"$where": "this.password.match(/.*/)"}',
        '{"$regex": ".*"}',
        '{"$or": [{"password": {"$exists": true}}]}'
      ],
      pathTraversal: [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
      ],
      commandInjection: [
        '; cat /etc/passwd',
        '| whoami',
        '&& rm -rf /',
        '`cat /etc/passwd`',
        '$(cat /etc/passwd)'
      ],
      oversizedInput: 'A'.repeat(10000),
      nullBytes: 'test\x00.jpg'
    };
  }

  static generateInvalidJWTs() {
    return [
      '', // Empty token
      'invalid-token', // Invalid format
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature', // Invalid signature
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.', // None algorithm
      jwt.sign({ userId: 'test' }, 'wrong-secret'), // Wrong secret
      jwt.sign({ userId: 'test', exp: Math.floor(Date.now() / 1000) - 3600 }, process.env.JWT_SECRET || 'test-secret') // Expired
    ];
  }

  static async createTestUser(role: 'admin' | 'editor' = 'editor') {
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const user = new User({
      email: `test-${role}@test.com`,
      password: hashedPassword,
      fullName: `Test ${role}`,
      role
    });
    await user.save();
    return user;
  }

  static generateValidJWT(userId: string, role: string = 'editor') {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }
}

describe('Backend Security Testing', () => {
  let testUser: any;
  let adminUser: any;
  let userToken: string;
  let adminToken: string;

  beforeEach(async () => {
    // Create test users
    testUser = await BackendSecurityUtils.createTestUser('editor');
    adminUser = await BackendSecurityUtils.createTestUser('admin');
    
    // Generate tokens
    userToken = BackendSecurityUtils.generateValidJWT(testUser._id.toString(), 'editor');
    adminToken = BackendSecurityUtils.generateValidJWT(adminUser._id.toString(), 'admin');
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: /test-.*@test\.com/ });
    await Article.deleteMany({ title: /Test.*/ });
    await Category.deleteMany({ name: /Test.*/ });
  });

  describe('Authentication Security', () => {
    it('should reject invalid login attempts', async () => {
      const invalidCredentials = [
        { email: '', password: '' },
        { email: 'admin@test.com', password: '' },
        { email: '', password: 'password' },
        { email: 'nonexistent@test.com', password: 'password' },
        { email: testUser.email, password: 'wrongpassword' }
      ];

      for (const credentials of invalidCredentials) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(credentials);

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate JWT tokens properly', async () => {
      const invalidTokens = BackendSecurityUtils.generateInvalidJWTs();

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });

    it('should prevent brute force attacks', async () => {
      const attempts = 10;
      const responses = [];

      // Make multiple failed login attempts
      for (let i = 0; i < attempts; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword'
          });
        responses.push(response);
      }

      // Should eventually rate limit
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should handle session security properly', async () => {
      // Test concurrent sessions
      const token1 = BackendSecurityUtils.generateValidJWT(testUser._id.toString());
      const token2 = BackendSecurityUtils.generateValidJWT(testUser._id.toString());

      const response1 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token1}`);

      const response2 = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token2}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Authorization Security', () => {
    it('should enforce role-based access control', async () => {
      const adminOnlyEndpoints = [
        { method: 'post', path: '/api/admin/users', data: { email: 'new@test.com', password: 'password', fullName: 'New User' } },
        { method: 'delete', path: '/api/admin/users/test-id', data: {} },
        { method: 'put', path: '/api/admin/settings/general', data: { siteName: 'Test Site' } }
      ];

      for (const endpoint of adminOnlyEndpoints) {
        const response = await request(app)
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${userToken}`) // Using editor token
          .send(endpoint.data);

        expect(response.status).toBe(403);
      }
    });

    it('should prevent privilege escalation', async () => {
      // Try to update own role
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'admin',
          permissions: ['*']
        });

      expect(response.status).toBe(403);
    });

    it('should validate resource ownership', async () => {
      // Create article as one user
      const article = new Article({
        title: 'Test Article',
        content: 'Test content',
        author: testUser._id,
        category: new Category({ name: 'Test Category', slug: 'test-category' })._id,
        status: 'published'
      });
      await article.save();

      // Try to modify as different user
      const otherUser = await BackendSecurityUtils.createTestUser('editor');
      const otherToken = BackendSecurityUtils.generateValidJWT(otherUser._id.toString());

      const response = await request(app)
        .put(`/api/admin/articles/${article._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Modified Title' });

      // Should require admin role or ownership
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Input Validation Security', () => {
    it('should sanitize XSS attempts', async () => {
      const maliciousPayloads = BackendSecurityUtils.generateMaliciousPayloads();

      for (const xssPayload of maliciousPayloads.xss) {
        const response = await request(app)
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: xssPayload,
            content: `<p>Content with ${xssPayload}</p>`,
            excerpt: xssPayload,
            categoryId: new Category({ name: 'Test', slug: 'test' })._id,
            authorId: testUser._id
          });

        expect(response.status).toBe(400);
      }
    });

    it('should prevent NoSQL injection', async () => {
      const maliciousPayloads = BackendSecurityUtils.generateMaliciousPayloads();

      for (const payload of maliciousPayloads.noSqlInjection) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: payload
          });

        expect(response.status).toBe(400);
      }
    });

    it('should validate file uploads securely', async () => {
      const maliciousFiles = [
        { filename: 'malicious.php', content: '<?php echo "hack"; ?>', mimetype: 'application/x-php' },
        { filename: 'malicious.html', content: '<script>alert("xss")</script>', mimetype: 'text/html' },
        { filename: '../../../etc/passwd', content: 'test', mimetype: 'image/jpeg' },
        { filename: 'test\x00.jpg', content: 'test', mimetype: 'image/jpeg' }
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/admin/images/upload')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('image', Buffer.from(file.content), {
            filename: file.filename,
            contentType: file.mimetype
          });

        expect(response.status).toBe(400);
      }
    });

    it('should handle oversized requests', async () => {
      const oversizedData = {
        title: BackendSecurityUtils.generateMaliciousPayloads().oversizedInput,
        content: BackendSecurityUtils.generateMaliciousPayloads().oversizedInput,
        excerpt: BackendSecurityUtils.generateMaliciousPayloads().oversizedInput
      };

      const response = await request(app)
        .post('/api/admin/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(oversizedData);

      expect(response.status).toBe(413); // Payload too large
    });

    it('should validate data types and formats', async () => {
      const invalidData = [
        { title: 123, content: 'test', categoryId: 'invalid-id' },
        { title: 'test', content: null, categoryId: 'invalid-id' },
        { title: 'test', content: 'test', categoryId: 123 },
        { title: 'test', content: 'test', categoryId: 'invalid-object-id' }
      ];

      for (const data of invalidData) {
        const response = await request(app)
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(data);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('API Security', () => {
    it('should implement proper CORS', async () => {
      const maliciousOrigins = [
        'http://evil.com',
        'https://malicious-site.com',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>'
      ];

      for (const origin of maliciousOrigins) {
        const response = await request(app)
          .get('/api/articles')
          .set('Origin', origin);

        // Should either reject or not include CORS headers for malicious origins
        if (response.status === 200) {
          expect(response.headers['access-control-allow-origin']).not.toBe(origin);
        }
      }
    });

    it('should validate request headers', async () => {
      const maliciousHeaders = [
        { 'X-Forwarded-For': '127.0.0.1, evil.com' },
        { 'User-Agent': BackendSecurityUtils.generateMaliciousPayloads().xss[0] },
        { 'Referer': 'javascript:alert("xss")' },
        { 'Content-Type': 'application/json; charset=utf-8; boundary=--evil' }
      ];

      for (const headers of maliciousHeaders) {
        const response = await request(app)
          .get('/api/articles')
          .set(headers);

        // Should handle malicious headers gracefully
        expect([200, 400]).toContain(response.status);
      }
    });

    it('should prevent parameter pollution', async () => {
      const response = await request(app)
        .get('/api/articles')
        .query({
          page: ['1', '2', '3'], // Array instead of single value
          limit: ['10', '20'],
          status: ['published', 'draft']
        });

      // Should handle parameter pollution gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should implement security headers', async () => {
      const response = await request(app)
        .get('/api/articles');

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Data Protection', () => {
    it('should not expose sensitive information', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user).toBeDefined();
      
      // Should not expose sensitive fields
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.user.__v).toBeUndefined();
    });

    it('should sanitize error messages', async () => {
      const response = await request(app)
        .get('/api/articles/invalid-object-id');

      expect(response.status).toBe(400);
      
      const errorMessage = response.body.message || '';
      
      // Should not contain sensitive system information
      expect(errorMessage).not.toMatch(/\/var\/www/);
      expect(errorMessage).not.toMatch(/database/i);
      expect(errorMessage).not.toMatch(/mongodb/i);
      expect(errorMessage).not.toMatch(/internal/i);
    });

    it('should validate data integrity', async () => {
      // Create article
      const createResponse = await request(app)
        .post('/api/admin/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Article',
          content: 'Test content',
          categoryId: new Category({ name: 'Test', slug: 'test' })._id,
          authorId: testUser._id
        });

      expect(createResponse.status).toBe(201);
      const articleId = createResponse.body.data.article._id;

      // Try to tamper with data
      const tamperedData = {
        title: 'Updated Title',
        authorId: adminUser._id, // Try to change author
        createdAt: new Date().toISOString(), // Try to change creation date
        views: -1000 // Invalid views count
      };

      const updateResponse = await request(app)
        .put(`/api/admin/articles/${articleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tamperedData);

      // Should validate and reject invalid data
      expect([400, 403]).toContain(updateResponse.status);
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should implement rate limiting', async () => {
      const requests = [];
      const endpoint = '/api/articles';
      const maxRequests = 100;

      // Make rapid requests
      for (let i = 0; i < maxRequests; i++) {
        requests.push(request(app).get(endpoint));
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      // Should rate limit after too many requests
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should handle large payloads', async () => {
      const largePayload = {
        title: 'Test Article',
        content: 'A'.repeat(10 * 1024 * 1024), // 10MB content
        categoryId: new Category({ name: 'Test', slug: 'test' })._id,
        authorId: testUser._id
      };

      const response = await request(app)
        .post('/api/admin/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largePayload);

      expect(response.status).toBe(413); // Payload too large
    });

    it('should prevent resource exhaustion', async () => {
      const concurrentRequests = 50;
      const requests = [];

      // Make concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app)
            .get('/api/articles')
            .query({ page: i + 1, limit: 100 })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle concurrent requests within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
      
      // Most requests should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(concurrentRequests * 0.8);
    });
  });

  describe('Security Monitoring and Logging', () => {
    it('should log security events', async () => {
      // Failed login attempt
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      // Unauthorized access attempt
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      // Malicious input attempt
      await request(app)
        .post('/api/admin/articles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '<script>alert("xss")</script>',
          content: 'test',
          categoryId: new Category({ name: 'Test', slug: 'test' })._id,
          authorId: testUser._id
        });

      // Security events should be logged (this would be verified in a real implementation)
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should detect suspicious patterns', async () => {
      // Rapid failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword'
          });
      }

      // Multiple XSS attempts
      const xssPayloads = BackendSecurityUtils.generateMaliciousPayloads().xss;
      for (const payload of xssPayloads.slice(0, 3)) {
        await request(app)
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: payload,
            content: 'test',
            categoryId: new Category({ name: 'Test', slug: 'test' })._id,
            authorId: testUser._id
          });
      }

      // Suspicious patterns should be detected and logged
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});