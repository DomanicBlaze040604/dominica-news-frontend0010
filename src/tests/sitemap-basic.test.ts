/**
 * Basic Sitemap Service Tests
 * Simple tests for sitemap generation functionality
 */

import { SitemapService } from '../services/sitemapService';

// Mock environment variables
process.env.BASE_URL = 'https://dominicanews.com';

// Mock all models to return empty arrays
jest.mock('../models/Article', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([])
          })
        }),
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      }),
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([])
      }),
      limit: jest.fn().mockResolvedValue([])
    }),
    countDocuments: jest.fn().mockResolvedValue(0)
  }
}));

jest.mock('../models/Category', () => ({
  Category: {
    find: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0)
  }
}));

jest.mock('../models/StaticPage', () => ({
  StaticPage: {
    find: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0)
  }
}));

// Mock Author model with require since it's causing import issues
jest.doMock('../models/Author', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0)
  }
}));

describe('Basic Sitemap Service Tests', () => {
  describe('Sitemap Index Generation', () => {
    it('should generate valid sitemap index XML', async () => {
      const sitemapIndex = await SitemapService.generateSitemapIndex();
      
      expect(sitemapIndex).toBeDefined();
      expect(typeof sitemapIndex).toBe('string');
      expect(sitemapIndex).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemapIndex).toContain('<sitemapindex');
      expect(sitemapIndex).toContain('</sitemapindex>');
    });

    it('should include required sitemap URLs', async () => {
      const sitemapIndex = await SitemapService.generateSitemapIndex();
      
      expect(sitemapIndex).toContain('sitemap-main.xml');
      expect(sitemapIndex).toContain('sitemap-news.xml');
      expect(sitemapIndex).toContain('sitemap-images.xml');
    });

    it('should include lastmod dates', async () => {
      const sitemapIndex = await SitemapService.generateSitemapIndex();
      
      expect(sitemapIndex).toContain('<lastmod>');
      expect(sitemapIndex).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Main Sitemap Generation', () => {
    it('should generate valid main sitemap XML', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toBeDefined();
      expect(typeof mainSitemap).toBe('string');
      expect(mainSitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(mainSitemap).toContain('<urlset');
      expect(mainSitemap).toContain('</urlset>');
    });

    it('should include homepage URL', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('<loc>https://dominicanews.com</loc>');
      expect(mainSitemap).toContain('<priority>1</priority>');
    });

    it('should include proper XML namespaces', async () => {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      expect(mainSitemap).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(mainSitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    });
  });

  describe('News Sitemap Generation', () => {
    it('should generate valid news sitemap XML', async () => {
      const newsSitemap = await SitemapService.generateNewsSitemap();
      
      expect(newsSitemap).toBeDefined();
      expect(typeof newsSitemap).toBe('string');
      expect(newsSitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(newsSitemap).toContain('<urlset');
      expect(newsSitemap).toContain('</urlset>');
    });

    it('should include news XML namespace', async () => {
      const newsSitemap = await SitemapService.generateNewsSitemap();
      
      expect(newsSitemap).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
    });
  });

  describe('Image Sitemap Generation', () => {
    it('should generate valid image sitemap XML', async () => {
      const imageSitemap = await SitemapService.generateImageSitemap();
      
      expect(imageSitemap).toBeDefined();
      expect(typeof imageSitemap).toBe('string');
      expect(imageSitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(imageSitemap).toContain('<urlset');
      expect(imageSitemap).toContain('</urlset>');
    });

    it('should include image XML namespace', async () => {
      const imageSitemap = await SitemapService.generateImageSitemap();
      
      expect(imageSitemap).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    });
  });

  describe('Sitemap Statistics', () => {
    it('should provide sitemap statistics', async () => {
      const stats = await SitemapService.getSitemapStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
      expect(stats).toHaveProperty('totalUrls');
      expect(stats).toHaveProperty('articles');
      expect(stats).toHaveProperty('categories');
      expect(stats).toHaveProperty('authors');
      expect(stats).toHaveProperty('staticPages');
      expect(stats).toHaveProperty('recentNews');
      expect(stats).toHaveProperty('imagesCount');
      expect(stats).toHaveProperty('lastGenerated');
      expect(stats.lastGenerated).toBeInstanceOf(Date);
    });

    it('should return numeric values for counts', async () => {
      const stats = await SitemapService.getSitemapStats();
      
      expect(typeof stats.totalUrls).toBe('number');
      expect(typeof stats.articles).toBe('number');
      expect(typeof stats.categories).toBe('number');
      expect(typeof stats.authors).toBe('number');
      expect(typeof stats.staticPages).toBe('number');
      expect(typeof stats.recentNews).toBe('number');
      expect(typeof stats.imagesCount).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment variables gracefully', async () => {
      const originalBaseUrl = process.env.BASE_URL;
      delete process.env.BASE_URL;
      
      const sitemapIndex = await SitemapService.generateSitemapIndex();
      
      expect(sitemapIndex).toBeDefined();
      expect(sitemapIndex).toContain('https://dominicanews.com');
      
      // Restore original value
      if (originalBaseUrl) {
        process.env.BASE_URL = originalBaseUrl;
      }
    });
  });
});