import mongoose, { Document, Schema } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  categoryId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
      maxlength: [500, 'Article title cannot exceed 500 characters'],
      minlength: [5, 'Article title must be at least 5 characters long'],
    },
    slug: {
      type: String,
      required: [true, 'Article slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must contain only lowercase letters, numbers, and hyphens',
      ],
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Article excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Article content is required'],
      trim: true,
      minlength: [50, 'Article content must be at least 50 characters long'],
    },
    featuredImage: {
      type: String,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Article category is required'],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Article author is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance (slug index is automatically created by unique: true)
articleSchema.index({ categoryId: 1 });
articleSchema.index({ authorId: 1 });
articleSchema.index({ status: 1 });
articleSchema.index({ publishedAt: -1 });
articleSchema.index({ createdAt: -1 });

// Compound indexes for common queries
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ categoryId: 1, status: 1, publishedAt: -1 });

// Pre-save middleware to set publishedAt when status changes to published
articleSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  if (this.status === 'draft') {
    this.publishedAt = undefined;
  }
  
  next();
});

export const Article = mongoose.model<IArticle>('Article', articleSchema);