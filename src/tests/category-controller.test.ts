import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import app from '../app';
import { Category } from '../models/Category';
import Article from '../models/Article';
import Author from '../models/Author';

describe('Category Controller Tests', () => {
  let authToken: string;
  let testCategory: any;
  let testAuthor: any;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/dominica-news-test');
    }

    // Create test author for articles
    testAuthor = await Author.create({
      name: 'Test Author',
      email: 'test@example.com',
      role: 'Staff Writer',
      isActive: true,
    });

    // Get auth token for protected routes
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL || 'admin@dominicanews.dm',
        password: process.env.ADMIN_PASSWORD || 'admin123',
      });

    if (authResponse.body.success) {
      authToken = authResponse.body.data.token;
    }
  });

  beforeEach(async () => {
    // Clean up categories before each test
    await Category.deleteMany({});
    await Article.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await Category.deleteMany({});
    await Article.deleteMany({});
    await Author.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/categories', () => {
    it('should get all categories', async () => {
      // Create test categories
      await Category.create([
        { name: 'News', slug: 'news', displayOrder: 1 },
        { name: 'Sports', slug: 'sports', displayOrder: 2 },
      ]);

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('News');
      expect(response.body.data[1].name).toBe('Sports');
    });

    it('should return empty array when no categories exist', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/categories/:slug', () => {
    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech news and updates',
        displayOrder: 1,
      });
    });

    it('should get category by slug', async () => {
      const response = await request(app)
        .get('/api/categories/technology')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Technology');
      expect(response.body.data.category.slug).toBe('technology');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Category not found');
    });
  });

  describe('GET /api/categories/check-slug/:slug', () => {
    beforeEach(async () => {
      await Category.create({
        name: 'Existing Category',
        slug: 'existing-category',
        displayOrder: 1,
      });
    });

    it('should return available false for existing slug', async () => {
      const response = await request(app)
        .get('/api/categories/check-slug/existing-category')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(false);
    });

    it('should return available true for new slug', async () => {
      const response = await request(app)
        .get('/api/categories/check-slug/new-category')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
    });

    it('should exclude specified category ID from check', async () => {
      const category = await Category.findOne({ slug: 'existing-category' });
      
      const response = await request(app)
        .get(`/api/categories/check-slug/existing-category?excludeId=${category!._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available).toBe(true);
    });
  });

  describe('GET /api/categories/:slug/preview', () => {
    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'News',
        slug: 'news',
        description: 'Latest news',
        displayOrder: 1,
      });

      // Create test articles
      await Article.create([
        {
          title: 'Article 1',
          slug: 'article-1',
          content: 'Content 1',
          excerpt: 'Excerpt 1',
          author: testAuthor._id,
          category: testCategory._id,
          status: 'published',
          publishedAt: new Date(),
        },
        {
          title: 'Article 2',
          slug: 'article-2',
          content: 'Content 2',
          excerpt: 'Excerpt 2',
          author: testAuthor._id,
          category: testCategory._id,
          status: 'published',
          publishedAt: new Date(),
        },
      ]);
    });

    it('should get category preview with articles', async () => {
      const response = await request(app)
        .get('/api/categories/news/preview')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('News');
      expect(response.body.data.articles).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
    });

    it('should limit articles in preview', async () => {
      const response = await request(app)
        .get('/api/categories/news/preview?limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.articles).toHaveLength(1);
      expect(response.body.data.count).toBe(2); // Total count should still be 2
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category with auto-generated slug', async () => {
      const categoryData = {
        name: 'Breaking News',
        description: 'Urgent news updates',
        displayOrder: 1,
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Breaking News');
      expect(response.body.data.category.slug).toBe('breaking-news');
    });

    it('should create category with custom slug', async () => {
      const categoryData = {
        name: 'World News',
        slug: 'global-news',
        description: 'International updates',
        displayOrder: 2,
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.slug).toBe('global-news');
    });

    it('should generate unique slug when duplicate exists', async () => {
      // Create first category
      await Category.create({
        name: 'Sports',
        slug: 'sports',
        displayOrder: 1,
      });

      const categoryData = {
        name: 'Sports News',
        // No slug provided, should generate from name
        description: 'Sports coverage',
        displayOrder: 2,
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.slug).toBe('sports-news');
    });

    it('should require authentication', async () => {
      const categoryData = {
        name: 'Test Category',
        description: 'Test description',
      };

      await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/categories/:id', () => {
    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Original Name',
        slug: 'original-name',
        description: 'Original description',
        displayOrder: 1,
      });
    });

    it('should update category', async () => {
      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        displayOrder: 2,
      };

      const response = await request(app)
        .put(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Updated Name');
      expect(response.body.data.category.slug).toBe('updated-name');
    });

    it('should update slug when name changes', async () => {
      const updateData = {
        name: 'Completely New Name',
      };

      const response = await request(app)
        .put(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.slug).toBe('completely-new-name');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    beforeEach(async () => {
      testCategory = await Category.create({
        name: 'Test Category',
        slug: 'test-category',
        displayOrder: 1,
      });
    });

    it('should delete category without articles', async () => {
      const response = await request(app)
        .delete(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully');
    });

    it('should prevent deletion of category with articles', async () => {
      // Create article in this category
      await Article.create({
        title: 'Test Article',
        slug: 'test-article',
        content: 'Test content',
        excerpt: 'Test excerpt',
        author: testAuthor._id,
        category: testCategory._id,
        status: 'published',
      });

      const response = await request(app)
        .delete(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete category with articles');
      expect(response.body.data.requiresReassignment).toBe(true);
    });

    it('should force delete category and reassign articles to uncategorized', async () => {
      // Create article in this category
      await Article.create({
        title: 'Test Article',
        slug: 'test-article',
        content: 'Test content',
        excerpt: 'Test excerpt',
        author: testAuthor._id,
        category: testCategory._id,
        status: 'published',
      });

      const response = await request(app)
        .delete(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ forceDelete: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.articlesReassigned).toBe(1);

      // Check that uncategorized category was created
      const uncategorized = await Category.findOne({ slug: 'uncategorized' });
      expect(uncategorized).toBeTruthy();

      // Check that article was reassigned
      const article = await Article.findOne({ slug: 'test-article' });
      expect(article!.category.toString()).toBe(uncategorized!._id.toString());
    });

    it('should reassign articles to specified category', async () => {
      // Create another category for reassignment
      const reassignCategory = await Category.create({
        name: 'Reassign Category',
        slug: 'reassign-category',
        displayOrder: 2,
      });

      // Create article in test category
      await Article.create({
        title: 'Test Article',
        slug: 'test-article',
        content: 'Test content',
        excerpt: 'Test excerpt',
        author: testAuthor._id,
        category: testCategory._id,
        status: 'published',
      });

      const response = await request(app)
        .delete(`/api/categories/${testCategory._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reassignTo: reassignCategory._id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.articlesReassigned).toBe(1);

      // Check that article was reassigned
      const article = await Article.findOne({ slug: 'test-article' });
      expect(article!.category.toString()).toBe(reassignCategory._id.toString());
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});