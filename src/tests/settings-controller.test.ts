import request from 'supertest';
import app from '../app';
import Settings from '../models/Settings';
import { connectDB, disconnectDB, clearDB } from './setup';

describe('Settings Controller', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('GET /api/settings', () => {
    it('should return all settings in individual format', async () => {
      // Create test settings
      await Settings.create({
        siteName: 'Test Site',
        siteDescription: 'Test Description',
        maintenanceMode: false,
        socialMedia: {
          facebook: 'https://facebook.com/test',
          twitter: 'https://twitter.com/test'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '+1234567890'
        },
        seoSettings: {
          metaTitle: 'Test Meta Title',
          metaDescription: 'Test Meta Description'
        }
      });

      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toBeInstanceOf(Array);
      expect(response.body.data.settings.length).toBeGreaterThan(0);

      // Check for specific settings
      const settings = response.body.data.settings;
      const siteNameSetting = settings.find((s: any) => s.key === 'site_name');
      expect(siteNameSetting).toBeDefined();
      expect(siteNameSetting.value).toBe('Test Site');
    });

    it('should return empty settings array when no settings exist', async () => {
      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.settings).toEqual([]);
    });
  });

  describe('GET /api/settings/:key', () => {
    beforeEach(async () => {
      await Settings.create({
        siteName: 'Test Site',
        siteDescription: 'Test Description',
        maintenanceMode: false
      });
    });

    it('should return individual setting by key', async () => {
      const response = await request(app)
        .get('/api/settings/site_name')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('site_name');
      expect(response.body.data.value).toBe('Test Site');
    });

    it('should return 404 for invalid setting key', async () => {
      const response = await request(app)
        .get('/api/settings/invalid_key')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Setting not found');
    });
  });

  describe('PUT /api/settings', () => {
    it('should update individual setting', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({
          key: 'site_name',
          value: 'Updated Site Name',
          description: 'The name of the website'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBe('site_name');
      expect(response.body.data.value).toBe('Updated Site Name');

      // Verify in database
      const settings = await Settings.findOne();
      expect(settings?.siteName).toBe('Updated Site Name');
    });

    it('should create settings document if none exists', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({
          key: 'site_name',
          value: 'New Site Name',
          description: 'The name of the website'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const settings = await Settings.findOne();
      expect(settings).toBeDefined();
      expect(settings?.siteName).toBe('New Site Name');
    });

    it('should validate setting key', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({
          key: 'invalid_key',
          value: 'Some Value'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate setting values', async () => {
      // Test site name length validation
      const response = await request(app)
        .put('/api/settings')
        .send({
          key: 'site_name',
          value: 'a'.repeat(101) // Too long
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Social Media Settings', () => {
    it('should update social media settings', async () => {
      const socialMediaData = {
        facebook: 'https://facebook.com/updated',
        twitter: 'https://twitter.com/updated',
        instagram: 'https://instagram.com/updated'
      };

      const response = await request(app)
        .put('/api/settings/social-media')
        .send({ socialMedia: socialMediaData })
        .expect(200);

      expect(response.body.success).toBe(true);

      const settings = await Settings.findOne();
      expect(settings?.socialMedia?.facebook).toBe(socialMediaData.facebook);
      expect(settings?.socialMedia?.twitter).toBe(socialMediaData.twitter);
      expect(settings?.socialMedia?.instagram).toBe(socialMediaData.instagram);
    });

    it('should validate social media URLs', async () => {
      const response = await request(app)
        .put('/api/settings/social-media')
        .send({
          socialMedia: {
            facebook: 'invalid-url'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Contact Information', () => {
    it('should update contact information', async () => {
      const contactData = {
        email: 'contact@example.com',
        phone: '+1234567890',
        address: '123 Test Street',
        workingHours: '9 AM - 5 PM'
      };

      const response = await request(app)
        .put('/api/settings/contact')
        .send({ contactInfo: contactData })
        .expect(200);

      expect(response.body.success).toBe(true);

      const settings = await Settings.findOne();
      expect(settings?.contactInfo?.email).toBe(contactData.email);
      expect(settings?.contactInfo?.phone).toBe(contactData.phone);
    });

    it('should validate contact email', async () => {
      const response = await request(app)
        .put('/api/settings/contact')
        .send({
          contactInfo: {
            email: 'invalid-email'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('SEO Settings', () => {
    it('should update SEO settings', async () => {
      const seoData = {
        metaTitle: 'Test Meta Title',
        metaDescription: 'Test Meta Description',
        keywords: ['test', 'keywords'],
        ogImage: 'https://example.com/image.jpg'
      };

      const response = await request(app)
        .put('/api/settings/seo')
        .send({ seoSettings: seoData })
        .expect(200);

      expect(response.body.success).toBe(true);

      const settings = await Settings.findOne();
      expect(settings?.seoSettings?.metaTitle).toBe(seoData.metaTitle);
      expect(settings?.seoSettings?.metaDescription).toBe(seoData.metaDescription);
    });

    it('should validate SEO field lengths', async () => {
      const response = await request(app)
        .put('/api/settings/seo')
        .send({
          seoSettings: {
            metaTitle: 'a'.repeat(61) // Too long
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Maintenance Mode', () => {
    it('should toggle maintenance mode', async () => {
      const response = await request(app)
        .put('/api/settings/maintenance')
        .send({ maintenanceMode: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maintenanceMode).toBe(true);

      const settings = await Settings.findOne();
      expect(settings?.maintenanceMode).toBe(true);
    });

    it('should get maintenance status', async () => {
      await Settings.create({ maintenanceMode: true });

      const response = await request(app)
        .get('/api/settings/maintenance/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maintenanceMode).toBe(true);
    });
  });

  describe('Contact Form Submission', () => {
    it('should submit contact form successfully', async () => {
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        subject: 'Test Subject',
        message: 'This is a test message'
      };

      const response = await request(app)
        .post('/api/settings/contact/submit')
        .send(formData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Thank you for your message');
    });

    it('should validate contact form fields', async () => {
      const response = await request(app)
        .post('/api/settings/contact/submit')
        .send({
          firstName: 'John',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format in contact form', async () => {
      const response = await request(app)
        .post('/api/settings/contact/submit')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          subject: 'Test',
          message: 'Test message'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});