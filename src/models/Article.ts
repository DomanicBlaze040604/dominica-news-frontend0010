import mongoose, { Document, Schema } from 'mongoose';
import { toDominicanTime } from '../utils/timezone';

export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string; // Rich text content (HTML)
  excerpt: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  gallery?: string[];
  author: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  scheduledFor?: Date;
  views: number;
  likes: number;
  shares: number;
  comments: mongoose.Types.ObjectId[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  isBreaking: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  readingTime: number; // in minutes
  location?: string; // Dominican location where story happened
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Article title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  content: {
    type: String,
    required: [true, 'Article content is required'],
    trim: true
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  featuredImage: {
    type: String,
    default: null
  },
  featuredImageAlt: {
    type: String,
    default: null,
    trim: true,
    maxlength: [200, 'Featured image alt text cannot exceed 200 characters']
  },
  gallery: [{
    type: String
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Author',
    required: [true, 'Author is required']
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  seo: {
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
    canonicalUrl: String
  },
  isBreaking: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  readingTime: {
    type: Number,
    default: 1
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  language: {
    type: String,
    enum: ['en', 'es'],
    default: 'en'
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance (slug index is created automatically by unique: true)
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ author: 1 });
ArticleSchema.index({ category: 1 });
ArticleSchema.index({ tags: 1 });
ArticleSchema.index({ isBreaking: 1 });
ArticleSchema.index({ isFeatured: 1 });
ArticleSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

// Virtual for URL
ArticleSchema.virtual('url').get(function() {
  return `/articles/${this.slug}`;
});

// Pre-save middleware to set Dominican timezone for publishedAt
ArticleSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = toDominicanTime(new Date());
  }
  
  // Calculate reading time (average 200 words per minute)
  if (this.content && typeof this.content === 'string') {
    const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  next();
});

export default mongoose.model<IArticle>('Article', ArticleSchema);