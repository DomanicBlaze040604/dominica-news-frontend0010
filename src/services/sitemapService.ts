/**
 * Sitemap Generation Service
 * Generates XML sitemaps following Google News guidelines
 */

import Article from '../models/Article';
import { Category } from '../models/Category';
import { IAuthor } from '../models/Author';
import { StaticPage } from '../models/StaticPage';
import { toDominicanTime } from '../utils/timezone';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  news?: {
    publication: {
      name: string;
      language: string;
    };
    publication_date: string;
    title: string;
    keywords?: string;
  };
  image?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
}

export class SitemapService {
  private static readonly BASE_URL = process.env.BASE_URL || 'https://dominicanews.com';
  private static readonly PUBLICATION_NAME = 'Dominica News';

  /**
   * Generate main sitemap index
   */
  static async generateSitemapIndex(): Promise<string> {
    const sitemaps = [
      {
        loc: `${this.BASE_URL}/sitemap-main.xml`,
        lastmod: new Date().toISOString()
      },
      {
        loc: `${this.BASE_URL}/sitemap-news.xml`,
        lastmod: new Date().toISOString()
      },
      {
        loc: `${this.BASE_URL}/sitemap-images.xml`,
        lastmod: new Date().toISOString()
      }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    for (const sitemap of sitemaps) {
      xml += '  <sitemap>\n';
      xml += `    <loc>${sitemap.loc}</loc>\n`;
      xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
      xml += '  </sitemap>\n';
    }
    
    xml += '</sitemapindex>';
    return xml;
  }

  /**
   * Generate main sitemap with all published content
   */
  static async generateMainSitemap(): Promise<string> {
    const urls: SitemapUrl[] = [];

    // Homepage
    urls.push({
      loc: this.BASE_URL,
      lastmod: new Date().toISOString(),
      changefreq: 'hourly',
      priority: 1.0
    });

    // Published articles
    const articles = await Article.find({ status: 'published' })
      .populate('category', 'name slug')
      .populate('author', 'name slug')
      .sort({ publishedAt: -1 })
      .limit(50000); // Google's limit

    for (const article of articles) {
      const images = [];
      
      if (article.featuredImage) {
        images.push({
          loc: article.featuredImage.startsWith('http') 
            ? article.featuredImage 
            : `${this.BASE_URL}${article.featuredImage}`,
          caption: article.featuredImageAlt || article.title,
          title: article.title
        });
      }

      if (article.gallery && article.gallery.length > 0) {
        article.gallery.forEach(img => {
          images.push({
            loc: img.startsWith('http') ? img : `${this.BASE_URL}${img}`,
            caption: article.title,
            title: article.title
          });
        });
      }

      urls.push({
        loc: `${this.BASE_URL}/articles/${article.slug}`,
        lastmod: new Date(article.updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: article.isFeatured ? 0.9 : 0.8,
        image: images.length > 0 ? images : undefined
      });
    }

    // Categories
    const categories = await Category.find({ isActive: true });
    for (const category of categories) {
      urls.push({
        loc: `${this.BASE_URL}/category/${category.slug}`,
        lastmod: new Date((category as any).updatedAt).toISOString(),
        changefreq: 'daily',
        priority: 0.7
      });
    }

    // Authors - using direct import since we need the model
    const AuthorModel = require('../models/Author').default;
    const authors = await AuthorModel.find({ isActive: true });
    for (const author of authors) {
      urls.push({
        loc: `${this.BASE_URL}/author/${author.slug}`,
        lastmod: new Date((author as any).updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: 0.6
      });
    }

    // Static pages
    const staticPages = await StaticPage.find({ isPublished: true });
    for (const page of staticPages) {
      urls.push({
        loc: `${this.BASE_URL}/${page.slug}`,
        lastmod: new Date((page as any).updatedAt).toISOString(),
        changefreq: 'monthly',
        priority: 0.5
      });
    }

    return this.generateXMLSitemap(urls);
  }

  /**
   * Generate news sitemap for recent articles (last 2 days)
   */
  static async generateNewsSitemap(): Promise<string> {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const recentArticles = await Article.find({
      status: 'published',
      publishedAt: { $gte: twoDaysAgo }
    })
    .populate('category', 'name slug')
    .populate('author', 'name slug')
    .sort({ publishedAt: -1 })
    .limit(1000); // Google News limit

    const urls: SitemapUrl[] = [];

    for (const article of recentArticles) {
      const keywords = [
        ...article.tags,
        (article.category as any).name,
        'Dominica News',
        'Breaking News'
      ].join(', ');

      urls.push({
        loc: `${this.BASE_URL}/articles/${article.slug}`,
        lastmod: new Date(article.updatedAt).toISOString(),
        news: {
          publication: {
            name: this.PUBLICATION_NAME,
            language: article.language || 'en'
          },
          publication_date: new Date(article.publishedAt || article.createdAt).toISOString(),
          title: article.title,
          keywords: keywords
        }
      });
    }

    return this.generateNewsXMLSitemap(urls);
  }

  /**
   * Generate image sitemap for all media content
   */
  static async generateImageSitemap(): Promise<string> {
    const articles = await Article.find({ 
      status: 'published',
      $or: [
        { featuredImage: { $exists: true, $ne: null } },
        { gallery: { $exists: true, $not: { $size: 0 } } }
      ]
    })
    .populate('category', 'name slug')
    .sort({ publishedAt: -1 })
    .limit(50000);

    const urls: SitemapUrl[] = [];

    for (const article of articles) {
      const images = [];
      
      if (article.featuredImage) {
        images.push({
          loc: article.featuredImage.startsWith('http') 
            ? article.featuredImage 
            : `${this.BASE_URL}${article.featuredImage}`,
          caption: article.featuredImageAlt || article.title,
          title: article.title
        });
      }

      if (article.gallery && article.gallery.length > 0) {
        article.gallery.forEach(img => {
          images.push({
            loc: img.startsWith('http') ? img : `${this.BASE_URL}${img}`,
            caption: article.title,
            title: article.title
          });
        });
      }

      if (images.length > 0) {
        urls.push({
          loc: `${this.BASE_URL}/articles/${article.slug}`,
          lastmod: new Date(article.updatedAt).toISOString(),
          image: images
        });
      }
    }

    return this.generateXMLSitemap(urls);
  }

  /**
   * Generate standard XML sitemap
   */
  private static generateXMLSitemap(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    xml += ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    for (const url of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      
      if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }
      
      if (url.priority !== undefined) {
        xml += `    <priority>${url.priority}</priority>\n`;
      }

      // Add image tags
      if (url.image && url.image.length > 0) {
        for (const img of url.image) {
          xml += '    <image:image>\n';
          xml += `      <image:loc>${this.escapeXml(img.loc)}</image:loc>\n`;
          if (img.caption) {
            xml += `      <image:caption>${this.escapeXml(img.caption)}</image:caption>\n`;
          }
          if (img.title) {
            xml += `      <image:title>${this.escapeXml(img.title)}</image:title>\n`;
          }
          xml += '    </image:image>\n';
        }
      }
      
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate news XML sitemap
   */
  private static generateNewsXMLSitemap(urls: SitemapUrl[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    xml += ' xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

    for (const url of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }

      if (url.news) {
        xml += '    <news:news>\n';
        xml += '      <news:publication>\n';
        xml += `        <news:name>${this.escapeXml(url.news.publication.name)}</news:name>\n`;
        xml += `        <news:language>${url.news.publication.language}</news:language>\n`;
        xml += '      </news:publication>\n';
        xml += `      <news:publication_date>${url.news.publication_date}</news:publication_date>\n`;
        xml += `      <news:title>${this.escapeXml(url.news.title)}</news:title>\n`;
        
        if (url.news.keywords) {
          xml += `      <news:keywords>${this.escapeXml(url.news.keywords)}</news:keywords>\n`;
        }
        
        xml += '    </news:news>\n';
      }
      
      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Escape XML special characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Get sitemap statistics
   */
  static async getSitemapStats(): Promise<{
    totalUrls: number;
    articles: number;
    categories: number;
    authors: number;
    staticPages: number;
    recentNews: number;
    imagesCount: number;
    lastGenerated: Date;
  }> {
    const [
      articlesCount,
      categoriesCount,
      authorsCount,
      staticPagesCount,
      recentNewsCount,
      articlesWithImages
    ] = await Promise.all([
      Article.countDocuments({ status: 'published' }),
      Category.countDocuments({ isActive: true }),
      require('../models/Author').default.countDocuments({ isActive: true }),
      StaticPage.countDocuments({ isPublished: true }),
      Article.countDocuments({
        status: 'published',
        publishedAt: { $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      }),
      Article.countDocuments({
        status: 'published',
        $or: [
          { featuredImage: { $exists: true, $ne: null } },
          { gallery: { $exists: true, $not: { $size: 0 } } }
        ]
      })
    ]);

    const totalUrls = 1 + articlesCount + categoriesCount + authorsCount + staticPagesCount; // +1 for homepage

    return {
      totalUrls,
      articles: articlesCount,
      categories: categoriesCount,
      authors: authorsCount,
      staticPages: staticPagesCount,
      recentNews: recentNewsCount,
      imagesCount: articlesWithImages,
      lastGenerated: new Date()
    };
  }
}

export default SitemapService;