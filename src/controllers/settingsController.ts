import { Request, Response } from 'express';
import Settings from '../models/Settings';
import { asyncHandler } from '../middleware/errorHandler';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/logos');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

// Individual settings management for frontend compatibility
export const getIndividualSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key } = req.params;
  
  const settings = await Settings.findOne();
  let value = '';
  
  if (settings) {
    switch (key) {
      case 'site_name':
        value = settings.siteName;
        break;
      case 'site_description':
        value = settings.siteDescription;
        break;
      case 'maintenance_mode':
        value = settings.maintenanceMode.toString();
        break;
      case 'logo':
        value = settings.logo || '';
        break;
      case 'copyright_text':
        value = settings.copyrightText || '';
        break;
      case 'maintenance_message':
        value = (settings as any).maintenanceMessage || '';
        break;
      case 'social_facebook':
        value = settings.socialMedia?.facebook || '';
        break;
      case 'social_twitter':
        value = settings.socialMedia?.twitter || '';
        break;
      case 'social_instagram':
        value = settings.socialMedia?.instagram || '';
        break;
      case 'social_youtube':
        value = settings.socialMedia?.youtube || '';
        break;
      case 'social_linkedin':
        value = settings.socialMedia?.linkedin || '';
        break;
      case 'social_tiktok':
        value = settings.socialMedia?.tiktok || '';
        break;
      case 'contact_email':
        value = settings.contactInfo?.email || '';
        break;
      case 'contact_phone':
        value = settings.contactInfo?.phone || '';
        break;
      case 'contact_address':
        value = settings.contactInfo?.address || '';
        break;
      case 'contact_workingHours':
        value = settings.contactInfo?.workingHours || '';
        break;
      case 'seo_meta_title':
        value = settings.seoSettings?.metaTitle || '';
        break;
      case 'seo_meta_description':
        value = settings.seoSettings?.metaDescription || '';
        break;
      case 'seo_keywords':
        value = settings.seoSettings?.keywords?.join(', ') || '';
        break;
      case 'seo_og_image':
        value = settings.seoSettings?.ogImage || '';
        break;
      case 'seo_canonical_url':
        value = settings.seoSettings?.canonicalUrl || '';
        break;
      default:
        return res.status(404).json({
          success: false,
          message: 'Setting not found'
        });
    }
  }

  res.json({
    success: true,
    data: {
      _id: settings?._id || 'default',
      key,
      value,
      updatedAt: settings?.updatedAt || new Date().toISOString()
    }
  });
});

export const getAllIndividualSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await Settings.findOne();
  
  const settingsArray = [];
  
  if (settings) {
    const settingsMap = [
      { key: 'site_name', value: settings.siteName, description: 'Website name' },
      { key: 'site_description', value: settings.siteDescription, description: 'Website description' },
      { key: 'maintenance_mode', value: settings.maintenanceMode.toString(), description: 'Maintenance mode status' },
      { key: 'logo', value: settings.logo || '', description: 'Website logo URL' },
      { key: 'copyright_text', value: settings.copyrightText || '', description: 'Copyright text' },
      { key: 'maintenance_message', value: (settings as any).maintenanceMessage || '', description: 'Maintenance mode message' },
      { key: 'social_facebook', value: settings.socialMedia?.facebook || '', description: 'Facebook URL' },
      { key: 'social_twitter', value: settings.socialMedia?.twitter || '', description: 'Twitter URL' },
      { key: 'social_instagram', value: settings.socialMedia?.instagram || '', description: 'Instagram URL' },
      { key: 'social_youtube', value: settings.socialMedia?.youtube || '', description: 'YouTube URL' },
      { key: 'social_linkedin', value: settings.socialMedia?.linkedin || '', description: 'LinkedIn URL' },
      { key: 'social_tiktok', value: settings.socialMedia?.tiktok || '', description: 'TikTok URL' },
      { key: 'contact_email', value: settings.contactInfo?.email || '', description: 'Contact email' },
      { key: 'contact_phone', value: settings.contactInfo?.phone || '', description: 'Contact phone' },
      { key: 'contact_address', value: settings.contactInfo?.address || '', description: 'Contact address' },
      { key: 'contact_workingHours', value: settings.contactInfo?.workingHours || '', description: 'Working hours' },
      { key: 'seo_meta_title', value: settings.seoSettings?.metaTitle || '', description: 'Default meta title' },
      { key: 'seo_meta_description', value: settings.seoSettings?.metaDescription || '', description: 'Default meta description' },
      { key: 'seo_keywords', value: settings.seoSettings?.keywords?.join(', ') || '', description: 'Default keywords' },
      { key: 'seo_og_image', value: settings.seoSettings?.ogImage || '', description: 'Default Open Graph image' },
      { key: 'seo_canonical_url', value: settings.seoSettings?.canonicalUrl || '', description: 'Default canonical URL' },
    ];

    settingsArray.push(...settingsMap.map(setting => ({
      _id: `${settings._id}_${setting.key}`,
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updatedAt: settings.updatedAt.toISOString()
    })));
  }

  res.json({
    success: true,
    data: {
      settings: settingsArray
    }
  });
});

