import { Request, Response } from 'express';
import { StaticPage } from '../models/StaticPage';
import { slugify } from '../utils/slugify';
import { asyncHandler } from '../middleware/errorHandler';

// Get all static pages (public)
export const getStaticPages = asyncHandler(async (req: Request, res: Response) => {
  const { published, showInMenu } = req.query;
  
  const query: any = {};
  
  // Filter by published status
  if (published !== undefined) {
    query.isPublished = published === 'true';
  }
  
  // Filter by menu visibility
  if (showInMenu !== undefined) {
    query.showInMenu = showInMenu === 'true';
  }
  
  const pages = await StaticPage.find(query)
    .sort({ menuOrder: 1, title: 1 });

  res.json({
    success: true,
    data: pages
  });
});

// Get all static pages for admin
export const getStaticPagesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    search,
    published,
    showInMenu,
    template
  } = req.query;

  const query: any = {};

  // Build filter query
  if (published !== undefined) query.isPublished = published === 'true';
  if (showInMenu !== undefined) query.showInMenu = showInMenu === 'true';
  if (template) query.template = template;

  // Text search
  if (search) {
    query.$text = { $search: search as string };
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Get pages with pagination
  const [pages, total] = await Promise.all([
    StaticPage.find(query)
      .sort({ menuOrder: 1, updatedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    StaticPage.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: pages,
    pagination: {
      current: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      limit: limitNum
    }
  });
});

// Get single static page by slug
export const getStaticPageBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  
  const page = await StaticPage.findOne({ 
    slug, 
    isPublished: true 
  });

  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Page not found'
    });
  }

  res.json({
    success: true,
    data: page
  });
});

// Get single static page by ID (admin)
export const getStaticPageById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const page = await StaticPage.findById(id);

  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Page not found'
    });
  }

  res.json({
    success: true,
    data: page
  });
});

// Create static page (admin only)
export const createStaticPage = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    slug,
    content,
    metaTitle,
    metaDescription,
    keywords,
    isPublished,
    showInMenu,
    menuOrder,
    template
  } = req.body;

  // Auto-generate slug from title if not provided
  let pageSlug = slug || slugify(title);
  
  // Ensure slug is unique
  let counter = 1;
  while (await StaticPage.findOne({ slug: pageSlug })) {
    pageSlug = `${slug || slugify(title)}-${counter}`;
    counter++;
  }

  const pageData = {
    title,
    slug: pageSlug,
    content,
    metaTitle,
    metaDescription,
    keywords: keywords || [],
    isPublished: isPublished !== undefined ? isPublished : true,
    showInMenu: showInMenu !== undefined ? showInMenu : false,
    menuOrder: menuOrder || 0,
    template: template || 'default'
  };

  const page = await StaticPage.create(pageData);

  res.status(201).json({
    success: true,
    message: 'Static page created successfully',
    data: page
  });
});

// Update static page (admin only)
export const updateStaticPage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // If title is being updated and no slug provided, regenerate slug
  if (updateData.title && !updateData.slug) {
    let newSlug = slugify(updateData.title);
    let counter = 1;
    
    // Make slug unique by checking against other pages (excluding current one)
    while (await StaticPage.findOne({ slug: newSlug, _id: { $ne: id } })) {
      newSlug = `${slugify(updateData.title)}-${counter}`;
      counter++;
    }
    
    updateData.slug = newSlug;
  }

  const page = await StaticPage.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Static page not found'
    });
  }

  res.json({
    success: true,
    message: 'Static page updated successfully',
    data: page
  });
});

// Delete static page (admin only)
export const deleteStaticPage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const page = await StaticPage.findByIdAndDelete(id);

  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Static page not found'
    });
  }

  res.json({
    success: true,
    message: 'Static page deleted successfully'
  });
});

// Toggle page published status (admin only)
export const togglePageStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const page = await StaticPage.findById(id);

  if (!page) {
    return res.status(404).json({
      success: false,
      message: 'Static page not found'
    });
  }

  page.isPublished = !page.isPublished;
  await page.save();

  res.json({
    success: true,
    message: `Page ${page.isPublished ? 'published' : 'unpublished'} successfully`,
    data: page
  });
});

// Get menu pages (for navigation)
export const getMenuPages = asyncHandler(async (req: Request, res: Response) => {
  const pages = await StaticPage.find({
    isPublished: true,
    showInMenu: true
  }).sort({ menuOrder: 1, title: 1 });

  res.json({
    success: true,
    data: pages
  });
});

// Reorder menu pages (admin only)
export const reorderMenuPages = asyncHandler(async (req: Request, res: Response) => {
  const { pageOrders } = req.body; // Array of { id, menuOrder }

  if (!Array.isArray(pageOrders)) {
    return res.status(400).json({
      success: false,
      message: 'Page orders must be an array'
    });
  }

  // Update menu orders
  const updatePromises = pageOrders.map(({ id, menuOrder }) =>
    StaticPage.findByIdAndUpdate(id, { menuOrder })
  );

  await Promise.all(updatePromises);

  res.json({
    success: true,
    message: 'Menu pages reordered successfully'
  });
});

// Get Editorial Team page with authors
export const getEditorialTeamPage = asyncHandler(async (req: Request, res: Response) => {
  const Author = (await import('../models/Author')).default;
  
  // Get the Editorial Team static page
  const page = await StaticPage.findOne({ 
    slug: 'editorial-team',
    isPublished: true 
  });

  // Get all active authors
  const authors = await Author.find({ isActive: true })
    .sort({ name: 1 } as any)
    .select('name slug email title role biography professionalBackground expertise specialization location phone website socialMedia profileImage articlesCount joinDate');

  res.json({
    success: true,
    data: {
      page: page || {
        title: 'Editorial Team',
        slug: 'editorial-team',
        content: 'Meet our dedicated team of journalists and editors.',
        metaTitle: 'Editorial Team - Dominica News',
        metaDescription: 'Meet the dedicated journalists and editors who bring you the latest news from Dominica and the Caribbean.'
      },
      authors
    }
  });
});