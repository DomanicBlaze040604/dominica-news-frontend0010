import mongoose, { Document, Schema } from 'mongoose';

export interface IBreakingNews extends Document {
  text: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BreakingNewsSchema: Schema = new Schema({
  text: {
    type: String,
    required: [true, 'Breaking news text is required'],
    trim: true,
    minlength: [5, 'Breaking news text must be at least 5 characters long'],
    maxlength: [200, 'Breaking news text cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
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

// Index for performance
BreakingNewsSchema.index({ isActive: 1, createdAt: -1 });

export const BreakingNews = mongoose.model<IBreakingNews>('BreakingNews', BreakingNewsSchema);