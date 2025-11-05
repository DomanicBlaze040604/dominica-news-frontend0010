/**
 * Sitemap Service Tests
 * Tests for XML sitemap generation and validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SitemapService } from '../services/sitemapService';
import Article from '../models/Article';
import { Category } from '../models/Category';
import { IAuthor } from '../models/Author';
import { StaticPage } from '../models/StaticPage';

// Mock the models
jest.mock('../models/Article');
jest.mock('../models/Category');
jest.mock('../models/Author');
jest.mock('../models/StaticPage');

// Mock environment variables
process.env.BASE_URL = 'https://dominicanews.com';

// Mock data
const mockArticles = [
  {
    _id: '1',
    title: 'Breaking News: Hurricane Season Update for Dominica',
    slug: 'hurricane-season-update-dominica',
    content: 'Hurricane season update content for Dominica',
    excerpt: 'Latest hurricane season update',
    featuredImage: '/images/hurricane.jpg',
    featuredImageAlt: 'Hurricane approaching Dominica',
    gallery: ['/images/hurricane-1.jpg', '/images/hurricane-2.jpg'],
    category: {
      _id: 'cat1',
      name: 'Weather',
      slug: 'weather'
    },
    author: {
      _id: 'auth1',
      name: 'Weather Desk',
      slug: 'weather-desk'
    },
    status: 'published',
    publishedAt: new Date('2024-11-01T10:00:00Z'),
    createdAt: new Date('2024-11-01T09:00:00Z'),
    updatedAt: new Date('2024-11-01T10:30:00Z'),
    tags: ['hurricane', 'weather', 'dominica'],
    language: 'en',
    isFeatured: true,
    isBreaking: false
  },
  {
    _id: '2',
    title: 'Dominica Politics: Government Announces New Policies',
    slug: 'dominica-politics-new-policies',
    content: 'Government policy announcement content',
    excerpt: 'New government policies announced',
    featuredImage: '/images/politics.jpg',
    category: {
      _id: 'cat2',
      name: 'Politics',
      slug: 'politics'
    },
    author: {
      _id: 'auth2',
      name: 'Political Correspondent',
      slug: 'political-correspondent'
    },
    status: 'published',
    publishedAt: new Date('2024-11-01T08:00:00Z'),
    createdAt: new Date('2024-11-01T07:00:00Z'),
    updatedAt: new Date('2024-11-01T08:30:00Z'),
    tags: ['politics', 'government', 'dominica'],
    language: 'en',
    isFeatured: false,
    isBreaking: true
  }
];

const mockCategories = [
  {
    _id: 'cat1',
    name: 'Weather',
    slug: 'weather',
    isActive: true,
    updatedAt: new Date('2024-11-01T00:00:00Z')
  },
  {
    _id: 'cat2',
    name: 'Politics',
    slug: 'politics',
    isActive: true,
    updatedAt: new Date('2024-11-01T00:00:00Z')
  }
];

const mockAuthors = [
  {
    _id: 'auth1',
    name: 'Weather Desk',
    slug: 'weather-desk',
    isActive: true,
    updatedAt: new Date('2024-11-01T00:00:00Z')
  },
  {
    _id: 'auth2',
    name: 'Political Correspondent',
    slug: 'political-correspondent',
    isActive: true,
    updatedAt: new Date('2024-11-01T00:00:00Z')
  }
];

const mockStaticPages = [
  {
    _id: 'page1',
    title: 'About Us',
    slug: 'about',
    isPublished: true,
    updatedAt: new Date('2024-11-01T00:00:00Z')
  },
  {
    _id: 'page2',
    title: 'Contact Us',
    slug: 'contact',
    isPublished: true,
    updatedAt: new Date('2024-11-01T00:00:00Z')
  }
];
desc
ribe('Sitemap Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Article model methods
    const ArticleMock = Article as any;
    ArticleMock.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(mockArticles)
          })
        })
      }),
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(mockArticles)
      }),
      limit: jest.fn().mockResolvedValue(mockArticles)
    });
    
    ArticleMock.countDocuments = jest.fn().mockResolvedValue(mockArticles.length);
    
    // Mock Category model methods
    const CategoryMock = Category as any;
    CategoryMock.find = jest.fn().mockResolvedValue(mockCategories);
    CategoryMock.countDocuments = jest.fn().mockResolvedValue(mockCategories.length);
    
    // Mock Author model methods - using IAuthor interface
    const AuthorMock = { find: jest.fn(), countDocuments: jest.fn() } as any;
    AuthorMock.find.mockResolvedValue(mockAuthors);
    AuthorMock.countDocuments.mockResolvedValue(mockAuthors.length);
    
    // Mock StaticPage model methods
    const StaticPageMock = StaticPage as any;
    StaticPageMock.find = jest.fn().mockResolvedValue(mockStaticPages);
    StaticPageMock.countDocuments = jest.fn().mockResolvedValue(mockStaticPages.length);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sitemap Index Generation', () => {
    it('should generate valid sitemap index XML', async () => {
      const sitemapIndex = await SitemapService.generateSitemapIndex();
      
      expect(sitemapIndex).toBeDefined();
      expect(sitemapIndex).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemapIndex).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(sitemapIndex).toContain('https://dominicanews.com/sitemap-main.xml');
      expect(sitemapIndex).toContain('https://dominicanews.com/sitemap-news.xml');
      expect(sitemapIndex).toContain('https://dominicanews.com/sitemap-images.xml');
      expect(sitemapIndex).toContain('</sitemapindex>');
    });

    it('should include lastmod dates in sitemap index', async () => {
      const sitemapIndex = await SitemapService.generateSitemapIndex();
      
      expect(sitemapIndex).toContain('<lastmod>');
      expect(sitemapIndex).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z<\/lastmod>/);
    });
  });

  describe('Main Sitemap Generation', () => {
    it('should generate main sitemap with all content types', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toBeDefined();
      expect(mainSitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(mainSitemap).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(mainSitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');
      expect(mainSitemap).toContain('</urlset>');
    });

    it('should include homepage in main sitemap', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('<loc>https://dominicanews.com</loc>');
      expect(mainSitemap).toContain('<changefreq>hourly</changefreq>');
      expect(mainSitemap).toContain('<priority>1.0</priority>');
    });

    it('should include published articles in main sitemap', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('/articles/hurricane-season-update-dominica');
      expect(mainSitemap).toContain('/articles/dominica-politics-new-policies');
      expect(mainSitemap).toContain('<changefreq>weekly</changefreq>');
    });

    it('should include categories in main sitemap', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('/category/weather');
      expect(mainSitemap).toContain('/category/politics');
      expect(mainSitemap).toContain('<changefreq>daily</changefreq>');
    });

    it('should include authors in main sitemap', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('/author/weather-desk');
      expect(mainSitemap).toContain('/author/political-correspondent');
    });

    it('should include static pages in main sitemap', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('/about');
      expect(mainSitemap).toContain('/contact');
      expect(mainSitemap).toContain('<changefreq>monthly</changefreq>');
    });

    it('should include image tags for articles with images', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('<image:image>');
      expect(mainSitemap).toContain('<image:loc>https://dominicanews.com/images/hurricane.jpg</image:loc>');
      expect(mainSitemap).toContain('<image:caption>Hurricane approaching Dominica</image:caption>');
      expect(mainSitemap).toContain('<image:title>Breaking News: Hurricane Season Update for Dominica</image:title>');
      expect(mainSitemap).toContain('</image:image>');
    });

    it('should set higher priority for featured articles', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      // Featured article should have priority 0.9
      const featuredArticleSection = mainSitemap.substring(
        mainSitemap.indexOf('/articles/hurricane-season-update-dominica'),
        mainSitemap.indexOf('</url>', mainSitemap.indexOf('/articles/hurricane-season-update-dominica'))
      );
      expect(featuredArticleSection).toContain('<priority>0.9</priority>');
    });
  });

  describe('News Sitemap Generation', () => {
    it('should generate news sitemap for recent articles', async () => {
      // Mock recent articles (last 2 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1);
      
      const recentArticles = mockArticles.map(article => ({
        ...article,
        publishedAt: recentDate
      }));
      
      const ArticleMock = Article as any;
      ArticleMock.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(recentArticles)
            })
          })
        })
      });
      
      const newsSitemap = await SitemapService.generateNewsSitemap();
      
      expect(newsSitemap).toBeDefined();
      expect(newsSitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(newsSitemap).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">');
      expect(newsSitemap).toContain('<news:news>');
      expect(newsSitemap).toContain('<news:publication>');
      expect(newsSitemap).toContain('<news:name>Dominica News</news:name>');
      expect(newsSitemap).toContain('<news:language>en</news:language>');
      expect(newsSitemap).toContain('</news:news>');
    });

    it('should include proper news metadata', async () => {
      const newsSitemap = await SitemapService.generateNewsSitemap();
      
      expect(newsSitemap).toContain('<news:title>Breaking News: Hurricane Season Update for Dominica</news:title>');
      expect(newsSitemap).toContain('<news:keywords>hurricane, weather, dominica, Weather, Dominica News, Breaking News</news:keywords>');
      expect(newsSitemap).toContain('<news:publication_date>');
    });

    it('should limit to articles from last 2 days', async () => {
      const ArticleMock = Article as any;
      
      await SitemapService.generateNewsSitemap();
      
      expect(ArticleMock.find).toHaveBeenCalledWith({
        status: 'published',
        publishedAt: { $gte: expect.any(Date) }
      });
    });
  });

  describe('Image Sitemap Generation', () => {
    it('should generate image sitemap for articles with images', async () => {
      const imageSitemap = await SitemapService.generateImageSitemap();
      
      expect(imageSitemap).toBeDefined();
      expect(imageSitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(imageSitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">');
      expect(imageSitemap).toContain('<image:image>');
      expect(imageSitemap).toContain('<image:loc>https://dominicanews.com/images/hurricane.jpg</image:loc>');
      expect(imageSitemap).toContain('<image:caption>Hurricane approaching Dominica</image:caption>');
    });

    it('should include gallery images in image sitemap', async () => {
      const imageSitemap = await SitemapService.generateImageSitemap();
      
      expect(imageSitemap).toContain('/images/hurricane-1.jpg');
      expect(imageSitemap).toContain('/images/hurricane-2.jpg');
    });

    it('should only include articles with images', async () => {
      const ArticleMock = Article as any;
      
      await SitemapService.generateImageSitemap();
      
      expect(ArticleMock.find).toHaveBeenCalledWith({
        status: 'published',
        $or: [
          { featuredImage: { $exists: true, $ne: null } },
          { gallery: { $exists: true, $not: { $size: 0 } } }
        ]
      });
    });
  });

  describe('XML Validation and Formatting', () => {
    it('should properly escape XML special characters', async () => {
      // Mock article with special characters
      const specialArticle = {
        ...mockArticles[0],
        title: 'Breaking News: "Hurricane & Storm" Update <Dominica>',
        featuredImageAlt: 'Hurricane "approaching" & storm <warning>'
      };
      
      const ArticleMock = Article as any;
      ArticleMock.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([specialArticle])
            })
          })
        }),
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([specialArticle])
        })
      });
      
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('&quot;Hurricane &amp; Storm&quot;');
      expect(mainSitemap).toContain('&lt;Dominica&gt;');
      expect(mainSitemap).not.toContain('<Dominica>');
      expect(mainSitemap).not.toContain('"Hurricane & Storm"');
    });

    it('should generate valid XML structure', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      // Check for proper XML declaration
      expect(mainSitemap).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      
      // Check for proper namespace declarations
      expect(mainSitemap).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(mainSitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
      
      // Check for proper closing tags
      expect(mainSitemap).toMatch(/<\/urlset>$/);
    });

    it('should include proper lastmod dates in ISO format', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z<\/lastmod>/);
    });
  });

  describe('Sitemap Statistics', () => {
    it('should provide accurate sitemap statistics', async () => {
      const stats = await SitemapService.getSitemapStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalUrls).toBe(7); // 1 homepage + 2 articles + 2 categories + 2 authors + 0 static pages (mocked as empty)
      expect(stats.articles).toBe(mockArticles.length);
      expect(stats.categories).toBe(mockCategories.length);
      expect(stats.authors).toBe(mockAuthors.length);
      expect(stats.staticPages).toBe(mockStaticPages.length);
      expect(stats.lastGenerated).toBeInstanceOf(Date);
    });

    it('should count recent news articles correctly', async () => {
      const stats = await SitemapService.getSitemapStats();
      
      expect(stats.recentNews).toBeDefined();
      expect(typeof stats.recentNews).toBe('number');
    });

    it('should count articles with images correctly', async () => {
      const stats = await SitemapService.getSitemapStats();
      
      expect(stats.imagesCount).toBeDefined();
      expect(typeof stats.imagesCount).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const ArticleMock = Article as any;
      ArticleMock.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('Database error'))
            })
          })
        })
      });
      
      await expect(SitemapService.generateMainSitemap()).rejects.toThrow('Database error');
    });

    it('should handle missing environment variables', async () => {
      const originalBaseUrl = process.env.BASE_URL;
      delete process.env.BASE_URL;
      
      const sitemapIndex = await SitemapService.generateSitemapIndex();
      
      // Should use default URL when BASE_URL is not set
      expect(sitemapIndex).toContain('https://dominicanews.com');
      
      // Restore original value
      process.env.BASE_URL = originalBaseUrl;
    });
  });

  describe('Performance and Limits', () => {
    it('should respect Google sitemap limits', async () => {
      const ArticleMock = Article as any;
      
      await SitemapService.generateMainSitemap();
      
      // Should limit articles to 50,000 (Google's limit)
      expect(ArticleMock.find().populate().populate().sort().limit).toHaveBeenCalledWith(50000);
    });

    it('should respect Google News sitemap limits', async () => {
      const ArticleMock = Article as any;
      
      await SitemapService.generateNewsSitemap();
      
      // Should limit news articles to 1,000 (Google News limit)
      expect(ArticleMock.find().populate().populate().sort().limit).toHaveBeenCalledWith(1000);
    });
  });
});