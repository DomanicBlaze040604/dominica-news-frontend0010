import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/User';
import { generateToken } from '../utils/jwt';
import { CustomError, asyncHandler } from '../middleware/errorHandler';

// 🧩 Register a new user
export const register = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password, fullName } = req.body;

  // ✅ Validate required fields
  if (!email || !password || !fullName) {
    throw new CustomError('All fields (email, password, fullName) are required', 400);
  }

  // ✅ Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError('User already exists with this email', 409);
  }

  // ✅ Determine role
  const isAdmin = email === process.env.ADMIN_EMAIL?.trim();

  // ✅ Create new user
  const user = new User({
    email,
    passwordHash: password, // handled by pre-save middleware
    fullName,
    role: isAdmin ? 'admin' : 'user',
  });

  await user.save();

  // ✅ Generate JWT token
  const token = generateToken({
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    success: true,
    message: `User registered successfully as ${user.role}`,
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

// 🧩 Login existing user
export const login = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { email, password } = req.body;

  // ✅ Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError('Invalid credentials', 401);
  }

  // ✅ Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new CustomError('Invalid credentials', 401);
  }

  // ✅ Upgrade admin if email matches
  if (email === process.env.ADMIN_EMAIL?.trim() && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }

  // ✅ Generate JWT
  const token = generateToken({
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

// 🧩 Get current user
export const getMe = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) throw new CustomError('User not authenticated', 401);

  const user = await User.findById(req.user.id);
  if (!user) throw new CustomError('User not found', 404);

  res.status(200).json({
    success: true,
    data: { user: user.toJSON() },
  });
});

// 🧩 Logout
export const logout = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});
