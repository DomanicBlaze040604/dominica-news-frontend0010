/**
 * Sitemap Routes
 * Public routes for serving sitemaps and robots.txt
 */

import express from 'express';
import { SitemapController } from '../controllers/sitemapController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public sitemap routes
router.get('/sitemap.xml', SitemapController.getSitemapIndex);
router.get('/sitemap-main.xml', SitemapController.getMainSitemap);
router.get('/sitemap-news.xml', SitemapController.getNewsSitemap);
router.get('/sitemap-images.xml', SitemapController.getImageSitemap);
router.get('/robots.txt', SitemapController.getRobotsTxt);

// Admin-only sitemap statistics
router.get('/admin/sitemap/stats', authenticate, SitemapController.getSitemapStats);

export default router;