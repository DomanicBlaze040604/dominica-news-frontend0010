import { Article } from './Article';
import { Category } from './Category';
import { User } from './User';
import mongoose from 'mongoose';

describe('Article Model', () => {
  let testCategory: any;
  let testUser: any;

  beforeAll(async () => {
    // Create test category and user
    testCategory = await Category.create({
      name: 'Technology',
      slug: 'technology',
    });

    testUser = await User.create({
      email: 'author@example.com',
      passwordHash: 'password123',
      fullName: 'Test Author',
    });
  });

  beforeEach(async () => {
    await Article.deleteMany({});
  });

  afterAll(async () => {
    await Article.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
  });

  describe('Article Creation', () => {
    it('should create an article with valid data', async () => {
      const articleData = {
        title: 'Test Article Title',
        slug: 'test-article-title',
        excerpt: 'This is a test article excerpt',
        content: 'This is the full content of the test article. It contains enough text to meet the minimum requirements.',
        featuredImage: '/images/test-image.jpg',
        categoryId: testCategory._id,
        authorId: testUser._id,
        status: 'published' as const,
      };

      const article = new Article(articleData);
      const savedArticle = await article.save();

      expect(savedArticle.title).toBe(articleData.title);
      expect(savedArticle.slug).toBe(articleData.slug);
      expect(savedArticle.excerpt).toBe(articleData.excerpt);
      expect(savedArticle.content).toBe(articleData.content);
      expect(savedArticle.featuredImage).toBe(articleData.featuredImage);
      expect(savedArticle.categoryId.toString()).toBe(testCategory._id.toString());
      expect(savedArticle.authorId.toString()).toBe(testUser._id.toString());
      expect(savedArticle.status).toBe('published');
      expect(savedArticle.publishedAt).toBeDefined();
      expect(savedArticle.createdAt).toBeDefined();
      expect(savedArticle.updatedAt).toBeDefined();
    });

    it('should create an article with minimal data', async () => {
      const articleData = {
        title: 'Minimal Article',
        slug: 'minimal-article',
        content: 'This is the minimal content for the article that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      };

      const article = new Article(articleData);
      const savedArticle = await article.save();

      expect(savedArticle.title).toBe(articleData.title);
      expect(savedArticle.slug).toBe(articleData.slug);
      expect(savedArticle.content).toBe(articleData.content);
      expect(savedArticle.status).toBe('draft'); // Default status
      expect(savedArticle.publishedAt).toBeUndefined();
    });

    it('should not include _id and __v in JSON output', async () => {
      const article = new Article({
        title: 'JSON Test Article',
        slug: 'json-test-article',
        content: 'This is content for testing JSON transformation functionality.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await article.save();
      const articleJSON = article.toJSON();

      expect(articleJSON.id).toBeDefined();
      expect(articleJSON._id).toBeUndefined();
      expect(articleJSON.__v).toBeUndefined();
    });
  });

  describe('Article Validation', () => {
    it('should require title', async () => {
      const article = new Article({
        slug: 'test-slug',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await expect(article.save()).rejects.toThrow('Article title is required');
    });

    it('should require slug', async () => {
      const article = new Article({
        title: 'Test Article',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await expect(article.save()).rejects.toThrow('Article slug is required');
    });

    it('should require content', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await expect(article.save()).rejects.toThrow('Article content is required');
    });

    it('should require categoryId', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        authorId: testUser._id,
      });

      await expect(article.save()).rejects.toThrow('Article category is required');
    });

    it('should require authorId', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
      });

      await expect(article.save()).rejects.toThrow('Article author is required');
    });

    it('should enforce unique slug', async () => {
      const articleData = {
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      };

      await new Article(articleData).save();

      const duplicateArticle = new Article({
        ...articleData,
        title: 'Different Title',
      });

      await expect(duplicateArticle.save()).rejects.toThrow();
    });

    it('should enforce title length constraints', async () => {
      // Too short
      const shortTitleArticle = new Article({
        title: 'Hi',
        slug: 'short-title',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await expect(shortTitleArticle.save()).rejects.toThrow(
        'Article title must be at least 5 characters long'
      );

      // Too long
      const longTitleArticle = new Article({
        title: 'A'.repeat(501),
        slug: 'long-title',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await expect(longTitleArticle.save()).rejects.toThrow(
        'Article title cannot exceed 500 characters'
      );
    });

    it('should enforce content length constraint', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'Short', // Too short
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await expect(article.save()).rejects.toThrow(
        'Article content must be at least 50 characters long'
      );
    });

    it('should enforce excerpt length constraint', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        excerpt: 'A'.repeat(501),
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await expect(article.save()).rejects.toThrow(
        'Article excerpt cannot exceed 500 characters'
      );
    });

    it('should enforce slug format', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'Invalid Slug With Spaces',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await expect(article.save()).rejects.toThrow(
        'Slug must contain only lowercase letters, numbers, and hyphens'
      );
    });

    it('should validate status enum', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
        status: 'invalid' as any,
      });

      await expect(article.save()).rejects.toThrow();
    });

    it('should trim whitespace from title and content', async () => {
      const article = new Article({
        title: '  Test Article  ',
        slug: 'test-article',
        content: '  This is test content that meets the minimum length requirement.  ',
        excerpt: '  Test excerpt  ',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await article.save();

      expect(article.title).toBe('Test Article');
      expect(article.content).toBe('This is test content that meets the minimum length requirement.');
      expect(article.excerpt).toBe('Test excerpt');
    });

    it('should convert slug to lowercase', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'TEST-ARTICLE',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
      });

      await article.save();

      expect(article.slug).toBe('test-article');
    });
  });

  describe('Article Status Management', () => {
    it('should set publishedAt when status changes to published', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
        status: 'draft',
      });

      await article.save();
      expect(article.publishedAt).toBeUndefined();

      article.status = 'published';
      await article.save();
      expect(article.publishedAt).toBeDefined();
    });

    it('should not override existing publishedAt when already published', async () => {
      const publishedDate = new Date('2023-01-01');
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
        status: 'published',
        publishedAt: publishedDate,
      });

      await article.save();
      expect(article.publishedAt).toEqual(publishedDate);

      // Update something else
      article.title = 'Updated Title';
      await article.save();
      expect(article.publishedAt).toEqual(publishedDate);
    });

    it('should clear publishedAt when status changes to draft', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        categoryId: testCategory._id,
        authorId: testUser._id,
        status: 'published',
      });

      await article.save();
      expect(article.publishedAt).toBeDefined();

      article.status = 'draft';
      await article.save();
      expect(article.publishedAt).toBeUndefined();
    });
  });

  describe('Article Queries', () => {
    beforeEach(async () => {
      // Create test articles
      await Article.create([
        {
          title: 'Published Article 1',
          slug: 'published-article-1',
          content: 'This is published content that meets the minimum length requirement.',
          categoryId: testCategory._id,
          authorId: testUser._id,
          status: 'published',
          publishedAt: new Date('2023-01-01'),
        },
        {
          title: 'Published Article 2',
          slug: 'published-article-2',
          content: 'This is another published content that meets the minimum length requirement.',
          categoryId: testCategory._id,
          authorId: testUser._id,
          status: 'published',
          publishedAt: new Date('2023-01-02'),
        },
        {
          title: 'Draft Article',
          slug: 'draft-article',
          content: 'This is draft content that meets the minimum length requirement.',
          categoryId: testCategory._id,
          authorId: testUser._id,
          status: 'draft',
        },
      ]);
    });

    it('should find article by slug', async () => {
      const article = await Article.findOne({ slug: 'published-article-1' });

      expect(article).toBeTruthy();
      expect(article?.title).toBe('Published Article 1');
    });

    it('should find published articles only', async () => {
      const publishedArticles = await Article.find({ status: 'published' });

      expect(publishedArticles).toHaveLength(2);
      expect(publishedArticles.every(article => article.status === 'published')).toBe(true);
    });

    it('should find articles by category', async () => {
      const categoryArticles = await Article.find({ categoryId: testCategory._id });

      expect(categoryArticles).toHaveLength(3);
      expect(categoryArticles.every(article => 
        article.categoryId.toString() === testCategory._id.toString()
      )).toBe(true);
    });

    it('should find articles ordered by publishedAt descending', async () => {
      const articles = await Article.find({ status: 'published' })
        .sort({ publishedAt: -1 });

      expect(articles).toHaveLength(2);
      expect(articles[0].title).toBe('Published Article 2'); // More recent
      expect(articles[1].title).toBe('Published Article 1'); // Older
    });

    it('should populate category and author', async () => {
      const article = await Article.findOne({ slug: 'published-article-1' })
        .populate('categoryId')
        .populate('authorId', 'fullName email');

      expect(article).toBeTruthy();
      
      if (article) {
        const populatedCategory = article.categoryId as any;
        const populatedAuthor = article.authorId as any;
        
        expect(populatedCategory.name).toBe('Technology');
        expect(populatedAuthor.fullName).toBe('Test Author');
        expect(populatedAuthor.email).toBe('author@example.com');
      }
    });
  });
});