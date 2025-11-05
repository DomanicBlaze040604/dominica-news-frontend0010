/**
 * Sitemap Controller
 * Handles sitemap generation and serving
 */

import { Request, Response } from 'express';
import { SitemapService } from '../services/sitemapService';
import logger from '../services/logger';

export class SitemapController {
  /**
   * Serve sitemap index
   */
  static async getSitemapIndex(req: Request, res: Response): Promise<void> {
    try {
      const sitemapIndex = await SitemapService.generateSitemapIndex();
      
      res.set({
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Robots-Tag': 'noindex'
      });
      
      res.send(sitemapIndex);
    } catch (error) {
      logger.error('Error generating sitemap index:', error as Error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate sitemap index'
      });
    }
  }

  /**
   * Serve main sitemap
   */
  static async getMainSitemap(req: Request, res: Response): Promise<void> {
    try {
      const mainSitemap = await SitemapService.generateMainSitemap();
      
      res.set({
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Robots-Tag': 'noindex'
      });
      
      res.send(mainSitemap);
    } catch (error) {
      logger.error('Error generating main sitemap:', error as Error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate main sitemap'
      });
    }
  }

  /**
   * Serve news sitemap
   */
  static async getNewsSitemap(req: Request, res: Response): Promise<void> {
    try {
      const newsSitemap = await SitemapService.generateNewsSitemap();
      
      res.set({
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes (news changes frequently)
        'X-Robots-Tag': 'noindex'
      });
      
      res.send(newsSitemap);
    } catch (error) {
      logger.error('Error generating news sitemap:', error as Error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate news sitemap'
      });
    }
  }

  /**
   * Serve image sitemap
   */
  static async getImageSitemap(req: Request, res: Response): Promise<void> {
    try {
      const imageSitemap = await SitemapService.generateImageSitemap();
      
      res.set({
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=7200', // Cache for 2 hours
        'X-Robots-Tag': 'noindex'
      });
      
      res.send(imageSitemap);
    } catch (error) {
      logger.error('Error generating image sitemap:', error as Error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate image sitemap'
      });
    }
  }

  /**
   * Get sitemap statistics (admin only)
   */
  static async getSitemapStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await SitemapService.getSitemapStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting sitemap stats:', error as Error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sitemap statistics'
      });
    }
  }

  /**
   * Serve robots.txt
   */
  static async getRobotsTxt(req: Request, res: Response): Promise<void> {
    try {
      const baseUrl = process.env.BASE_URL || 'https://dominicanews.com';
      
      const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-news.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/admin/

# Disallow search results
Disallow: /search?*

# Allow specific bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Twitterbot
Allow: /

# Crawl delay for general bots
Crawl-delay: 1`;

      res.set({
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      });
      
      res.send(robotsTxt);
    } catch (error) {
      logger.error('Error generating robots.txt:', error as Error);
      res.status(500).send('Error generating robots.txt');
    }
  }
}

export default SitemapController;