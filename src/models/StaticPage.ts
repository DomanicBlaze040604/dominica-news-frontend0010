import mongoose, { Document, Schema } from 'mongoose';

export interface IStaticPage extends Document {
  title: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  isPublished: boolean;
  showInMenu: boolean;
  menuOrder: number;
  template?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaticPageSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true,
    minlength: [2, 'Title must be at least 2 characters long'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Page slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ]
  },
  content: {
    type: String,
    required: [true, 'Page content is required'],
    trim: true
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  showInMenu: {
    type: Boolean,
    default: false
  },
  menuOrder: {
    type: Number,
    default: 0,
    min: [0, 'Menu order cannot be negative']
  },
  template: {
    type: String,
    enum: ['default', 'about', 'contact', 'privacy', 'terms', 'editorial'],
    default: 'default'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      (ret as any).id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Indexes for performance
StaticPageSchema.index({ slug: 1 });
StaticPageSchema.index({ isPublished: 1, showInMenu: 1, menuOrder: 1 });
StaticPageSchema.index({ title: 'text', content: 'text' });

export const StaticPage = mongoose.model<IStaticPage>('StaticPage', StaticPageSchema);