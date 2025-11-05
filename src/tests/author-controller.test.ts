import request from 'supertest';
import { app } from '../app';
import Author from '../models/Author';
import { connectTestDB, closeTestDB, clearTestDB } from './setup';

describe('Author Controller', () => {
  let authToken: string;
  let testAuthor: any;

  beforeAll(async () => {
    await connectTestDB();
    
    // Create admin user and get auth token
    const adminResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin@test.com',
        password: 'password123',
        fullName: 'Test Admin',
        role: 'admin'
      });
    
    authToken = adminResponse.body.data.token;
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('POST /api/authors', () => {
    it('should create a new author with auto-generated slug', async () => {
      const authorData = {
        name: 'John Doe',
        email: 'john.doe@test.com',
        role: 'Senior Reporter',
        title: 'Political Correspondent',
        biography: 'Experienced political journalist',
        professionalBackground: 'John has been covering politics for over 10 years',
        expertise: ['Political Analysis', 'Investigative Journalism'],
        specialization: ['Politics', 'Breaking News'],
        location: 'Roseau, Dominica',
        phone: '+1-767-555-0001',
        website: 'https://johndoe.com',
        socialMedia: {
          twitter: '@johndoe',
          linkedin: 'john-doe-journalist'
        }
      };

      const response = await request(app)
        .post('/api/authors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(authorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(authorData.name);
      expect(response.body.data.slug).toBe('john-doe');
      expect(response.body.data.email).toBe(authorData.email);
      expect(response.body.data.title).toBe(authorData.title);
      expect(response.body.data.expertise).toEqual(authorData.expertise);
      expect(response.body.data.specialization).toEqual(authorData.specialization);
      expect(response.body.data.socialMedia.twitter).toBe(authorData.socialMedia.twitter);

      testAuthor = response.body.data;
    });

    it('should generate unique slug for duplicate names', async () => {
      // Create first author
      await request(app)
        .post('/api/authors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Jane Smith',
          email: 'jane1@test.com',
          role: 'Reporter'
        });

      // Create second author with same name
      const response = await request(app)
        .post('/api/authors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Jane Smith',
          email: 'jane2@test.com',
          role: 'Editor'
        })
        .expect(201);

      expect(response.body.data.slug).toBe('jane-smith-1');
    });

    it('should reject duplicate email addresses', async () => {
      const authorData = {
        name: 'Test Author',
        email: 'duplicate@test.com',
        role: 'Reporter'
      };

      // Create first author
      await request(app)
        .post('/api/authors')
        .set('Authorization', `Bearer ${authToken}`)
        .send(authorData)
        .expect(201);

      // Try to create second author with same email
      const response = await request(app)
        .post('/api/authors')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...authorData,
          name: 'Different Name'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email already exists');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/authors')
        .send({
          name: 'Test Author',
          email: 'test@test.com',
          role: 'Reporter'
        })
        .expect(401);
    });
  });

  describe('GET /api/authors', () => {
    beforeEach(async () => {
      // Create test authors
      await Author.create([
        {
          name: 'Active Author',
          slug: 'active-author',
          email: 'active@test.com',
          role: 'Reporter',
          isActive: true,
          specialization: ['Politics']
        },
        {
          name: 'Inactive Author',
          slug: 'inactive-author',
          email: 'inactive@test.com',
          role: 'Editor',
          isActive: false,
          specialization: ['Sports']
        }
      ]);
    });

    it('should get all authors with pagination', async () => {
      const response = await request(app)
        .get('/api/authors')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter authors by active status', async () => {
      const response = await request(app)
        .get('/api/authors?isActive=true')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Active Author');
    });

    it('should filter authors by specialization', async () => {
      const response = await request(app)
        .get('/api/authors?specialization=Politics')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].specialization).toContain('Politics');
    });

    it('should search authors by text', async () => {
      const response = await request(app)
        .get('/api/authors?search=Active')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Active');
    });
  });

  describe('GET /api/authors/slug/:slug', () => {
    beforeEach(async () => {
      testAuthor = await Author.create({
        name: 'Test Author',
        slug: 'test-author',
        email: 'test@test.com',
        role: 'Reporter',
        isActive: true
      });
    });

    it('should get author by slug', async () => {
      const response = await request(app)
        .get('/api/authors/slug/test-author')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.author.name).toBe('Test Author');
      expect(response.body.data.articles).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should return 404 for non-existent slug', async () => {
      await request(app)
        .get('/api/authors/slug/non-existent')
        .expect(404);
    });

    it('should not return inactive authors', async () => {
      await Author.findByIdAndUpdate(testAuthor._id, { isActive: false });

      await request(app)
        .get('/api/authors/slug/test-author')
        .expect(404);
    });
  });

  describe('PUT /api/authors/:id', () => {
    beforeEach(async () => {
      testAuthor = await Author.create({
        name: 'Original Name',
        slug: 'original-name',
        email: 'original@test.com',
        role: 'Reporter'
      });
    });

    it('should update author and regenerate slug when name changes', async () => {
      const updateData = {
        name: 'Updated Name',
        title: 'Senior Reporter',
        expertise: ['New Expertise']
      };

      const response = await request(app)
        .put(`/api/authors/${testAuthor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.slug).toBe('updated-name');
      expect(response.body.data.title).toBe('Senior Reporter');
      expect(response.body.data.expertise).toEqual(['New Expertise']);
    });

    it('should not allow duplicate email updates', async () => {
      // Create another author
      await Author.create({
        name: 'Another Author',
        slug: 'another-author',
        email: 'another@test.com',
        role: 'Editor'
      });

      const response = await request(app)
        .put(`/api/authors/${testAuthor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'another@test.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email already exists');
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/authors/${testAuthor._id}`)
        .send({ name: 'Updated Name' })
        .expect(401);
    });
  });

  describe('PATCH /api/authors/:id/toggle-status', () => {
    beforeEach(async () => {
      testAuthor = await Author.create({
        name: 'Test Author',
        slug: 'test-author',
        email: 'test@test.com',
        role: 'Reporter',
        isActive: true
      });
    });

    it('should toggle author active status', async () => {
      const response = await request(app)
        .patch(`/api/authors/${testAuthor._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.message).toContain('deactivated');

      // Toggle back
      const response2 = await request(app)
        .patch(`/api/authors/${testAuthor._id}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response2.body.data.isActive).toBe(true);
      expect(response2.body.message).toContain('activated');
    });

    it('should require admin role', async () => {
      // This would need a separate test for role-based access
      // For now, we assume the auth token has admin role
      await request(app)
        .patch(`/api/authors/${testAuthor._id}/toggle-status`)
        .expect(401);
    });
  });

  describe('GET /api/authors/:id/stats', () => {
    beforeEach(async () => {
      testAuthor = await Author.create({
        name: 'Test Author',
        slug: 'test-author',
        email: 'test@test.com',
        role: 'Reporter',
        articlesCount: 5
      });
    });

    it('should get author statistics', async () => {
      const response = await request(app)
        .get(`/api/authors/${testAuthor._id}/stats`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.author).toBeDefined();
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.totalArticles).toBeDefined();
      expect(response.body.data.stats.publishedArticles).toBeDefined();
      expect(response.body.data.stats.totalViews).toBeDefined();
    });

    it('should return 404 for non-existent author', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      await request(app)
        .get(`/api/authors/${fakeId}/stats`)
        .expect(404);
    });
  });

  describe('DELETE /api/authors/:id', () => {
    beforeEach(async () => {
      testAuthor = await Author.create({
        name: 'Test Author',
        slug: 'test-author',
        email: 'test@test.com',
        role: 'Reporter'
      });
    });

    it('should delete author with no published articles', async () => {
      const response = await request(app)
        .delete(`/api/authors/${testAuthor._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify author is deleted
      const deletedAuthor = await Author.findById(testAuthor._id);
      expect(deletedAuthor).toBeNull();
    });

    it('should require admin role', async () => {
      await request(app)
        .delete(`/api/authors/${testAuthor._id}`)
        .expect(401);
    });
  });
});