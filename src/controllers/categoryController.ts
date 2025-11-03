import { Request, Response } from 'express';
import { Category } from '../models/Category';
import { asyncHandler } from '../middleware/errorHandler';

// Get all categories
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await Category.find().sort({ displayOrder: 1, name: 1 });

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
    data: category
  });
});

// Create category (admin only)
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug, description, displayOrder } = req.body;

  const category = await Category.create({
    name,
    slug,
    description,
    displayOrder
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

// Update category (admin only)
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

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
    data: category
  });
});

// Delete category (admin only)
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});