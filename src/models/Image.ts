import mongoose, { Document, Schema } from 'mongoose';

export interface IImage extends Document {
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const imageSchema = new Schema<IImage>(
  {
    filename: {
      type: String,
      required: [true, 'Image filename is required'],
      unique: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original filename is required'],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be greater than 0'],
      max: [5 * 1024 * 1024, 'File size cannot exceed 5MB'], // 5MB limit
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      enum: {
        values: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        message: 'Only JPEG, PNG, and WebP images are allowed',
      },
    },
    width: {
      type: Number,
      min: [1, 'Width must be greater than 0'],
    },
    height: {
      type: Number,
      min: [1, 'Height must be greater than 0'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader information is required'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only track creation time
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

// Indexes for better query performance (filename index is automatically created by unique: true)
imageSchema.index({ uploadedBy: 1 });
imageSchema.index({ createdAt: -1 });
imageSchema.index({ mimeType: 1 });

// Compound indexes for common queries
imageSchema.index({ uploadedBy: 1, createdAt: -1 });

export const Image = mongoose.model<IImage>('Image', imageSchema);