export const updateIndividualSetting = asyncHandler(async (req: Request, res: Response) => {
  const { key, value, description } = req.body;
  
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({
      siteName: 'Dominica News',
      siteDescription: 'Your trusted source for news and information about Dominica'
    });
  }

  // Update the specific setting
  switch (key) {
    case 'site_name':
      settings.siteName = value;
      break;
    case 'site_description':
      settings.siteDescription = value;
      break;
    case 'maintenance_mode':
      settings.maintenanceMode = value === 'true';
      break;
    case 'logo':
      settings.logo = value;
      break;
    case 'copyright_text':
      settings.copyrightText = value;
      break;
    case 'maintenance_message':
      (settings as any).maintenanceMessage = value;
      break;
    case 'social_facebook':
      if (!settings.socialMedia) settings.socialMedia = {};
      settings.socialMedia.facebook = value;
      break;
    case 'social_twitter':
      if (!settings.socialMedia) settings.socialMedia = {};
      settings.socialMedia.twitter = value;
      break;
    case 'social_instagram':
      if (!settings.socialMedia) settings.socialMedia = {};
      settings.socialMedia.instagram = value;
      break;
    case 'social_youtube':
      if (!settings.socialMedia) settings.socialMedia = {};
      settings.socialMedia.youtube = value;
      break;
    case 'social_linkedin':
      if (!settings.socialMedia) settings.socialMedia = {};
      settings.socialMedia.linkedin = value;
      break;
    case 'social_tiktok':
      if (!settings.socialMedia) settings.socialMedia = {};
      settings.socialMedia.tiktok = value;
      break;
    case 'contact_email':
      if (!settings.contactInfo) settings.contactInfo = {};
      settings.contactInfo.email = value;
      break;
    case 'contact_phone':
      if (!settings.contactInfo) settings.contactInfo = {};
      settings.contactInfo.phone = value;
      break;
    case 'contact_address':
      if (!settings.contactInfo) settings.contactInfo = {};
      settings.contactInfo.address = value;
      break;
    case 'contact_workingHours':
      if (!settings.contactInfo) settings.contactInfo = {};
      settings.contactInfo.workingHours = value;
      break;
    case 'seo_meta_title':
      if (!settings.seoSettings) settings.seoSettings = {};
      settings.seoSettings.metaTitle = value;
      break;
    case 'seo_meta_description':
      if (!settings.seoSettings) settings.seoSettings = {};
      settings.seoSettings.metaDescription = value;
      break;
    case 'seo_keywords':
      if (!settings.seoSettings) settings.seoSettings = {};
      settings.seoSettings.keywords = value ? value.split(',').map((k: string) => k.trim()) : [];
      break;
    case 'seo_og_image':
      if (!settings.seoSettings) settings.seoSettings = {};
      settings.seoSettings.ogImage = value;
      break;
    case 'seo_canonical_url':
      if (!settings.seoSettings) settings.seoSettings = {};
      (settings.seoSettings as any).canonicalUrl = value;
      break;
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid setting key'
      });
  }

  await settings.save();

  res.json({
    success: true,
    message: 'Setting updated successfully',
    data: {
      _id: `${settings._id}_${key}`,
      key,
      value,
      description,
      updatedAt: settings.updatedAt.toISOString()
    }
  });
});

// Logo upload endpoint
export const uploadLogoFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No logo file uploaded'
    });
  }

  const logoUrl = `/uploads/logos/${req.file.filename}`;
  
  // Update settings with new logo URL
  let settings = await Settings.findOne();
  
  if (!settings) {
    settings = await Settings.create({
      siteName: 'Dominica News',
      siteDescription: 'Your trusted source for news and information about Dominica',
      logo: logoUrl
    });
  } else {
    // Remove old logo file if it exists
    if (settings.logo && settings.logo.startsWith('/uploads/logos/')) {
      const oldLogoPath = path.join(__dirname, '../../uploads/logos', path.basename(settings.logo));
      try {
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.log('Could not delete old logo file:', error);
      }
    }
    
    settings.logo = logoUrl;
    await settings.save();
  }

  res.json({
    success: true,
    message: 'Logo uploaded successfully',
    data: {
      logoUrl,
      filename: req.file.filename,
      size: req.file.size
    }
  });
});

// Delete logo
export const deleteLogo = asyncHandler(async (req: Request, res: Response) => {
  const settings = await Settings.findOne();
  
  if (!settings || !settings.logo) {
    return res.status(404).json({
      success: false,
      message: 'No logo found'
    });
  }

  // Delete logo file
  if (settings.logo.startsWith('/uploads/logos/')) {
    const logoPath = path.join(__dirname, '../../uploads/logos', path.basename(settings.logo));
    try {
      await fs.unlink(logoPath);
    } catch (error) {
      console.log('Could not delete logo file:', error);
    }
  }

  // Remove logo from settings
  settings.logo = undefined;
  await settings.save();

  res.json({
    success: true,
    message: 'Logo deleted successfully'
  });
});

// Contact form submission
export const submitContactForm = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, subject, message } = req.body;

  // Basic validation
  if (!firstName || !lastName || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  // Email validation
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  // For now, just log the contact form submission
  // In a real implementation, you would send an email or save to database
  console.log('Contact form submission:', {
    name: `${firstName} ${lastName}`,
    email,
    subject,
    message,
    timestamp: new Date().toISOString()
  });

  // You could integrate with email services like SendGrid, Mailgun, etc.
  // or save to a database for admin review

  res.json({
    success: true,
    message: 'Thank you for your message! We will get back to you soon.'
  });
});