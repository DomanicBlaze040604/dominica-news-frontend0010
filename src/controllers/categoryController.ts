import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Category } from '../models/Category';
import { slugify, generateUniqueSlug } from '../utils/slugify';
import { CustomError } from '../middleware/errorHandler';

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Category.find()
      .sort({ displayOrder: 1, name: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      data: {
        categories,
        count: categories.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug }).select('-__v');

    if (!category) {
      throw new CustomError('Category not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
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

    const { name, description, displayOrder } = req.body;

    // Generate slug from name
    const baseSlug = slugify(name);
    const slug = await generateUniqueSlug(baseSlug, async (slug: string) => {
      const existingCategory = await Category.findOne({ slug });
      return !!existingCategory;
    });

    // Create new category
    const category = new Category({
      name,
      slug,
      description,
      displayOrder: displayOrder || 0,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category: category.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
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
    const { name, description, displayOrder } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw new CustomError('Category not found', 404);
    }

    // Update fields if provided
    if (name !== undefined) {
      // Generate new slug if name changed
      if (name !== category.name) {
        const baseSlug = slugify(name);
        const slug = await generateUniqueSlug(baseSlug, async (slug: string) => {
          const existingCategory = await Category.findOne({ 
            slug, 
            _id: { $ne: id } // Exclude current category
          });
          return !!existingCategory;
        });
        category.slug = slug;
      }
      category.name = name;
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (displayOrder !== undefined) {
      category.displayOrder = displayOrder;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category: category.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      throw new CustomError('Category not found', 404);
    }

    // Check if category has articles
    const { Article } = await import('../models/Article');
    const articleCount = await Article.countDocuments({ categoryId: id });
    if (articleCount > 0) {
      throw new CustomError('Cannot delete category with existing articles', 400);
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
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
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const category = await Category.findOne({ slug });
    if (!category) {
      throw new CustomError('Category not found', 404);
    }

    // Import Article model
    const { Article } = await import('../models/Article');

    const articles = await Article.find({ 
      categoryId: category._id,
      status: 'published'
    })
    .populate('authorId', 'fullName')
    .select('-content') // Exclude full content for list view
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

    const totalArticles = await Article.countDocuments({ 
      categoryId: category._id,
      status: 'published'
    });

    // Transform articles to include populated data in expected format
    const transformedArticles = articles.map((article: any) => ({
      ...article,
      author: article.authorId,
      authorId: undefined,
    }));

    res.status(200).json({
      success: true,
      data: {
        category: category.toJSON(),
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