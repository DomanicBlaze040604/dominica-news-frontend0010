import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthor extends Document {
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  specialization?: string[];
  isActive: boolean;
  joinDate: Date;
  articlesCount: number;
  location?: string;
  phone?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuthorSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  socialMedia: {
    twitter: String,
    facebook: String,
    instagram: String,
    linkedin: String
  },
  specialization: [{
    type: String,
    enum: ['Politics', 'Sports', 'Business', 'Technology', 'Health', 'Entertainment', 'Culture', 'Environment', 'Education', 'Tourism']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  articlesCount: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  website: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function (doc, ret) {
      (ret as any).id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Index for search
AuthorSchema.index({ name: 'text', bio: 'text' });
AuthorSchema.index({ email: 1 });
AuthorSchema.index({ isActive: 1 });

// Virtual for full profile URL
AuthorSchema.virtual('profileUrl').get(function() {
  return `/authors/${this._id}`;
});

export default mongoose.model<IAuthor>('Author', AuthorSchema);