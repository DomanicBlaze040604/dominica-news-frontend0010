import Article from './Article';
import { Category } from './Category';
import { User } from './User';
import Author from './Author';

describe('Article Model', () => {
  let testCategory: any;
  let testUser: any;

  beforeAll(async () => {
    // Create test category and user
    testCategory = await Category.create({
      name: 'Technology',
      slug: 'technology',
    });

    testUser = await Author.create({
      email: 'author@example.com',
      name: 'Test Author',
    });
  });

  // Note: Article cleanup is handled per test section

  afterAll(async () => {
    await Article.deleteMany({});
    await Category.deleteMany({});
    await Author.deleteMany({});
  });

  describe('Article Creation', () => {
    beforeEach(async () => {
      await Article.deleteMany({});
    });

    it('should create an article with valid data', async () => {
      const articleData = {
        title: 'Test Article Title',
        slug: 'test-article-title',
        excerpt: 'This is a test article excerpt',
        content: 'This is the full content of the test article. It contains enough text to meet the minimum requirements.',
        featuredImage: '/images/test-image.jpg',
        category: testCategory._id,
        author: testUser._id,
        status: 'published' as const,
      };

      const article = new Article(articleData);
      const savedArticle = await article.save();

      expect(savedArticle.title).toBe(articleData.title);
      expect(savedArticle.slug).toBe(articleData.slug);
      expect(savedArticle.excerpt).toBe(articleData.excerpt);
      expect(savedArticle.content).toBe(articleData.content);
      expect(savedArticle.featuredImage).toBe(articleData.featuredImage);
      expect(savedArticle.category.toString()).toBe(testCategory._id.toString());
      expect(savedArticle.author.toString()).toBe(testUser._id.toString());
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
        category: testCategory._id,
        author: testUser._id,
      };

      const article = new Article(articleData);
      const savedArticle = await article.save();

      expect(savedArticle.title).toBe(articleData.title);
      expect(savedArticle.slug).toBe(articleData.slug);
      expect(savedArticle.content).toBe(articleData.content);
      expect(savedArticle.status).toBe('draft'); // Default status
      expect(savedArticle.publishedAt).toBeNull();
    });

    it('should not include _id and __v in JSON output', async () => {
      const article = new Article({
        title: 'JSON Test Article',
        slug: 'json-test-article',
        content: 'This is content for testing JSON transformation functionality.',
        category: testCategory._id,
        author: testUser._id,
      });

      await article.save();
      const articleJSON = article.toJSON();

      expect(articleJSON.id).toBeDefined();
      expect(articleJSON._id).toBeUndefined();
      expect(articleJSON.__v).toBeUndefined();
    });
  });

  describe('Article Validation', () => {
    beforeEach(async () => {
      await Article.deleteMany({});
    });

    it('should require title', async () => {
      const article = new Article({
        slug: 'test-slug',
        content: 'This is test content that meets the minimum length requirement.',
        category: testCategory._id,
        author: testUser._id,
      });

      await expect(article.save()).rejects.toThrow('Article title is required');
    });

    it('should require content', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        category: testCategory._id,
        author: testUser._id,
      });

      await expect(article.save()).rejects.toThrow('Article content is required');
    });

    it('should require category', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        author: testUser._id,
      });

      await expect(article.save()).rejects.toThrow('Category is required');
    });

    it('should require author', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        category: testCategory._id,
      });

      await expect(article.save()).rejects.toThrow('Author is required');
    });

    it('should enforce unique slug', async () => {
      const articleData = {
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        category: testCategory._id,
        author: testUser._id,
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
        category: testCategory._id,
        author: testUser._id,
      });

      await expect(shortTitleArticle.save()).rejects.toThrow();

      // Too long
      const longTitleArticle = new Article({
        title: 'A'.repeat(201),
        slug: 'long-title',
        content: 'This is test content that meets the minimum length requirement.',
        category: testCategory._id,
        author: testUser._id,
      });

      await expect(longTitleArticle.save()).rejects.toThrow();
    });

    it('should enforce excerpt length constraint', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        excerpt: 'A'.repeat(301),
        category: testCategory._id,
        author: testUser._id,
      });

      await expect(article.save()).rejects.toThrow();
    });

    it('should trim whitespace from title and content', async () => {
      const article = new Article({
        title: '  Test Article  ',
        slug: 'test-article',
        content: '  This is test content that meets the minimum length requirement.  ',
        excerpt: '  Test excerpt  ',
        category: testCategory._id,
        author: testUser._id,
      });

      await article.save();

      expect(article.title).toBe('Test Article');
      expect(article.content).toBe('This is test content that meets the minimum length requirement.');
      expect(article.excerpt).toBe('Test excerpt');
    });
  });

  describe('Article Status Management', () => {
    beforeEach(async () => {
      await Article.deleteMany({});
    });

    it('should set publishedAt when status changes to published', async () => {
      const article = new Article({
        title: 'Test Article',
        slug: 'test-article',
        content: 'This is test content that meets the minimum length requirement.',
        category: testCategory._id,
        author: testUser._id,
        status: 'draft',
      });

      await article.save();
      expect(article.publishedAt).toBeNull();

      article.status = 'published';
      await article.save();
      expect(article.publishedAt).toBeDefined();
    });
  });

  describe('Article Queries', () => {
    let queryTestCategory: any;
    let queryTestUser: any;

    beforeEach(async () => {
      // Clear articles first
      await Article.deleteMany({});

      // Create fresh category and author for this test
      queryTestCategory = await Category.create({
        name: 'Technology',
        slug: 'technology-query',
      });

      queryTestUser = await Author.create({
        email: 'query-author@example.com',
        name: 'Test Author',
      });

      // Create test articles
      await Article.create([
        {
          title: 'Published Article 1',
          slug: 'published-article-1',
          content: 'This is published content that meets the minimum length requirement.',
          category: queryTestCategory._id,
          author: queryTestUser._id,
          status: 'published',
          publishedAt: new Date('2023-01-01'),
        },
        {
          title: 'Published Article 2',
          slug: 'published-article-2',
          content: 'This is another published content that meets the minimum length requirement.',
          category: queryTestCategory._id,
          author: queryTestUser._id,
          status: 'published',
          publishedAt: new Date('2023-01-02'),
        },
        {
          title: 'Draft Article',
          slug: 'draft-article',
          content: 'This is draft content that meets the minimum length requirement.',
          category: queryTestCategory._id,
          author: queryTestUser._id,
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
      expect(publishedArticles.every((article: any) => article.status === 'published')).toBe(true);
    });

    it('should find articles by category', async () => {
      const categoryArticles = await Article.find({ category: queryTestCategory._id });

      expect(categoryArticles).toHaveLength(3);
      expect(categoryArticles.every((article: any) => 
        article.category.toString() === queryTestCategory._id.toString()
      )).toBe(true);
    });

    it('should populate category and author', async () => {
      const article = await Article.findOne({ slug: 'published-article-1' })
        .populate('category')
        .populate('author', 'name email');

      expect(article).toBeTruthy();
      
      if (article) {
        const populatedCategory = article.category as any;
        const populatedAuthor = article.author as any;
        
        expect(populatedCategory).toBeTruthy();
        expect(populatedAuthor).toBeTruthy();
        expect(populatedCategory.name).toBe('Technology');
        expect(populatedAuthor.name).toBe('Test Author');
        expect(populatedAuthor.email).toBe('query-author@example.com');
      }
    });
  });
});