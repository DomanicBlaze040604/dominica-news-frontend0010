import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Article } from '../models/Article';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { CustomError } from '../middleware/errorHandler';
import { slugify, generateUniqueSlug } from '../utils/slugify';

export const getPublishedArticles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 articles per page
    const skip = (page - 1) * limit;
    const categorySlug = req.query.category as string;

    // Build query for published articles
    const query: any = { status: 'published' };

    // Filter by category if provided
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (!category) {
        throw new CustomError('Category not found', 404);
      }
      query.categoryId = category._id;
    }

    // Get articles with populated references
    const articles = await Article.find(query)
      .populate('categoryId', 'name slug')
      .populate('authorId', 'fullName')
      .select('-content') // Exclude full content for list view
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalArticles = await Article.countDocuments(query);

    // Transform articles to include populated data in expected format
    const transformedArticles = articles.map((article: any) => ({
      ...article,
      category: article.categoryId,
      author: article.authorId,
      categoryId: undefined,
      authorId: undefined,
    }));

    res.status(200).json({
      success: true,
      data: {
        articles: transformedArticles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalArticles / limit),
          totalArticles,
          hasNextPage: page < Math.ceil(totalArticles / limit),
          hasPrevPage: page > 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getArticleBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const article = await Article.findOne({ slug, status: 'published' })
      .populate('categoryId', 'name slug description')
      .populate('authorId', 'fullName')
      .lean();

    if (!article) {
      throw new CustomError('Article not found', 404);
    }

    // Transform article to include populated data in expected format
    const transformedArticle = {
      ...article,
      category: article.categoryId,
      author: article.authorId,
      categoryId: undefined,
      authorId: undefined,
    };

    res.status(200).json({
      success: true,
      data: {
        article: transformedArticle,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRelatedArticles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 10); // Max 10 related articles

    // First, get the current article to find its category
    const currentArticle = await Article.findOne({ slug, status: 'published' })
      .select('categoryId _id')
      .lean();

    if (!currentArticle) {
      throw new CustomError('Article not found', 404);
    }

    // Find related articles from the same category, excluding the current article
    const relatedArticles = await Article.find({
      categoryId: currentArticle.categoryId,
      status: 'published',
      _id: { $ne: currentArticle._id },
    })
      .populate('categoryId', 'name slug')
      .populate('authorId', 'fullName')
      .select('-content') // Exclude full content
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();

    // Transform articles to include populated data in expected format
    const transformedArticles = relatedArticles.map((article: any) => ({
      ...article,
      category: article.categoryId,
      author: article.authorId,
      categoryId: undefined,
      authorId: undefined,
    }));

    res.status(200).json({
      success: true,
      data: {
        articles: transformedArticles,
        count: transformedArticles.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryArticles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 articles per page
    const skip = (page - 1) * limit;

    // Find the category
    const category = await Category.findOne({ slug }).lean();
    if (!category) {
      throw new CustomError('Category not found', 404);
    }

    // Get articles for this category
    const articles = await Article.find({
      categoryId: category._id,
      status: 'published',
    })
      .populate('categoryId', 'name slug')
      .populate('authorId', 'fullName')
      .select('-content') // Exclude full content for list view
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalArticles = await Article.countDocuments({
      categoryId: category._id,
      status: 'published',
    });

    // Transform articles to include populated data in expected format
    const transformedArticles = articles.map((article: any) => ({
      ...article,
      category: article.categoryId,
      author: article.authorId,
      categoryId: undefined,
      authorId: undefined,
    }));

    res.status(200).json({
      success: true,
      data: {
        category,
        articles: transformedArticles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalArticles / limit),
          totalArticles,
          hasNextPage: page < Math.ceil(totalArticles / limit),
          hasPrevPage: page > 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin article management functions

export const getAdminArticles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Max 50 articles per page
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const categorySlug = req.query.category as string;

    // Build query for admin articles (all statuses)
    const query: any = {};

    // Filter by status if provided
    if (status && ['draft', 'published'].includes(status)) {
      query.status = status;
    }

    // Filter by category if provided
    if (categorySlug) {
      const category = await Category.findOne({ slug: categorySlug });
      if (!category) {
        throw new CustomError('Category not found', 404);
      }
      query.categoryId = category._id;
    }

    // Get articles with populated references
    const articles = await Article.find(query)
      .populate('categoryId', 'name slug')
      .populate('authorId', 'fullName')
      .sort({ updatedAt: -1 }) // Sort by most recently updated
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalArticles = await Article.countDocuments(query);

    // Transform articles to include populated data in expected format
    const transformedArticles = articles.map((article: any) => ({
      ...article,
      category: article.categoryId,
      author: article.authorId,
      categoryId: undefined,
      authorId: undefined,
    }));

    res.status(200).json({
      success: true,
      data: {
        articles: transformedArticles,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalArticles / limit),
          totalArticles,
          hasNextPage: page < Math.ceil(totalArticles / limit),
          hasPrevPage: page > 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError('Validation failed', 400);
    }

    const { title, excerpt, content, featuredImage, categoryId, status } = req.body;
    const authorId = (req as any).user.id; // From authentication middleware

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new CustomError('Category not found', 404);
    }

    // Generate slug from title
    const baseSlug = slugify(title);
    const slug = await generateUniqueSlug(baseSlug, async (slug: string) => {
      const existingArticle = await Article.findOne({ slug });
      return !!existingArticle;
    });

    // Create new article
    const article = new Article({
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      categoryId,
      authorId,
      status: status || 'draft',
    });

    await article.save();

    // Populate the article for response
    const populatedArticle = await Article.findById(article._id)
      .populate('categoryId', 'name slug')
      .populate('authorId', 'fullName')
      .lean();

    // Transform article to include populated data in expected format
    const transformedArticle = {
      ...populatedArticle,
      category: (populatedArticle as any).categoryId,
      author: (populatedArticle as any).authorId,
      categoryId: undefined,
      authorId: undefined,
    };

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: {
        article: transformedArticle,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError('Validation failed', 400);
    }

    const { id } = req.params;
    const { title, excerpt, content, featuredImage, categoryId, status } = req.body;

    const article = await Article.findById(id);
    if (!article) {
      throw new CustomError('Article not found', 404);
    }

    // Verify category exists if provided
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        throw new CustomError('Category not found', 404);
      }
      article.categoryId = categoryId;
    }

    // Update fields if provided
    if (title !== undefined) {
      // Generate new slug if title changed
      if (title !== article.title) {
        const baseSlug = slugify(title);
        const slug = await generateUniqueSlug(baseSlug, async (slug: string) => {
          const existingArticle = await Article.findOne({ 
            slug, 
            _id: { $ne: id } // Exclude current article
          });
          return !!existingArticle;
        });
        article.slug = slug;
      }
      article.title = title;
    }

    if (excerpt !== undefined) {
      article.excerpt = excerpt;
    }

    if (content !== undefined) {
      article.content = content;
    }

    if (featuredImage !== undefined) {
      article.featuredImage = featuredImage;
    }

    if (status !== undefined) {
      article.status = status;
    }

    await article.save();

    // Populate the article for response
    const populatedArticle = await Article.findById(article._id)
      .populate('categoryId', 'name slug')
      .populate('authorId', 'fullName')
      .lean();

    // Transform article to include populated data in expected format
    const transformedArticle = {
      ...populatedArticle,
      category: (populatedArticle as any).categoryId,
      author: (populatedArticle as any).authorId,
      categoryId: undefined,
      authorId: undefined,
    };

    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: {
        article: transformedArticle,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);
    if (!article) {
      throw new CustomError('Article not found', 404);
    }

    await Article.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminArticleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id)
      .populate('categoryId', 'name slug description')
      .populate('authorId', 'fullName')
      .lean();

    if (!article) {
      throw new CustomError('Article not found', 404);
    }

    // Transform article to include populated data in expected format
    const transformedArticle = {
      ...article,
      category: article.categoryId,
      author: article.authorId,
      categoryId: undefined,
      authorId: undefined,
    };

    res.status(200).json({
      success: true,
      data: {
        article: transformedArticle,
      },
    });
  } catch (error) {
    next(error);
  }
};