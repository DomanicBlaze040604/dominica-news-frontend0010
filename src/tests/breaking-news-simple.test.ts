import { BreakingNews } from '../models/BreakingNews';
import { User } from '../models/User';
import mongoose from 'mongoose';

describe('Breaking News Model Tests', () => {
  let testUser: any;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/dominica-news-test');
    }

    // Create test user
    testUser = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashedpassword123',
      role: 'admin'
    });
  });

  beforeEach(async () => {
    // Clean up breaking news before each test
    await BreakingNews.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await BreakingNews.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Breaking News CRUD Operations', () => {
    it('should create breaking news successfully', async () => {
      const breakingNewsData = {
        text: 'Test breaking news',
        isActive: false,
        createdBy: testUser._id
      };

      const breakingNews = await BreakingNews.create(breakingNewsData);

      expect(breakingNews.text).toBe(breakingNewsData.text);
      expect(breakingNews.isActive).toBe(false);
      expect(breakingNews.createdBy.toString()).toBe(testUser._id.toString());
    });

    it('should find active breaking news', async () => {
      // Create inactive breaking news
      await BreakingNews.create({
        text: 'Inactive news',
        isActive: false,
        createdBy: testUser._id
      });

      // Create active breaking news
      const activeNews = await BreakingNews.create({
        text: 'Active breaking news',
        isActive: true,
        createdBy: testUser._id
      });

      const foundActiveNews = await BreakingNews.getActive();
      expect(foundActiveNews).toBeTruthy();
      expect(foundActiveNews?.text).toBe('Active breaking news');
      expect(foundActiveNews?.isActive).toBe(true);
    });

    it('should return null when no active breaking news exists', async () => {
      // Create only inactive breaking news
      await BreakingNews.create({
        text: 'Inactive news',
        isActive: false,
        createdBy: testUser._id
      });

      const activeNews = await BreakingNews.getActive();
      expect(activeNews).toBeNull();
    });

    it('should enforce single active constraint', async () => {
      // Create first active breaking news
      const firstActive = await BreakingNews.create({
        text: 'First active news',
        isActive: true,
        createdBy: testUser._id
      });

      // Create second active breaking news (should deactivate first)
      const secondActive = await BreakingNews.create({
        text: 'Second active news',
        isActive: true,
        createdBy: testUser._id
      });

      // Check that only one is active
      const activeCount = await BreakingNews.countDocuments({ isActive: true });
      expect(activeCount).toBe(1);

      // Check that the second one is the active one
      const activeNews = await BreakingNews.getActive();
      expect(activeNews?.text).toBe('Second active news');

      // Check that the first one is now inactive
      const firstNews = await BreakingNews.findById(firstActive._id);
      expect(firstNews?.isActive).toBe(false);
    });

    it('should update breaking news successfully', async () => {
      const breakingNews = await BreakingNews.create({
        text: 'Original text',
        isActive: false,
        createdBy: testUser._id
      });

      const updatedNews = await BreakingNews.findByIdAndUpdate(
        breakingNews._id,
        { text: 'Updated text', isActive: true },
        { new: true }
      );

      expect(updatedNews?.text).toBe('Updated text');
      expect(updatedNews?.isActive).toBe(true);
    });

    it('should delete breaking news successfully', async () => {
      const breakingNews = await BreakingNews.create({
        text: 'News to delete',
        isActive: false,
        createdBy: testUser._id
      });

      await BreakingNews.findByIdAndDelete(breakingNews._id);

      const deletedNews = await BreakingNews.findById(breakingNews._id);
      expect(deletedNews).toBeNull();
    });
  });

  describe('Breaking News Validation', () => {
    it('should validate text length', async () => {
      // Test minimum length
      try {
        await BreakingNews.create({
          text: 'Hi', // Too short
          isActive: false,
          createdBy: testUser._id
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).toBe('ValidationError');
      }

      // Test maximum length
      try {
        await BreakingNews.create({
          text: 'a'.repeat(201), // Too long
          isActive: false,
          createdBy: testUser._id
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should require text field', async () => {
      try {
        await BreakingNews.create({
          isActive: false,
          createdBy: testUser._id
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).toBe('ValidationError');
      }
    });

    it('should require createdBy field', async () => {
      try {
        await BreakingNews.create({
          text: 'Test breaking news',
          isActive: false
        });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });
});