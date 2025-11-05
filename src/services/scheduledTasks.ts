/**
 * Scheduled Tasks Service
 * Handles automatic sitemap updates and other scheduled operations
 */

import cron from 'node-cron';
import { SitemapService } from './sitemapService';
import logger from '../services/logger';
import fs from 'fs/promises';
import path from 'path';

export class ScheduledTasksService {
  private static isInitialized = false;

  /**
   * Initialize all scheduled tasks
   */
  static initialize(): void {
    if (this.isInitialized) {
      logger.info('Scheduled tasks already initialized');
      return;
    }

    logger.info('Initializing scheduled tasks...');

    // Update sitemaps every hour
    cron.schedule('0 * * * *', async () => {
      logger.info('Running scheduled sitemap update...');
      await this.updateSitemaps();
    });

    // Update news sitemap every 15 minutes (for breaking news)
    cron.schedule('*/15 * * * *', async () => {
      logger.info('Running scheduled news sitemap update...');
      await this.updateNewsSitemap();
    });

    // Clean up old sitemap files daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running scheduled sitemap cleanup...');
      await this.cleanupOldSitemaps();
    });

    this.isInitialized = true;
    logger.info('Scheduled tasks initialized successfully');
  }

  /**
   * Update all sitemaps
   */
  private static async updateSitemaps(): Promise<void> {
    try {
      const sitemapDir = path.join(__dirname, '../../public/sitemaps');
      
      // Ensure sitemap directory exists
      await fs.mkdir(sitemapDir, { recursive: true });

      // Generate all sitemaps
      const [sitemapIndex, mainSitemap, newsSitemap, imageSitemap] = await Promise.all([
        SitemapService.generateSitemapIndex(),
        SitemapService.generateMainSitemap(),
        SitemapService.generateNewsSitemap(),
        SitemapService.generateImageSitemap()
      ]);

      // Write sitemaps to files
      await Promise.all([
        fs.writeFile(path.join(sitemapDir, 'sitemap.xml'), sitemapIndex),
        fs.writeFile(path.join(sitemapDir, 'sitemap-main.xml'), mainSitemap),
        fs.writeFile(path.join(sitemapDir, 'sitemap-news.xml'), newsSitemap),
        fs.writeFile(path.join(sitemapDir, 'sitemap-images.xml'), imageSitemap)
      ]);

      const stats = await SitemapService.getSitemapStats();
      logger.info(`Sitemaps updated successfully. Total URLs: ${stats.totalUrls}`);
    } catch (error) {
      logger.error('Error updating sitemaps:', error as Error);
    }
  }

  /**
   * Update only news sitemap (for frequent updates)
   */
  private static async updateNewsSitemap(): Promise<void> {
    try {
      const sitemapDir = path.join(__dirname, '../../public/sitemaps');
      await fs.mkdir(sitemapDir, { recursive: true });

      const newsSitemap = await SitemapService.generateNewsSitemap();
      await fs.writeFile(path.join(sitemapDir, 'sitemap-news.xml'), newsSitemap);

      logger.info('News sitemap updated successfully');
    } catch (error) {
      logger.error('Error updating news sitemap:', error as Error);
    }
  }

  /**
   * Clean up old sitemap files
   */
  private static async cleanupOldSitemaps(): Promise<void> {
    try {
      const sitemapDir = path.join(__dirname, '../../public/sitemaps');
      const backupDir = path.join(sitemapDir, 'backups');
      
      // Create backup directory if it doesn't exist
      await fs.mkdir(backupDir, { recursive: true });

      // Get current date for backup naming
      const timestamp = new Date().toISOString().split('T')[0];

      // List of sitemap files to backup
      const sitemapFiles = [
        'sitemap.xml',
        'sitemap-main.xml',
        'sitemap-news.xml',
        'sitemap-images.xml'
      ];

      // Backup current sitemaps before cleanup
      for (const file of sitemapFiles) {
        const sourcePath = path.join(sitemapDir, file);
        const backupPath = path.join(backupDir, `${timestamp}-${file}`);
        
        try {
          await fs.copyFile(sourcePath, backupPath);
        } catch (error) {
          // File might not exist, continue
          logger.warn(`Could not backup ${file}: ${(error as Error).message}`);
        }
      }

      // Clean up old backup files (keep only last 7 days)
      const backupFiles = await fs.readdir(backupDir);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const file of backupFiles) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < sevenDaysAgo) {
          await fs.unlink(filePath);
          logger.info(`Deleted old backup file: ${file}`);
        }
      }

      logger.info('Sitemap cleanup completed successfully');
    } catch (error) {
      logger.error('Error during sitemap cleanup:', error as Error);
    }
  }

  /**
   * Force update all sitemaps (manual trigger)
   */
  static async forceUpdateSitemaps(): Promise<void> {
    logger.info('Force updating all sitemaps...');
    await this.updateSitemaps();
  }

  /**
   * Get scheduled tasks status
   */
  static getStatus(): {
    initialized: boolean;
    activeTasks: string[];
  } {
    return {
      initialized: this.isInitialized,
      activeTasks: [
        'Sitemap update (hourly)',
        'News sitemap update (every 15 minutes)',
        'Sitemap cleanup (daily at 2 AM)'
      ]
    };
  }
}

export default ScheduledTasksService;