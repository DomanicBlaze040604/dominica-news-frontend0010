import request from 'supertest';
import app from '../app';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';

describe('Category Controller', () => {
  let adminToken: string;
  let adminUser: any;

  beforeAll(async () => {
    // Create admin user for testing
    const userData = {
      email: 'admin@example.com',
      passwordHash: 'Password123',
      fullName: 'Admin User',
      role: 'admin',
    };

    adminUser = await new User(userData).save();
    adminToken = generateToken({
      userId: (adminUser._id as any).toString(),
      email: adminUser.email,
      role: adminUser.role,
    });
  });

  beforeEach(async () => {
    await Category.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Category.deleteMany({});
  });

  describe('GET /api/categories', () => {
    it('should get all categories ordered by displayOrder', async () => {
      // Create test categories
      await Category.create([
        { name: 'Sports', slug: 'sports', displayOrder: 2 },
        { name: 'Technology', slug: 'technology', displayOrder: 1 },
        { name: 'Entertainment', slug: 'entertainment', displayOrder: 3 },
      ]);

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(3);
      expect(response.body.data.count).toBe(3);

      // Check ordering
      expect(response.body.data.categories[0].name).toBe('Technology');
      expect(response.body.data.categories[1].name).toBe('Sports');
      expect(response.body.data.categories[2].name).toBe('Entertainment');
    });

    it('should return empty array when no categories exist', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toHaveLength(0);
      expect(response.body.data.count).toBe(0);
    });
  });

  describe('GET /api/categories/:slug', () => {
    it('should get category by slug', async () => {
      const category = await Category.create({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech news and updates',
        displayOrder: 1,
      });

      const response = await request(app)
        .get('/api/categories/technology')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Technology');
      expect(response.body.data.category.slug).toBe('technology');
      expect(response.body.data.category.description).toBe('Tech news and updates');
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Category not found');
    });
  });

  describe('GET /api/categories/:slug/articles', () => {
    it('should get category with empty articles array', async () => {
      const category = await Category.create({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech news',
      });

      const response = await request(app)
        .get('/api/categories/technology/articles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Technology');
      expect(response.body.data.articles).toEqual([]);
      expect(response.body.data.pagination.totalArticles).toBe(0);
    });

    it('should handle pagination parameters', async () => {
      const category = await Category.create({
        name: 'Technology',
        slug: 'technology',
      });

      const response = await request(app)
        .get('/api/categories/technology/articles?page=2&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.currentPage).toBe(2);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/non-existent/articles')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Category not found');
    });
  });

  describe('POST /api/categories', () => {
    it('should create category with valid data', async () => {
      const categoryData = {
        name: 'Technology',
        description: 'Tech news and updates',
        displayOrder: 1,
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.data.category.name).toBe('Technology');
      expect(response.body.data.category.slug).toBe('technology');
      expect(response.body.data.category.description).toBe('Tech news and updates');
      expect(response.body.data.category.displayOrder).toBe(1);

      // Verify in database
      const category = await Category.findOne({ slug: 'technology' });
      expect(category).toBeTruthy();
    });

    it('should create category with minimal data', async () => {
      const categoryData = {
        name: 'Sports',
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Sports');
      expect(response.body.data.category.slug).toBe('sports');
      expect(response.body.data.category.displayOrder).toBe(0);
    });

    it('should generate unique slug for duplicate names', async () => {
      // Create first category
      await Category.create({
        name: 'Technology',
        slug: 'technology',
      });

      const categoryData = {
        name: 'Technology',
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.slug).toBe('technology-1');
    });

    it('should require authentication', async () => {
      const categoryData = {
        name: 'Technology',
      };

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token is required');
    });

    it('should require admin role', async () => {
      // Create regular user
      const regularUser = await new User({
        email: 'user@example.com',
        passwordHash: 'Password123',
        fullName: 'Regular User',
        role: 'user',
      }).save();

      const userToken = generateToken({
        userId: (regularUser._id as any).toString(),
        email: regularUser.email,
        role: regularUser.role,
      });

      const categoryData = {
        name: 'Technology',
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send(categoryData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');

      await User.findByIdAndDelete(regularUser._id);
    });

    it('should validate category data', async () => {
      const invalidData = {
        name: 'A', // Too short
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/categories/:id', () => {
    let category: any;

    beforeEach(async () => {
      category = await Category.create({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech news',
        displayOrder: 1,
      });
    });

    it('should update category with valid data', async () => {
      const updateData = {
        name: 'Tech News',
        description: 'Updated tech news',
        displayOrder: 2,
      };

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category updated successfully');
      expect(response.body.data.category.name).toBe('Tech News');
      expect(response.body.data.category.slug).toBe('tech-news');
      expect(response.body.data.category.description).toBe('Updated tech news');
      expect(response.body.data.category.displayOrder).toBe(2);
    });

    it('should update only provided fields', async () => {
      const updateData = {
        description: 'Updated description only',
      };

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category.name).toBe('Technology'); // Unchanged
      expect(response.body.data.category.slug).toBe('technology'); // Unchanged
      expect(response.body.data.category.description).toBe('Updated description only');
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Category not found');
    });

    it('should require authentication', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .put(`/api/categories/${category._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    let category: any;

    beforeEach(async () => {
      category = await Category.create({
        name: 'Technology',
        slug: 'technology',
      });
    });

    it('should delete category', async () => {
      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Category deleted successfully');

      // Verify deletion
      const deletedCategory = await Category.findById(category._id);
      expect(deletedCategory).toBeNull();
    });

    it('should return 404 for non-existent category', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Category not found');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require admin role', async () => {
      // Create regular user
      const regularUser = await new User({
        email: 'user@example.com',
        passwordHash: 'Password123',
        fullName: 'Regular User',
        role: 'user',
      }).save();

      const userToken = generateToken({
        userId: (regularUser._id as any).toString(),
        email: regularUser.email,
        role: regularUser.role,
      });

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');

      await User.findByIdAndDelete(regularUser._id);
    });
  });
});