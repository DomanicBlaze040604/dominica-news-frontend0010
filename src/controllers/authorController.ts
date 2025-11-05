import { Request, Response } from 'express';
import Author, { IAuthor } from '../models/Author';
import Article from '../models/Article';
import { AuthorSlugService } from '../services/authorSlugService';

// Create new author
export const createAuthor = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      bio,
      avatar,
      title,
      professionalBackground,
      expertise,
      socialMedia,
      specialization,
      location,
      phone,
      website
    } = req.body;

    // Check if author with email already exists
    const existingAuthor = await Author.findOne({ email });
    if (existingAuthor) {
      return res.status(400).json({
        success: false,
        message: 'Author with this email already exists'
      });
    }

    // Generate unique slug
    const slug = await AuthorSlugService.generateSlug(name);

    const author = new Author({
      name,
      slug,
      email,
      bio,
      avatar,
      title,
      professionalBackground,
      expertise,
      socialMedia,
      specialization,
      location,
      phone,
      website
    });

    await author.save();

    res.status(201).json({
      success: true,
      message: 'Author created successfully',
      data: author
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating author',
      error: error.message
    });
  }
};

// Get all authors with filtering and pagination
export const getAuthors = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      specialization,
      search,
      location
    } = req.query;

    const query: any = {};

    // Build filter query
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (specialization) query.specialization = { $in: [specialization] };
    if (location) query.location = new RegExp(location as string, 'i');

    // Text search
    if (search) {
      query.$text = { $search: search as string };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get authors with pagination
    const [authors, total] = await Promise.all([
      Author.find(query)
        .sort({ articlesCount: -1, joinDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Author.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: authors,
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
      message: 'Error fetching authors',
      error: error.message
    });
  }
};

// Get single author by ID or slug
export const getAuthorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try to find by ID first, then by slug
    let author = await Author.findById(id);
    if (!author) {
      author = await Author.findOne({ slug: id });
    }

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Get author's recent articles
    const recentArticles = await Article.find({
      author: author._id,
      status: 'published'
    })
      .populate('category', 'name color slug')
      .sort({ publishedAt: -1 })
      .limit(5)
      .select('title slug excerpt featuredImage publishedAt views likes category');

    res.json({
      success: true,
      data: {
        author,
        recentArticles
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching author',
      error: error.message
    });
  }
};

// Get author by slug specifically
export const getAuthorBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const author = await Author.findOne({ slug, isActive: true });
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Get author's published articles with pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [articles, totalArticles] = await Promise.all([
      Article.find({
        author: author._id,
        status: 'published'
      })
        .populate('category', 'name color slug')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title slug excerpt featuredImage publishedAt views likes category isBreaking isFeatured'),
      Article.countDocuments({
        author: author._id,
        status: 'published'
      })
    ]);

    res.json({
      success: true,
      data: {
        author,
        articles,
        pagination: {
          current: page,
          pages: Math.ceil(totalArticles / limit),
          total: totalArticles,
          limit
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching author',
      error: error.message
    });
  }
};

// Update author
export const updateAuthor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingAuthor = await Author.findOne({ 
        email: updateData.email, 
        _id: { $ne: id } 
      });
      
      if (existingAuthor) {
        return res.status(400).json({
          success: false,
          message: 'Author with this email already exists'
        });
      }
    }

    // If name is being updated, regenerate slug
    if (updateData.name) {
      const newSlug = await AuthorSlugService.generateSlug(updateData.name, id);
      updateData.slug = newSlug;
    }

    const author = await Author.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    res.json({
      success: true,
      message: 'Author updated successfully',
      data: author
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating author',
      error: error.message
    });
  }
};

// Delete author
export const deleteAuthor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Check if author has published articles
    const articleCount = await Article.countDocuments({ 
      author: id, 
      status: 'published' 
    });

    if (articleCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete author with ${articleCount} published articles. Please reassign or delete articles first.`
      });
    }

    await Author.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Author deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting author',
      error: error.message
    });
  }
};

// Get author statistics
export const getAuthorStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    // Get comprehensive stats
    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      totalViews,
      totalLikes,
      totalShares,
      breakingNewsCount,
      featuredCount
    ] = await Promise.all([
      Article.countDocuments({ author: id }),
      Article.countDocuments({ author: id, status: 'published' }),
      Article.countDocuments({ author: id, status: 'draft' }),
      Article.aggregate([
        { $match: { author: id } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ]),
      Article.aggregate([
        { $match: { author: id } },
        { $group: { _id: null, total: { $sum: '$likes' } } }
      ]),
      Article.aggregate([
        { $match: { author: id } },
        { $group: { _id: null, total: { $sum: '$shares' } } }
      ]),
      Article.countDocuments({ author: id, isBreaking: true }),
      Article.countDocuments({ author: id, isFeatured: true })
    ]);

    // Get monthly article count for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Article.aggregate([
      {
        $match: {
          author: id,
          status: 'published',
          publishedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        author: {
          name: author.name,
          email: author.email,
          joinDate: author.joinDate,
          specialization: author.specialization
        },
        stats: {
          totalArticles,
          publishedArticles,
          draftArticles,
          totalViews: totalViews[0]?.total || 0,
          totalLikes: totalLikes[0]?.total || 0,
          totalShares: totalShares[0]?.total || 0,
          breakingNewsCount,
          featuredCount,
          monthlyStats
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching author statistics',
      error: error.message
    });
  }
};

// Toggle author active status
export const toggleAuthorStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const author = await Author.findById(id);
    if (!author) {
      return res.status(404).json({
        success: false,
        message: 'Author not found'
      });
    }

    author.isActive = !author.isActive;
    await author.save();

    res.json({
      success: true,
      message: `Author ${author.isActive ? 'activated' : 'deactivated'} successfully`,
      data: author
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating author status',
      error: error.message
    });
  }
};