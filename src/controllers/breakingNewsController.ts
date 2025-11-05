import { Request, Response } from 'express';
import { BreakingNews } from '../models/BreakingNews';

export const breakingNewsController = {
  // Get active breaking news (public)
  getActive: async (req: Request, res: Response) => {
    try {
      const activeNews = await BreakingNews.getActive();

      res.json({
        success: true,
        data: activeNews
      });
    } catch (error) {
      console.error('Error fetching active breaking news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active breaking news'
      });
    }
  },

  // Get all breaking news with pagination (admin)
  getAll: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [breakingNews, totalItems] = await Promise.all([
        BreakingNews.find()
          .populate('createdBy', 'fullName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        BreakingNews.countDocuments()
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      res.json({
        success: true,
        data: {
          breakingNews,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
            limit
          }
        }
      });
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch breaking news'
      });
    }
  },

  // Create breaking news (admin)
  create: async (req: Request, res: Response) => {
    try {
      const { text, isActive = false } = req.body;

      if (!text || text.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Breaking news text must be at least 5 characters long'
        });
      }

      if (text.length > 200) {
        return res.status(400).json({
          success: false,
          message: 'Breaking news text cannot exceed 200 characters'
        });
      }

      // If this breaking news is being set as active, deactivate all others
      if (isActive) {
        await BreakingNews.deactivateAll();
      }

      const breakingNews = new BreakingNews({
        text: text.trim(),
        isActive,
        createdBy: req.user!.id
      });

      await breakingNews.save();
      await breakingNews.populate('createdBy', 'fullName email');

      res.status(201).json({
        success: true,
        data: breakingNews,
        message: 'Breaking news created successfully'
      });
    } catch (error) {
      console.error('Error creating breaking news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create breaking news'
      });
    }
  },

  // Update breaking news (admin)
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { text, isActive } = req.body;

      const breakingNews = await BreakingNews.findById(id);
      if (!breakingNews) {
        return res.status(404).json({
          success: false,
          message: 'Breaking news not found'
        });
      }

      // Validate text if provided
      if (text !== undefined) {
        if (!text || text.trim().length < 5) {
          return res.status(400).json({
            success: false,
            message: 'Breaking news text must be at least 5 characters long'
          });
        }

        if (text.length > 200) {
          return res.status(400).json({
            success: false,
            message: 'Breaking news text cannot exceed 200 characters'
          });
        }

        breakingNews.text = text.trim();
      }

      // Handle activation/deactivation
      if (isActive !== undefined) {
        if (isActive) {
          // If activating this breaking news, deactivate all others first
          await BreakingNews.deactivateAll();
        }
        breakingNews.isActive = isActive;
      }

      await breakingNews.save();
      await breakingNews.populate('createdBy', 'fullName email');

      res.json({
        success: true,
        data: breakingNews,
        message: 'Breaking news updated successfully'
      });
    } catch (error) {
      console.error('Error updating breaking news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update breaking news'
      });
    }
  },

  // Delete breaking news (admin)
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const breakingNews = await BreakingNews.findByIdAndDelete(id);
      if (!breakingNews) {
        return res.status(404).json({
          success: false,
          message: 'Breaking news not found'
        });
      }

      res.json({
        success: true,
        message: 'Breaking news deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting breaking news:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete breaking news'
      });
    }
  },

  // Toggle active status (admin)
  toggleActive: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const breakingNews = await BreakingNews.findById(id);
      if (!breakingNews) {
        return res.status(404).json({
          success: false,
          message: 'Breaking news not found'
        });
      }

      if (!breakingNews.isActive) {
        // If activating, use the static method to ensure constraint
        const activatedNews = await BreakingNews.setActive(id);
        return res.json({
          success: true,
          data: activatedNews,
          message: 'Breaking news activated successfully'
        });
      } else {
        // If deactivating, just set to false
        breakingNews.isActive = false;
      }

      await breakingNews.save();
      await breakingNews.populate('createdBy', 'fullName email');

      res.json({
        success: true,
        data: breakingNews,
        message: `Breaking news ${breakingNews.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling breaking news status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle breaking news status'
      });
    }
  }
};