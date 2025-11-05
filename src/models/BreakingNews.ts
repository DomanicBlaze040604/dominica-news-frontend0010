import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBreakingNews extends Document {
  text: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBreakingNewsModel extends Model<IBreakingNews> {
  getActive(): Promise<IBreakingNews | null>;
  setActive(id: string): Promise<IBreakingNews | null>;
  deactivateAll(): Promise<any>;
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
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Pre-save middleware to ensure only one active breaking news at a time
BreakingNewsSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    // Deactivate all other breaking news items
    await BreakingNews.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false }
    );
  }
  next();
});

// Static methods
BreakingNewsSchema.statics.getActive = function() {
  return this.findOne({ isActive: true })
    .populate('createdBy', 'fullName email')
    .sort({ createdAt: -1 });
};

BreakingNewsSchema.statics.setActive = async function(id: string) {
  // First deactivate all breaking news
  await this.updateMany({}, { isActive: false });
  
  // Then activate the specified one
  const breakingNews = await this.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  ).populate('createdBy', 'fullName email');
  
  return breakingNews;
};

BreakingNewsSchema.statics.deactivateAll = function() {
  return this.updateMany({}, { isActive: false });
};

export const BreakingNews = mongoose.model<IBreakingNews, IBreakingNewsModel>('BreakingNews', BreakingNewsSchema);