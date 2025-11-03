import { Request, Response } from 'express';
import Settings from '../models/Settings';
import { asyncHandler } from '../middleware/errorHandler';

// Get site settings (public endpoint)
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await Settings.findOne();
  
  // Create default settings if none exist
  if (!settings) {
    settings = await Settings.create({
      siteName: 'Dominica News',
      siteDescription: 'Your trusted source for news and information about Dominica',
      socialMedia: {
        facebook: 'https://www.facebook.com/dominicanews',
        twitter: 'https://www.twitter.com/dominicanews',
        instagram: 'https://www.instagram.com/dominicanews'
      },
      contactInfo: {
        email: 'info@dominicanews.com',
        phone: '+1-767-XXX-XXXX',
        address: 'Roseau, Commonwealth of Dominica'
      },
      seoSettings: {
        metaTitle: 'Dominica News - Latest News from the Nature Island',
        metaDescription: 'Stay updated with the latest news, politics, tourism, sports, and culture from Dominica and the Caribbean region.',
        keywords: ['dominica', 'news', 'caribbean', 'politics', 'tourism', 'sports']
      }
    });
  }

  res.json({
    success: true,
    data: settings
  });
});

// Update site settings (admin only)
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const updateData = req.body;

  let settings = await Settings.findOne();
  
  if (!settings) {
    // Create new settings if none exist
    settings = await Settings.create(updateData);
  } else {
    // Update existing settings
    Object.assign(settings, updateData);
    await settings.save();
  }

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: settings
  });
});

// Get social media links only (public endpoint)
export const getSocialMedia = asyncHandler(async (req: Request, res: Response) => {
  const settings = await Settings.findOne().select('socialMedia');
  
  const socialMedia = settings?.socialMedia || {
    facebook: 'https://www.facebook.com/dominicanews',
    twitter: 'https://www.twitter.com/dominicanews',
    instagram: 'https://www.instagram.com/dominicanews'
  };

  res.json({
    success: true,
    data: socialMedia
  });
});

// Update social media links only (admin only)
export const updateSocialMedia = asyncHandler(async (req: Request, res: Response) => {
  const { socialMedia } = req.body;

  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({ socialMedia });
  } else {
    settings.socialMedia = { ...settings.socialMedia, ...socialMedia };
    await settings.save();
  }

  res.json({
    success: true,
    message: 'Social media links updated successfully',
    data: settings.socialMedia
  });
});

// Get contact information (public endpoint)
export const getContactInfo = asyncHandler(async (req: Request, res: Response) => {
  const settings = await Settings.findOne().select('contactInfo');
  
  const contactInfo = settings?.contactInfo || {
    email: 'info@dominicanews.com',
    phone: '+1-767-XXX-XXXX',
    address: 'Roseau, Commonwealth of Dominica'
  };

  res.json({
    success: true,
    data: contactInfo
  });
});

// Update contact information (admin only)
export const updateContactInfo = asyncHandler(async (req: Request, res: Response) => {
  const { contactInfo } = req.body;

  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({ contactInfo });
  } else {
    settings.contactInfo = { ...settings.contactInfo, ...contactInfo };
    await settings.save();
  }

  res.json({
    success: true,
    message: 'Contact information updated successfully',
    data: settings.contactInfo
  });
});

// Get SEO settings (admin only)
export const getSEOSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await Settings.findOne().select('seoSettings');
  
  res.json({
    success: true,
    data: settings?.seoSettings || {}
  });
});

// Update SEO settings (admin only)
export const updateSEOSettings = asyncHandler(async (req: Request, res: Response) => {
  const { seoSettings } = req.body;

  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({ seoSettings });
  } else {
    settings.seoSettings = { ...settings.seoSettings, ...seoSettings };
    await settings.save();
  }

  res.json({
    success: true,
    message: 'SEO settings updated successfully',
    data: settings.seoSettings
  });
});

// Toggle maintenance mode (admin only)
export const toggleMaintenanceMode = asyncHandler(async (req: Request, res: Response) => {
  const { maintenanceMode } = req.body;

  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({ maintenanceMode });
  } else {
    settings.maintenanceMode = maintenanceMode;
    await settings.save();
  }

  res.json({
    success: true,
    message: `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'}`,
    data: { maintenanceMode: settings.maintenanceMode }
  });
});