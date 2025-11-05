import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import { StaticPage } from '../models/StaticPage';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;
let authToken: string;

// Mock JWT secret
process.env.JWT_SECRET = 'test-secret';

describe('Static Page Controller', () => {
  beforeEach(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test auth token
    authToken = jwt.sign(
      { userId: 'test-user-id', role: 'admin' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Clear any existing data
    await StaticPage.deleteMany({});
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('GET /api/static-pages', () => {
    beforeEach(async () => {
      // Create test static pages
      await StaticPage.create([
        {
          title: 'About Us',
          slug: 'about-us',
          content: '<h1>About Us</h1><p>Welcome to our website.</p>',
          metaTitle: 'About Us - Test Site',
          metaDescription: 'Learn about our company',
          isPublished: true,
          showInMenu: true,
          menuOrder: 1,
          template: 'about',
        },
        {
          title: 'Contact Us',
          slug: 'contact-us',
          content: '<h1>Contact Us</h1><p>Get in touch with us.</p>',
          metaTitle: 'Contact Us - Test Site',
          metaDescription: 'Contact our team',
          isPublished: true,
          showInMenu: true,
          menuOrder: 2,
          template: 'contact',
        },
        {
          title: 'Privacy Policy',
          slug: 'privacy-policy',
          content: '<h1>Privacy Policy</h1><p>Our privacy policy.</p>',
          isPublished: false,
          showInMenu: false,
          menuOrder: 0,
          template: 'privacy',
        },
      ]);
    });

    it('should get all published static pages', async () => {
      const response = await request(app)
        .get('/api/static-pages')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Only published pages
      expect(response.body.data[0].title).toBe('About Us');
      expect(response.body.data[1].title).toBe('Contact Us');
    });

    it('should filter pages by published status', async () => {
      const response = await request(app)
        .get('/api/static-pages?published=false')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Privacy Policy');
    });

    it('should filter pages by menu visibility', async () => {
      const response = await request(app)
        .get('/api/static-pages?showInMenu=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((page: any) => page.showInMenu)).toBe(true);
    });
  });

  describe('GET /api/static-pages/menu', () => {
    beforeEach(async () => {
      await StaticPage.create([
        {
          title: 'About Us',
          slug: 'about-us',
          content: '<h1>About Us</h1>',
          isPublished: true,
          showInMenu: true,
          menuOrder: 1,
        },
        {
          title: 'Contact Us',
          slug: 'contact-us',
          content: '<h1>Contact Us</h1>',
          isPublished: true,
          showInMenu: true,
          menuOrder: 2,
        },
        {
          title: 'Hidden Page',
          slug: 'hidden-page',
          content: '<h1>Hidden</h1>',
          isPublished: true,
          showInMenu: false,
          menuOrder: 0,
        },
      ]);
    });

    it('should get only menu pages sorted by order', async () => {
      const response = await request(app)
        .get('/api/static-pages/menu')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe('About Us');
      expect(response.body.data[1].title).toBe('Contact Us');
      expect(response.body.data[0].menuOrder).toBe(1);
      expect(response.body.data[1].menuOrder).toBe(2);
    });
  });

  describe('GET /api/static-pages/slug/:slug', () => {
    beforeEach(async () => {
      await StaticPage.create({
        title: 'About Us',
        slug: 'about-us',
        content: '<h1>About Us</h1><p>Welcome to our website.</p>',
        metaTitle: 'About Us - Test Site',
        metaDescription: 'Learn about our company',
        isPublished: true,
        template: 'about',
      });
    });

    it('should get static page by slug', async () => {
      const response = await request(app)
        .get('/api/static-pages/slug/about-us')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('About Us');
      expect(response.body.data.slug).toBe('about-us');
      expect(response.body.data.template).toBe('about');
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/static-pages/slug/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Page not found');
    });

    it('should return 404 for unpublished page', async () => {
      await StaticPage.create({
        title: 'Draft Page',
        slug: 'draft-page',
        content: '<h1>Draft</h1>',
        isPublished: false,
      });

      const response = await request(app)
        .get('/api/static-pages/slug/draft-page')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Page not found');
    });
  });

  describe('POST /api/static-pages/admin', () => {
    it('should create a new static page', async () => {
      const pageData = {
        title: 'New Page',
        content: '<h1>New Page</h1><p>This is a new page.</p>',
        metaTitle: 'New Page - Test Site',
        metaDescription: 'A new page for testing',
        template: 'default',
        showInMenu: true,
        menuOrder: 1,
        isPublished: true,
      };

      const response = await request(app)
        .post('/api/static-pages/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Page');
      expect(response.body.data.slug).toBe('new-page');
      expect(response.body.data.template).toBe('default');

      // Verify in database
      const savedPage = await StaticPage.findOne({ slug: 'new-page' });
      expect(savedPage).toBeTruthy();
      expect(savedPage!.title).toBe('New Page');
    });

    it('should auto-generate slug from title', async () => {
      const pageData = {
        title: 'Test Page With Spaces & Special Characters!',
        content: '<h1>Test</h1>',
        isPublished: true,
      };

      const response = await request(app)
        .post('/api/static-pages/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('test-page-with-spaces-special-characters');
    });

    it('should ensure unique slugs', async () => {
      // Create first page
      await StaticPage.create({
        title: 'Test Page',
        slug: 'test-page',
        content: '<h1>Test</h1>',
        isPublished: true,
      });

      const pageData = {
        title: 'Test Page',
        content: '<h1>Another Test</h1>',
        isPublished: true,
      };

      const response = await request(app)
        .post('/api/static-pages/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.slug).toBe('test-page-1');
    });

    it('should require authentication', async () => {
      const pageData = {
        title: 'New Page',
        content: '<h1>New Page</h1>',
        isPublished: true,
      };

      await request(app)
        .post('/api/static-pages/admin')
        .send(pageData)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/static-pages/admin')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/static-pages/admin/:id', () => {
    let pageId: string;

    beforeEach(async () => {
      const page = await StaticPage.create({
        title: 'Original Title',
        slug: 'original-title',
        content: '<h1>Original</h1>',
        isPublished: true,
      });
      pageId = (page._id as any).toString();
    });

    it('should update static page', async () => {
      const updateData = {
        title: 'Updated Title',
        content: '<h1>Updated</h1><p>Updated content.</p>',
        metaTitle: 'Updated - Test Site',
        template: 'about',
      };

      const response = await request(app)
        .put(`/api/static-pages/admin/${pageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.slug).toBe('updated-title');
      expect(response.body.data.template).toBe('about');

      // Verify in database
      const updatedPage = await StaticPage.findById(pageId);
      expect(updatedPage!.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent page', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .put(`/api/static-pages/admin/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Static page not found');
    });
  });

  describe('DELETE /api/static-pages/admin/:id', () => {
    let pageId: string;

    beforeEach(async () => {
      const page = await StaticPage.create({
        title: 'Page to Delete',
        slug: 'page-to-delete',
        content: '<h1>Delete Me</h1>',
        isPublished: true,
      });
      pageId = (page._id as any).toString();
    });

    it('should delete static page', async () => {
      const response = await request(app)
        .delete(`/api/static-pages/admin/${pageId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Static page deleted successfully');

      // Verify deletion in database
      const deletedPage = await StaticPage.findById(pageId);
      expect(deletedPage).toBeNull();
    });

    it('should return 404 for non-existent page', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const response = await request(app)
        .delete(`/api/static-pages/admin/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Static page not found');
    });
  });

  describe('PUT /api/static-pages/reorder', () => {
    let page1Id: string;
    let page2Id: string;
    let page3Id: string;

    beforeEach(async () => {
      const pages = await StaticPage.create([
        {
          title: 'Page 1',
          slug: 'page-1',
          content: '<h1>Page 1</h1>',
          isPublished: true,
          showInMenu: true,
          menuOrder: 1,
        },
        {
          title: 'Page 2',
          slug: 'page-2',
          content: '<h1>Page 2</h1>',
          isPublished: true,
          showInMenu: true,
          menuOrder: 2,
        },
        {
          title: 'Page 3',
          slug: 'page-3',
          content: '<h1>Page 3</h1>',
          isPublished: true,
          showInMenu: true,
          menuOrder: 3,
        },
      ]);

      page1Id = (pages[0]._id as any).toString();
      page2Id = (pages[1]._id as any).toString();
      page3Id = (pages[2]._id as any).toString();
    });

    it('should reorder menu pages', async () => {
      const pageOrders = [
        { id: page3Id, menuOrder: 1 },
        { id: page1Id, menuOrder: 2 },
        { id: page2Id, menuOrder: 3 },
      ];

      const response = await request(app)
        .put('/api/static-pages/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pageOrders })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Menu pages reordered successfully');

      // Verify new order in database
      const page1 = await StaticPage.findById(page1Id);
      const page2 = await StaticPage.findById(page2Id);
      const page3 = await StaticPage.findById(page3Id);

      expect(page1!.menuOrder).toBe(2);
      expect(page2!.menuOrder).toBe(3);
      expect(page3!.menuOrder).toBe(1);
    });

    it('should validate pageOrders array', async () => {
      const response = await request(app)
        .put('/api/static-pages/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ pageOrders: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Page orders must be an array');
    });
  });

  describe('PATCH /api/static-pages/admin/:id/toggle-status', () => {
    let pageId: string;

    beforeEach(async () => {
      const page = await StaticPage.create({
        title: 'Test Page',
        slug: 'test-page',
        content: '<h1>Test</h1>',
        isPublished: true,
      });
      pageId = (page._id as any).toString();
    });

    it('should toggle page published status', async () => {
      const response = await request(app)
        .patch(`/api/static-pages/admin/${pageId}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublished).toBe(false);
      expect(response.body.message).toBe('Page unpublished successfully');

      // Verify in database
      const updatedPage = await StaticPage.findById(pageId);
      expect(updatedPage!.isPublished).toBe(false);
    });

    it('should toggle back to published', async () => {
      // First toggle to unpublished
      await request(app)
        .patch(`/api/static-pages/admin/${pageId}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Then toggle back to published
      const response = await request(app)
        .patch(`/api/static-pages/admin/${pageId}/toggle-status`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isPublished).toBe(true);
      expect(response.body.message).toBe('Page published successfully');
    });
  });
});