import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'editor' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  refreshTokens: string[];
  passwordChangedAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  addRefreshToken(token: string): Promise<void>;
  removeRefreshToken(token: string): Promise<void>;
  clearRefreshTokens(): Promise<void>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'user'],
      default: 'admin',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshTokens: [{
      type: String,
    }],
    passwordChangedAt: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
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
        delete (ret as any).passwordHash;
        delete (ret as any).refreshTokens;
        delete (ret as any).loginAttempts;
        delete (ret as any).lockUntil;
        return ret;
      },
    },
  }
);

// Index is automatically created by unique: true

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// Account locking is handled by the isLocked method below

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    this.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Add refresh token
userSchema.methods.addRefreshToken = async function (token: string): Promise<void> {
  // Limit to 5 refresh tokens per user
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift(); // Remove oldest token
  }
  this.refreshTokens.push(token);
  await this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = async function (token: string): Promise<void> {
  this.refreshTokens = this.refreshTokens.filter((t: string) => t !== token);
  await this.save();
};

// Clear all refresh tokens
userSchema.methods.clearRefreshTokens = async function (): Promise<void> {
  this.refreshTokens = [];
  await this.save();
};

// Check if account is locked
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

export const User = mongoose.model<IUser>('User', userSchema);