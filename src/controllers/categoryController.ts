import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { asyncHandler } from '../middleware/errorHandler';

// Get all categories
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find()
    .populate('articleCount')
    .sort({ displayOrder: 1, name: 1 });

  res.json({
    success: true,
    data: categories
  });
});

// Get single category by slug
export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const category = await Category.findOne({ slug });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.json({
    success: true,
    data: { category }
  });
});

// Check if slug is available
export const checkSlugAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { excludeId } = req.query;

  const query: any = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingCategory = await Category.findOne(query);

  res.json({
    success: true,
    data: { available: !existingCategory }
  });
});

// Get category preview with recent articles for navigation
export const getCategoryPreview = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { limit = 5 } = req.query;

  const category = await Category.findOne({ slug });
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Get recent articles for this category
  const Article = require('../models/Article').default;
  const [articles, count] = await Promise.all([
    Article.find({ 
      category: category._id,
      status: 'published'
    })
      .populate('author', 'name')
      .select('title slug featuredImage publishedAt createdAt')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(parseInt(limit as string)),
    Article.countDocuments({ 
      category: category._id,
      status: 'published'
    })
  ]);

  res.json({
    success: true,
    data: {
      category,
      articles,
      count
    }
  });
});

// Create category (admin only)
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, description, displayOrder } = req.body;

  // Auto-generate slug from name if not provided
  const { slugify, generateUniqueSlug } = require('../utils/slugify');
  const baseSlug = slug || slugify(name);

  // Generate unique slug
  const uniqueSlug = await generateUniqueSlug(
    baseSlug,
    async (testSlug: string) => {
      const existing = await Category.findOne({ slug: testSlug });
      return !!existing;
    }
  );

  const category = await Category.create({
    name,
    slug: uniqueSlug,
    description,
    displayOrder
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
});

// Update category (admin only)
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Auto-generate slug from name if name is being updated but slug is not provided
  if (updateData.name && !updateData.slug) {
    const { slugify, generateUniqueSlug } = require('../utils/slugify');
    const baseSlug = slugify(updateData.name);
    
    // Generate unique slug excluding current category
    const uniqueSlug = await generateUniqueSlug(
      baseSlug,
      async (testSlug: string) => {
        const existing = await Category.findOne({ slug: testSlug, _id: { $ne: id } });
        return !!existing;
      }
    );
    
    updateData.slug = uniqueSlug;
  }

  const category = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: { category }
  });
});

// Delete category (admin only)
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reassignTo, forceDelete } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  // Check if there are articles using this category
  const Article = require('../models/Article').default;
  const articlesCount = await Article.countDocuments({ category: id });

  if (articlesCount > 0) {
    if (!forceDelete && !reassignTo) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with articles',
        data: {
          articlesCount,
          requiresReassignment: true
        }
      });
    }

    if (reassignTo) {
      // Verify the reassignment category exists
      const reassignCategory = await Category.findById(reassignTo);
      if (!reassignCategory) {
        return res.status(400).json({
          success: false,
          message: 'Reassignment category not found'
        });
      }

      // Reassign all articles to the new category
      await Article.updateMany(
        { category: id },
        { category: reassignTo }
      );
    } else if (forceDelete) {
      // Create an "Uncategorized" category if it doesn't exist
      let uncategorizedCategory = await Category.findOne({ slug: 'uncategorized' });
      if (!uncategorizedCategory) {
        uncategorizedCategory = await Category.create({
          name: 'Uncategorized',
          slug: 'uncategorized',
          description: 'Articles without a specific category',
          displayOrder: 999
        });
      }

      // Reassign all articles to uncategorized
      await Article.updateMany(
        { category: id },
        { category: uncategorizedCategory._id }
      );
    }
  }

  // Delete the category
  await Category.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Category deleted successfully',
    data: {
      articlesReassigned: articlesCount,
      reassignedTo: reassignTo || 'uncategorized'
    }
  });
});