import { Category } from './Category';
import mongoose from 'mongoose';

describe('Category Model', () => {
  beforeEach(async () => {
    await Category.deleteMany({});
  });

  describe('Category Creation', () => {
    it('should create a category with valid data', async () => {
      const categoryData = {
        name: 'Technology',
        slug: 'technology',
        description: 'Technology related news',
        displayOrder: 1,
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.slug).toBe(categoryData.slug);
      expect(savedCategory.description).toBe(categoryData.description);
      expect(savedCategory.displayOrder).toBe(categoryData.displayOrder);
      expect(savedCategory.createdAt).toBeDefined();
    });

    it('should create a category with minimal data', async () => {
      const categoryData = {
        name: 'Sports',
        slug: 'sports',
      };

      const category = new Category(categoryData);
      const savedCategory = await category.save();

      expect(savedCategory.name).toBe(categoryData.name);
      expect(savedCategory.slug).toBe(categoryData.slug);
      expect(savedCategory.description).toBeUndefined();
      expect(savedCategory.displayOrder).toBe(0); // Default value
    });

    it('should not include _id and __v in JSON output', async () => {
      const category = new Category({
        name: 'Entertainment',
        slug: 'entertainment',
      });

      await category.save();
      const categoryJSON = category.toJSON();

      expect(categoryJSON.id).toBeDefined();
      expect(categoryJSON._id).toBeUndefined();
      expect(categoryJSON.__v).toBeUndefined();
    });
  });

  describe('Category Validation', () => {
    it('should require name', async () => {
      const category = new Category({
        slug: 'test',
      });

      await expect(category.save()).rejects.toThrow('Category name is required');
    });

    it('should require slug', async () => {
      const category = new Category({
        name: 'Test Category',
      });

      await expect(category.save()).rejects.toThrow('Category slug is required');
    });

    it('should enforce unique name', async () => {
      const categoryData = {
        name: 'Technology',
        slug: 'technology',
      };

      await new Category(categoryData).save();

      const duplicateCategory = new Category({
        name: 'Technology',
        slug: 'tech',
      });

      await expect(duplicateCategory.save()).rejects.toThrow();
    });

    it('should enforce unique slug', async () => {
      const categoryData = {
        name: 'Technology',
        slug: 'technology',
      };

      await new Category(categoryData).save();

      const duplicateCategory = new Category({
        name: 'Tech',
        slug: 'technology',
      });

      await expect(duplicateCategory.save()).rejects.toThrow();
    });

    it('should enforce name length constraints', async () => {
      // Too short
      const shortNameCategory = new Category({
        name: 'A',
        slug: 'a',
      });

      await expect(shortNameCategory.save()).rejects.toThrow(
        'Category name must be at least 2 characters long'
      );

      // Too long
      const longNameCategory = new Category({
        name: 'A'.repeat(101),
        slug: 'long-name',
      });

      await expect(longNameCategory.save()).rejects.toThrow(
        'Category name cannot exceed 100 characters'
      );
    });

    it('should enforce description length constraint', async () => {
      const category = new Category({
        name: 'Technology',
        slug: 'technology',
        description: 'A'.repeat(501),
      });

      await expect(category.save()).rejects.toThrow(
        'Category description cannot exceed 500 characters'
      );
    });

    it('should enforce slug format', async () => {
      const category = new Category({
        name: 'Technology',
        slug: 'Technology With Spaces',
      });

      await expect(category.save()).rejects.toThrow(
        'Slug must contain only lowercase letters, numbers, and hyphens'
      );
    });

    it('should enforce non-negative display order', async () => {
      const category = new Category({
        name: 'Technology',
        slug: 'technology',
        displayOrder: -1,
      });

      await expect(category.save()).rejects.toThrow(
        'Display order cannot be negative'
      );
    });

    it('should trim whitespace from name and description', async () => {
      const category = new Category({
        name: '  Technology  ',
        slug: 'technology',
        description: '  Tech news  ',
      });

      await category.save();

      expect(category.name).toBe('Technology');
      expect(category.description).toBe('Tech news');
    });

    it('should convert slug to lowercase', async () => {
      const category = new Category({
        name: 'Technology',
        slug: 'TECHNOLOGY',
      });

      await category.save();

      expect(category.slug).toBe('technology');
    });
  });

  describe('Category Queries', () => {
    beforeEach(async () => {
      // Create test categories
      await Category.create([
        { name: 'Technology', slug: 'technology', displayOrder: 1 },
        { name: 'Sports', slug: 'sports', displayOrder: 2 },
        { name: 'Entertainment', slug: 'entertainment', displayOrder: 0 },
      ]);
    });

    it('should find category by slug', async () => {
      const category = await Category.findOne({ slug: 'technology' });

      expect(category).toBeTruthy();
      expect(category?.name).toBe('Technology');
    });

    it('should find categories ordered by displayOrder', async () => {
      const categories = await Category.find().sort({ displayOrder: 1 });

      expect(categories).toHaveLength(3);
      expect(categories[0].name).toBe('Entertainment'); // displayOrder: 0
      expect(categories[1].name).toBe('Technology'); // displayOrder: 1
      expect(categories[2].name).toBe('Sports'); // displayOrder: 2
    });

    it('should find categories by name pattern', async () => {
      const categories = await Category.find({
        name: { $regex: 'tech', $options: 'i' },
      });

      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe('Technology');
    });
  });
});