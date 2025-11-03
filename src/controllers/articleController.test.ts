import request from 'supertest';
import app from '../app';
import Article from '../models/Article';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';

describe('Article Controller', () => {
  let testCategory: any;
  let testUser: any;
  let adminToken: string;
  let testArticle: any;

  beforeAll(async () => {
    // Create test category
    testCategory = await Category.create({
      name: 'Technology',
      slug: 'technology',
      description: 'Technology related articles',
    });

    // Create test user (admin)
    testUser = await User.create({
      email: 'admin@example.com',
      passwordHash: 'testpassword123',
      fullName: 'Test Admin',
      role: 'admin',
    });

    // Generate admin token
    adminToken = generateToken({
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role,
    });
  });

  beforeEach(async () => {
    await Article.deleteMany({});
    
    // Create a test article for each test
    testArticle = await Article.create({
      title: 'Test Article',
      slug: 'test-article',
      excerpt: 'This is a test article excerpt',
      content: 'This is the full content of the test article. It contains enough text to meet the minimum requirements for article content.',
      featuredImage: '/images/test-image.jpg',
      categoryId: testCategory._id,
      authorId: testUser._id,
      status: 'published',
      publishedAt: new Date(),
    });
  });

  afterAll(async () => {
    await Article.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
  });

  describe('Public Article Endpoints', () => {
    describe('GET /api/articles', () => {
      beforeEach(async () => {
        // Create additional test articles
        await Article.create([
          {
            title: 'Published Article 1',
            slug: 'published-article-1',
            content: 'This is published content that meets the minimum length requirement for testing purposes.',
            categoryId: testCategory._id,
            authorId: testUser._id,
            status: 'published',
            publishedAt: new Date('2023-01-01'),
          },
          {
            title: 'Draft Article',
            slug: 'draft-article',
            content: 'This is draft content that meets the minimum length requirement for testing purposes.',
            categoryId: testCategory._id,
            authorId: testUser._id,
            status: 'draft',
          },
        ]);
      });

      it('should return published articles only', async () => {
        const response = await request(app)
          .get('/api/articles')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.articles).toHaveLength(2); // Only published articles
        expect(response.body.data.articles.every((article: any) => article.status === 'published')).toBe(true);
      });

      it('should return articles with populated category and author', async () => {
        const response = await request(app)
          .get('/api/articles')
          .expect(200);

        const article = response.body.data.articles[0];
        expect(article.category).toBeDefined();
        expect(article.category.name).toBe('Technology');
        expect(article.author).toBeDefined();
        expect(article.author.fullName).toBe('Test Admin');
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/articles?page=1&limit=1')
          .expect(200);

        expect(response.body.data.articles).toHaveLength(1);
        expect(response.body.data.pagination.currentPage).toBe(1);
        expect(response.body.data.pagination.totalArticles).toBe(2);
        expect(response.body.data.pagination.totalPages).toBe(2);
      });

      it('should filter by category', async () => {
        const response = await request(app)
          .get(`/api/articles?category=${testCategory.slug}`)
          .expect(200);

        expect(response.body.data.articles).toHaveLength(2);
        expect(response.body.data.articles.every((article: any) => 
          article.category.slug === testCategory.slug
        )).toBe(true);
      });

      it('should return 404 for invalid category filter', async () => {
        const response = await request(app)
          .get('/api/articles?category=nonexistent')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Category not found');
      });
    });

    describe('GET /api/articles/:slug', () => {
      it('should return published article by slug', async () => {
        const response = await request(app)
          .get(`/api/articles/${testArticle.slug}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.article.title).toBe(testArticle.title);
        expect(response.body.data.article.content).toBe(testArticle.content);
        expect(response.body.data.article.category).toBeDefined();
        expect(response.body.data.article.author).toBeDefined();
      });

      it('should return 404 for non-existent article', async () => {
        const response = await request(app)
          .get('/api/articles/non-existent-slug')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Article not found');
      });

      it('should return 404 for draft article', async () => {
        const draftArticle = await Article.create({
          title: 'Draft Article',
          slug: 'draft-article-test',
          content: 'This is draft content that meets the minimum length requirement for testing purposes.',
          categoryId: testCategory._id,
          authorId: testUser._id,
          status: 'draft',
        });

        const response = await request(app)
          .get(`/api/articles/${draftArticle.slug}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Article not found');
      });
    });

    describe('GET /api/articles/:slug/related', () => {
      beforeEach(async () => {
        // Create related articles in the same category
        await Article.create([
          {
            title: 'Related Article 1',
            slug: 'related-article-1',
            content: 'This is related content that meets the minimum length requirement for testing purposes.',
            categoryId: testCategory._id,
            authorId: testUser._id,
            status: 'published',
            publishedAt: new Date('2023-01-01'),
          },
          {
            title: 'Related Article 2',
            slug: 'related-article-2',
            content: 'This is another related content that meets the minimum length requirement for testing purposes.',
            categoryId: testCategory._id,
            authorId: testUser._id,
            status: 'published',
            publishedAt: new Date('2023-01-02'),
          },
        ]);
      });

      it('should return related articles from same category', async () => {
        const response = await request(app)
          .get(`/api/articles/${testArticle.slug}/related`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.articles).toHaveLength(2);
        expect(response.body.data.articles.every((article: any) => 
          article.category.slug === testCategory.slug && article.slug !== testArticle.slug
        )).toBe(true);
      });

      it('should limit related articles', async () => {
        const response = await request(app)
          .get(`/api/articles/${testArticle.slug}/related?limit=1`)
          .expect(200);

        expect(response.body.data.articles).toHaveLength(1);
        expect(response.body.data.count).toBe(1);
      });

      it('should return 404 for non-existent article', async () => {
        const response = await request(app)
          .get('/api/articles/non-existent-slug/related')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Article not found');
      });
    });
  });

  describe('Admin Article Endpoints', () => {
    describe('GET /api/admin/articles', () => {
      beforeEach(async () => {
        // Create additional test articles with different statuses
        await Article.create([
          {
            title: 'Draft Article 1',
            slug: 'draft-article-1',
            content: 'This is draft content that meets the minimum length requirement for testing purposes.',
            categoryId: testCategory._id,
            authorId: testUser._id,
            status: 'draft',
          },
          {
            title: 'Published Article 1',
            slug: 'published-article-1',
            content: 'This is published content that meets the minimum length requirement for testing purposes.',
            categoryId: testCategory._id,
            authorId: testUser._id,
            status: 'published',
            publishedAt: new Date('2023-01-01'),
          },
        ]);
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/admin/articles')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access token is required');
      });

      it('should return all articles for admin', async () => {
        const response = await request(app)
          .get('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.articles).toHaveLength(3); // All articles including drafts
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/api/admin/articles?status=draft')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.articles).toHaveLength(1);
        expect(response.body.data.articles[0].status).toBe('draft');
      });

      it('should filter by category', async () => {
        const response = await request(app)
          .get(`/api/admin/articles?category=${testCategory.slug}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.articles).toHaveLength(3);
        expect(response.body.data.articles.every((article: any) => 
          article.category.slug === testCategory.slug
        )).toBe(true);
      });
    });

    describe('POST /api/admin/articles', () => {
      const validArticleData = {
        title: 'New Test Article',
        excerpt: 'This is a new test article excerpt',
        content: 'This is the full content of the new test article. It contains enough text to meet the minimum requirements for article content.',
        featuredImage: '/images/new-test-image.jpg',
        categoryId: '',
        status: 'draft',
      };

      beforeEach(() => {
        validArticleData.categoryId = testCategory._id.toString();
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/admin/articles')
          .send(validArticleData)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access token is required');
      });

      it('should create article with valid data', async () => {
        const response = await request(app)
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validArticleData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Article created successfully');
        expect(response.body.data.article.title).toBe(validArticleData.title);
        expect(response.body.data.article.status).toBe('draft');
        expect(response.body.data.article.slug).toBe('new-test-article');
      });

      it('should create published article and set publishedAt', async () => {
        const publishedArticleData = {
          ...validArticleData,
          status: 'published',
        };

        const response = await request(app)
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(publishedArticleData)
          .expect(201);

        expect(response.body.data.article.status).toBe('published');
        expect(response.body.data.article.publishedAt).toBeDefined();
      });

      it('should return 400 for missing required fields', async () => {
        const invalidData: any = { ...validArticleData };
        delete invalidData.title;

        const response = await request(app)
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });

      it('should return 404 for invalid category', async () => {
        const invalidData = {
          ...validArticleData,
          categoryId: '507f1f77bcf86cd799439011', // Valid ObjectId but non-existent
        };

        const response = await request(app)
          .post('/api/admin/articles')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Category not found');
      });
    });

    describe('PUT /api/admin/articles/:id', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .put(`/api/admin/articles/${testArticle._id}`)
          .send({ title: 'Updated Title' })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access token is required');
      });

      it('should update article with valid data', async () => {
        const updateData = {
          title: 'Updated Test Article',
          excerpt: 'Updated excerpt',
          content: 'This is the updated content of the test article. It contains enough text to meet the minimum requirements.',
        };

        const response = await request(app)
          .put(`/api/admin/articles/${testArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Article updated successfully');
        expect(response.body.data.article.title).toBe(updateData.title);
        expect(response.body.data.article.excerpt).toBe(updateData.excerpt);
        expect(response.body.data.article.slug).toBe('updated-test-article'); // Slug should update with title
      });

      it('should update article status and handle publishedAt', async () => {
        // First, create a draft article
        const draftArticle = await Article.create({
          title: 'Draft Article',
          slug: 'draft-article-status-test',
          content: 'This is draft content that meets the minimum length requirement for testing purposes.',
          categoryId: testCategory._id,
          authorId: testUser._id,
          status: 'draft',
        });

        // Update to published
        const response = await request(app)
          .put(`/api/admin/articles/${draftArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'published' })
          .expect(200);

        expect(response.body.data.article.status).toBe('published');
        expect(response.body.data.article.publishedAt).toBeDefined();

        // Update back to draft
        const response2 = await request(app)
          .put(`/api/admin/articles/${draftArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'draft' })
          .expect(200);

        expect(response2.body.data.article.status).toBe('draft');
        expect(response2.body.data.article.publishedAt).toBeUndefined();
      });

      it('should return 404 for non-existent article', async () => {
        const response = await request(app)
          .put('/api/admin/articles/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Updated Title' })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Article not found');
      });

      it('should return 404 for invalid category update', async () => {
        const response = await request(app)
          .put(`/api/admin/articles/${testArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ categoryId: '507f1f77bcf86cd799439011' })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Category not found');
      });
    });

    describe('DELETE /api/admin/articles/:id', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .delete(`/api/admin/articles/${testArticle._id}`)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access token is required');
      });

      it('should delete article successfully', async () => {
        const response = await request(app)
          .delete(`/api/admin/articles/${testArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Article deleted successfully');

        // Verify article is deleted
        const deletedArticle = await Article.findById(testArticle._id);
        expect(deletedArticle).toBeNull();
      });

      it('should return 404 for non-existent article', async () => {
        const response = await request(app)
          .delete('/api/admin/articles/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Article not found');
      });
    });

    describe('GET /api/admin/articles/:id', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .get(`/api/admin/articles/${testArticle._id}`)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access token is required');
      });

      it('should return article by id for admin', async () => {
        const response = await request(app)
          .get(`/api/admin/articles/${testArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.article.title).toBe(testArticle.title);
        expect(response.body.data.article.content).toBe(testArticle.content);
        expect(response.body.data.article.category).toBeDefined();
        expect(response.body.data.article.author).toBeDefined();
      });

      it('should return draft articles for admin', async () => {
        const draftArticle = await Article.create({
          title: 'Draft Article',
          slug: 'draft-article-admin-test',
          content: 'This is draft content that meets the minimum length requirement for testing purposes.',
          categoryId: testCategory._id,
          authorId: testUser._id,
          status: 'draft',
        });

        const response = await request(app)
          .get(`/api/admin/articles/${draftArticle._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data.article.status).toBe('draft');
      });

      it('should return 404 for non-existent article', async () => {
        const response = await request(app)
          .get('/api/admin/articles/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Article not found');
      });
    });
  });

  describe('Access Control', () => {
    it('should deny access to admin endpoints without token', async () => {
      const endpoints = [
        { method: 'get', path: '/api/admin/articles' },
        { method: 'post', path: '/api/admin/articles' },
        { method: 'put', path: `/api/admin/articles/${testArticle._id}` },
        { method: 'delete', path: `/api/admin/articles/${testArticle._id}` },
        { method: 'get', path: `/api/admin/articles/${testArticle._id}` },
      ];

      for (const endpoint of endpoints) {
        let response;
        if (endpoint.method === 'get') {
          response = await request(app).get(endpoint.path).expect(401);
        } else if (endpoint.method === 'post') {
          response = await request(app).post(endpoint.path).expect(401);
        } else if (endpoint.method === 'put') {
          response = await request(app).put(endpoint.path).expect(401);
        } else if (endpoint.method === 'delete') {
          response = await request(app).delete(endpoint.path).expect(401);
        }

        expect(response!.body.success).toBe(false);
        expect(response!.body.error).toBe('Access token is required');
      }
    });

    it('should deny access to admin endpoints with invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';

      const response = await request(app)
        .get('/api/admin/articles')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('should allow access to public endpoints without authentication', async () => {
      const publicEndpoints = [
        '/api/articles',
        `/api/articles/${testArticle.slug}`,
        `/api/articles/${testArticle.slug}/related`,
      ];

      for (const endpoint of publicEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });
});