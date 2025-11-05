import mongoose, { Document, Schema } from 'mongoose';

export interface ISocialMedia {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
}

export interface IContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  workingHours?: string;
}

export interface ISEOSettings {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

export interface ISettings extends Document {
  siteName: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  socialMedia: ISocialMedia;
  contactInfo: IContactInfo;
  seoSettings: ISEOSettings;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  allowRegistration: boolean;
  commentsEnabled: boolean;
  newsletterEnabled: boolean;
  analyticsCode?: string;
  customCSS?: string;
  customJS?: string;
  footerText?: string;
  copyrightText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  siteName: {
    type: String,
    required: [true, 'Site name is required'],
    default: 'Dominica News',
    maxlength: [100, 'Site name cannot exceed 100 characters']
  },
  siteDescription: {
    type: String,
    default: 'Your trusted source for news and information about Dominica',
    maxlength: [500, 'Site description cannot exceed 500 characters']
  },
  logo: {
    type: String,
    default: null
  },
  favicon: {
    type: String,
    default: null
  },
  socialMedia: {
    facebook: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?facebook\.com\//.test(v);
        },
        message: 'Please provide a valid Facebook URL'
      }
    },
    twitter: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//.test(v);
        },
        message: 'Please provide a valid Twitter/X URL'
      }
    },
    instagram: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?instagram\.com\//.test(v);
        },
        message: 'Please provide a valid Instagram URL'
      }
    },
    youtube: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?youtube\.com\//.test(v);
        },
        message: 'Please provide a valid YouTube URL'
      }
    },
    linkedin: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?linkedin\.com\//.test(v);
        },
        message: 'Please provide a valid LinkedIn URL'
      }
    },
    tiktok: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/(www\.)?tiktok\.com\//.test(v);
        },
        message: 'Please provide a valid TikTok URL'
      }
    }
  },
  contactInfo: {
    email: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    phone: {
      type: String,
      maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    address: {
      type: String,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    workingHours: {
      type: String,
      maxlength: [100, 'Working hours cannot exceed 100 characters']
    }
  },
  seoSettings: {
    metaTitle: {
      type: String,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    ogImage: {
      type: String
    },
    canonicalUrl: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Please provide a valid canonical URL'
      }
    }
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    maxlength: [500, 'Maintenance message cannot exceed 500 characters']
  },
  allowRegistration: {
    type: Boolean,
    default: false
  },
  commentsEnabled: {
    type: Boolean,
    default: true
  },
  newsletterEnabled: {
    type: Boolean,
    default: true
  },
  analyticsCode: {
    type: String,
    maxlength: [1000, 'Analytics code cannot exceed 1000 characters']
  },
  customCSS: {
    type: String,
    maxlength: [10000, 'Custom CSS cannot exceed 10000 characters']
  },
  customJS: {
    type: String,
    maxlength: [10000, 'Custom JS cannot exceed 10000 characters']
  },
  footerText: {
    type: String,
    maxlength: [500, 'Footer text cannot exceed 500 characters']
  },
  copyrightText: {
    type: String,
    default: '© 2024 Dominica News. All rights reserved.',
    maxlength: [200, 'Copyright text cannot exceed 200 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Ensure only one settings document exists
SettingsSchema.index({}, { unique: true });

export default mongoose.model<ISettings>('Settings', SettingsSchema);