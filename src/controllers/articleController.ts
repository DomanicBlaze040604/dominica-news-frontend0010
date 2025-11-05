import { Request, Response } from 'express';
import Article, { IArticle } from '../models/Article';
import Author from '../models/Author';
import { Category } from '../models/Category';
import { slugify } from '../utils/slugify';
import { getDominicanTime, toDominicanTime } from '../utils/timezone';

// Create article with rich text content
export const createArticle = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug: providedSlug,
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      categoryId,
      authorId,
      tags,
      status,
      scheduledAt,
      seoTitle,
      seoDescription,
      isBreaking,
      isFeatured,
      isPinned,
      location,
      language
    } = req.body;

    // Use provided slug or generate from title
    let slug = providedSlug || slugify(title);
    
    // Ensure slug is unique
    let counter = 1;
    const baseSlug = slug;
    while (await Article.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Verify author and category exist
    const [authorExists, categoryExists] = await Promise.all([
      Author.findById(authorId),
      Category.findById(categoryId)
    ]);

    if (!authorExists) {
      return res.status(400).json({
        success: false,
        message: 'Author not found'
      });
    }

    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    const articleData: Partial<IArticle> = {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      author: authorId,
      category: categoryId,
      tags: tags || [],
      status: status || 'draft',
      seo: {
        metaTitle: seoTitle,
        metaDescription: seoDescription,
      },
      isBreaking: isBreaking || false,
      isFeatured: isFeatured || false,
      isPinned: isPinned || false,
      location,
      language: language || 'en'
    };

    // Handle scheduling
    if (scheduledAt) {
      articleData.scheduledFor = toDominicanTime(scheduledAt);
    }

    // Set published date if publishing immediately
    if (status === 'published') {
      articleData.publishedAt = getDominicanTime();
    }

    const article = new Article(articleData);
    await article.save();

    // Update author's article count
    await Author.findByIdAndUpdate(authorId, { $inc: { articlesCount: 1 } });

    // Populate author and category for response
    await article.populate(['author', 'category']);

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message
    });
  }
};

// Get all articles with filtering and pagination
export const getArticles = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      author,
      isBreaking,
      isFeatured,
      isPinned,
      search,
      language,
      location
    } = req.query;

    const query: any = {};

    // Build filter query
    if (status) query.status = status;
    if (category) query.category = category;
    if (author) query.author = author;
    if (isBreaking !== undefined) query.isBreaking = isBreaking === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (isPinned !== undefined) query.isPinned = isPinned === 'true';
    if (language) query.language = language;
    if (location) query.location = new RegExp(location as string, 'i');

    // Text search
    if (search) {
      query.$text = { $search: search as string };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get articles with pagination
    const [articles, total] = await Promise.all([
      Article.find(query)
        .populate('author', 'name email avatar specialization')
        .populate('category', 'name slug color')
        .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Article.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: articles,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
};

// Get single article by slug
export const getArticleBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const article = await Article.findOne({ slug })
      .populate('author', 'name email avatar bio specialization socialMedia')
      .populate('category', 'name slug color description');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Increment view count
    await Article.findByIdAndUpdate(article._id, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: article
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message
    });
  }
};

// Update article
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug: providedSlug,
      content,
      excerpt,
      featuredImage,
      featuredImageAlt,
      categoryId,
      authorId,
      status,
      scheduledAt,
      isPinned,
      seoTitle,
      seoDescription,
      ...otherFields
    } = req.body;

    const updateData: any = {
      ...otherFields
    };

    // Update basic fields
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (featuredImageAlt !== undefined) updateData.featuredImageAlt = featuredImageAlt;
    if (categoryId !== undefined) updateData.category = categoryId;
    if (authorId !== undefined) updateData.author = authorId;
    if (status !== undefined) updateData.status = status;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    // Handle SEO fields
    if (seoTitle !== undefined || seoDescription !== undefined) {
      updateData.seo = {
        metaTitle: seoTitle,
        metaDescription: seoDescription,
      };
    }

    // Handle slug - use provided slug or generate from title
    if (providedSlug) {
      // Ensure provided slug is unique
      let slug = providedSlug;
      let counter = 1;
      const baseSlug = slug;
      while (await Article.findOne({ slug, _id: { $ne: id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      updateData.slug = slug;
    } else if (title) {
      // Generate slug from title if no slug provided
      let newSlug = slugify(title);
      let counter = 1;
      
      // Make slug unique by checking against other articles (excluding current one)
      while (await Article.findOne({ slug: newSlug, _id: { $ne: id } })) {
        newSlug = `${slugify(title)}-${counter}`;
        counter++;
      }
      
      updateData.slug = newSlug;
    }

    // Handle status change to published
    if (status === 'published' && !updateData.publishedAt) {
      updateData.publishedAt = getDominicanTime();
    }

    // Handle scheduling
    if (scheduledAt) {
      updateData.scheduledFor = toDominicanTime(scheduledAt);
    }

    const article = await Article.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate(['author', 'category']);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article updated successfully',
      data: article
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating article',
      error: error.message
    });
  }
};

// Delete article
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    await Article.findByIdAndDelete(id);

    // Update author's article count
    await Author.findByIdAndUpdate(article.author, { $inc: { articlesCount: -1 } });

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message
    });
  }
};

// Get breaking news
export const getBreakingNews = async (req: Request, res: Response) => {
  try {
    const breakingNews = await Article.find({
      status: 'published',
      isBreaking: true
    })
      .populate('author', 'name')
      .populate('category', 'name color')
      .sort({ publishedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: breakingNews
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching breaking news',
      error: error.message
    });
  }
};

// Get featured articles
export const getFeaturedArticles = async (req: Request, res: Response) => {
  try {
    const featured = await Article.find({
      status: 'published',
      isFeatured: true
    })
      .populate('author', 'name avatar')
      .populate('category', 'name color')
      .sort({ publishedAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: featured
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured articles',
      error: error.message
    });
  }
};

// Get articles by category slug
export const getCategoryArticles = async (req: Request, res: Response) => {
  try {
    const { categorySlug } = req.params;
    const {
      page = 1,
      limit = 12,
      status = 'published'
    } = req.query;

    // Find the category by slug
    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get articles for this category
    const [articles, totalArticles] = await Promise.all([
      Article.find({ 
        category: category._id,
        status: status
      })
        .populate('author', 'name email avatar specialization')
        .populate('category', 'name slug color description')
        .sort({ isPinned: -1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Article.countDocuments({ 
        category: category._id,
        status: status
      })
    ]);

    const totalPages = Math.ceil(totalArticles / limitNum);

    res.json({
      success: true,
      data: {
        category,
        articles,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalArticles,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
          limit: limitNum
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category articles',
      error: error.message
    });
  }
};