import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  color?: string;
  icon?: string;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
      minlength: [2, 'Category name must be at least 2 characters long'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must contain only lowercase letters, numbers, and hyphens',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Category description cannot exceed 500 characters'],
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: [0, 'Display order cannot be negative'],
    },
    color: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code'],
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Icon name cannot exceed 50 characters'],
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

// Virtual for article count
categorySchema.virtual('articleCount', {
  ref: 'Article',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Index is automatically created by unique: true for name and slug

export const Category = mongoose.model<ICategory>('Category', categorySchema);