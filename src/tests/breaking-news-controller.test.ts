import request from 'supertest';
import app from '../app';
import { BreakingNews } from '../models/BreakingNews';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('Breaking News Controller', () => {
  let adminToken: string;
  let adminUser: any;

  beforeAll(async () => {
    // Create admin user for testing
    adminUser = await User.create({
      fullName: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    // Generate JWT token
    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Clean up breaking news before each test
    await BreakingNews.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await BreakingNews.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET /api/breaking-news/active', () => {
    it('should return null when no active breaking news exists', async () => {
      const response = await request(app)
        .get('/api/breaking-news/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should return active breaking news when it exists', async () => {
      const breakingNews = await BreakingNews.create({
        text: 'Test breaking news',
        isActive: true,
        createdBy: adminUser._id
      });

      const response = await request(app)
        .get('/api/breaking-news/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeTruthy();
      expect(response.body.data.text).toBe('Test breaking news');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should not return inactive breaking news', async () => {
      await BreakingNews.create({
        text: 'Inactive breaking news',
        isActive: false,
        createdBy: adminUser._id
      });

      const response = await request(app)
        .get('/api/breaking-news/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });
  });

  describe('GET /api/admin/breaking-news', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/admin/breaking-news')
        .expect(401);
    });

    it('should return paginated breaking news for admin', async () => {
      // Create test breaking news
      await BreakingNews.create([
        { text: 'Breaking news 1', isActive: true, createdBy: adminUser._id },
        { text: 'Breaking news 2', isActive: false, createdBy: adminUser._id },
        { text: 'Breaking news 3', isActive: false, createdBy: adminUser._id }
      ]);

      const response = await request(app)
        .get('/api/admin/breaking-news')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.breakingNews).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.totalItems).toBe(3);
    });

    it('should support pagination', async () => {
      // Create multiple breaking news items
      const items = Array.from({ length: 15 }, (_, i) => ({
        text: `Breaking news ${i + 1}`,
        isActive: false,
        createdBy: adminUser._id
      }));
      await BreakingNews.create(items);

      const response = await request(app)
        .get('/api/admin/breaking-news?page=2&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.breakingNews).toHaveLength(5);
      expect(response.body.data.pagination.currentPage).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(3);
    });
  });

  describe('POST /api/admin/breaking-news', () => {
    it('should require authentication', async () => {
      await request(app)
        .post('/api/admin/breaking-news')
        .send({ text: 'Test breaking news' })
        .expect(401);
    });

    it('should create breaking news successfully', async () => {
      const breakingNewsData = {
        text: 'New breaking news alert',
        isActive: false
      };

      const response = await request(app)
        .post('/api/admin/breaking-news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(breakingNewsData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe(breakingNewsData.text);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.data.createdBy).toBeDefined();
    });

    it('should enforce single active constraint when creating active breaking news', async () => {
      // Create existing active breaking news
      await BreakingNews.create({
        text: 'Existing active news',
        isActive: true,
        createdBy: adminUser._id
      });

      const newBreakingNews = {
        text: 'New active breaking news',
        isActive: true
      };

      const response = await request(app)
        .post('/api/admin/breaking-news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newBreakingNews)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);

      // Check that only one breaking news is active
      const activeCount = await BreakingNews.countDocuments({ isActive: true });
      expect(activeCount).toBe(1);

      // Check that the new one is the active one
      const activeNews = await BreakingNews.findOne({ isActive: true });
      expect(activeNews?.text).toBe('New active breaking news');
    });

    it('should validate text length', async () => {
      const shortText = await request(app)
        .post('/api/admin/breaking-news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Hi' })
        .expect(400);

      expect(shortText.body.success).toBe(false);
      expect(shortText.body.message).toContain('at least 5 characters');

      const longText = await request(app)
        .post('/api/admin/breaking-news')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'a'.repeat(201) })
        .expect(400);

      expect(longText.body.success).toBe(false);
      expect(longText.body.message).toContain('cannot exceed 200 characters');
    });
  });

  describe('PUT /api/admin/breaking-news/:id', () => {
    let breakingNewsId: string;

    beforeEach(async () => {
      const breakingNews = await BreakingNews.create({
        text: 'Original breaking news',
        isActive: false,
        createdBy: adminUser._id
      });
      breakingNewsId = (breakingNews as any)._id.toString();
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/admin/breaking-news/${breakingNewsId}`)
        .send({ text: 'Updated text' })
        .expect(401);
    });

    it('should update breaking news successfully', async () => {
      const updateData = {
        text: 'Updated breaking news text',
        isActive: true
      };

      const response = await request(app)
        .put(`/api/admin/breaking-news/${breakingNewsId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe(updateData.text);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should enforce single active constraint when updating to active', async () => {
      // Create another active breaking news
      await BreakingNews.create({
        text: 'Another active news',
        isActive: true,
        createdBy: adminUser._id
      });

      const response = await request(app)
        .put(`/api/admin/breaking-news/${breakingNewsId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);

      // Check that only one breaking news is active
      const activeCount = await BreakingNews.countDocuments({ isActive: true });
      expect(activeCount).toBe(1);
    });

    it('should return 404 for non-existent breaking news', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/api/admin/breaking-news/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Updated text' })
        .expect(404);
    });
  });

  describe('DELETE /api/admin/breaking-news/:id', () => {
    let breakingNewsId: string;

    beforeEach(async () => {
      const breakingNews = await BreakingNews.create({
        text: 'Breaking news to delete',
        isActive: false,
        createdBy: adminUser._id
      });
      breakingNewsId = (breakingNews as any)._id.toString();
    });

    it('should require authentication', async () => {
      await request(app)
        .delete(`/api/admin/breaking-news/${breakingNewsId}`)
        .expect(401);
    });

    it('should delete breaking news successfully', async () => {
      const response = await request(app)
        .delete(`/api/admin/breaking-news/${breakingNewsId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify deletion
      const deletedNews = await BreakingNews.findById(breakingNewsId);
      expect(deletedNews).toBeNull();
    });

    it('should return 404 for non-existent breaking news', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/api/admin/breaking-news/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/admin/breaking-news/:id/toggle', () => {
    let breakingNewsId: string;

    beforeEach(async () => {
      const breakingNews = await BreakingNews.create({
        text: 'Breaking news to toggle',
        isActive: false,
        createdBy: adminUser._id
      });
      breakingNewsId = (breakingNews as any)._id.toString();
    });

    it('should require authentication', async () => {
      await request(app)
        .patch(`/api/admin/breaking-news/${breakingNewsId}/toggle`)
        .expect(401);
    });

    it('should activate inactive breaking news', async () => {
      const response = await request(app)
        .patch(`/api/admin/breaking-news/${breakingNewsId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.message).toContain('activated successfully');
    });

    it('should deactivate active breaking news', async () => {
      // First activate the breaking news
      await BreakingNews.findByIdAndUpdate(breakingNewsId, { isActive: true });

      const response = await request(app)
        .patch(`/api/admin/breaking-news/${breakingNewsId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.message).toContain('deactivated successfully');
    });

    it('should enforce single active constraint when activating', async () => {
      // Create another active breaking news
      await BreakingNews.create({
        text: 'Another active news',
        isActive: true,
        createdBy: adminUser._id
      });

      const response = await request(app)
        .patch(`/api/admin/breaking-news/${breakingNewsId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);

      // Check that only one breaking news is active
      const activeCount = await BreakingNews.countDocuments({ isActive: true });
      expect(activeCount).toBe(1);
    });
  });
});