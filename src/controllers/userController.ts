import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/User';
import { CustomError, asyncHandler } from '../middleware/errorHandler';

// Get all users (Admin only)
export const getUsers = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const users = await User.find({})
    .select('-passwordHash -refreshTokens')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      users,
      total: users.length,
    },
  });
});

// Get user by ID (Admin only)
export const getUserById = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  const user = await User.findById(id).select('-passwordHash -refreshTokens');
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

// Create new user (Admin only)
export const createUser = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { email, password, fullName, role = 'user' } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError('User already exists with this email', 409);
  }

  // Validate role
  const validRoles = ['admin', 'editor', 'user'];
  if (!validRoles.includes(role)) {
    throw new CustomError('Invalid role specified', 400);
  }

  // Create new user
  const user = new User({
    email,
    passwordHash: password, // Will be hashed by pre-save middleware
    fullName,
    role,
    isActive: true,
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: `User created successfully with role: ${role}`,
    data: { user: user.toJSON() },
  });
});

// Update user (Admin only)
export const updateUser = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation failed', 400);
  }

  const { id } = req.params;
  const { fullName, role, isActive } = req.body;

  // Find user
  const user = await User.findById(id);
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Prevent users from modifying their own role or status
  if (req.user?.id === id) {
    if (role && role !== user.role) {
      throw new CustomError('You cannot change your own role', 403);
    }
    if (isActive !== undefined && isActive !== user.isActive) {
      throw new CustomError('You cannot change your own account status', 403);
    }
  }

  // Validate role if provided
  if (role) {
    const validRoles = ['admin', 'editor', 'user'];
    if (!validRoles.includes(role)) {
      throw new CustomError('Invalid role specified', 400);
    }
  }

  // Update user fields
  if (fullName !== undefined) user.fullName = fullName;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  // If user is being deactivated, clear their refresh tokens
  if (isActive === false) {
    await user.clearRefreshTokens();
  }

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user: user.toJSON() },
  });
});

// Delete user (Admin only)
export const deleteUser = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // Prevent users from deleting themselves
  if (req.user?.id === id) {
    throw new CustomError('You cannot delete your own account', 403);
  }

  // Find and delete user
  const user = await User.findById(id);
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

// Toggle user status (Admin only)
export const toggleUserStatus = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { id } = req.params;

  // Prevent users from toggling their own status
  if (req.user?.id === id) {
    throw new CustomError('You cannot change your own account status', 403);
  }

  // Find user
  const user = await User.findById(id);
  if (!user) {
    throw new CustomError('User not found', 404);
  }

  // Toggle status
  user.isActive = !user.isActive;
  await user.save();

  // If user is being deactivated, clear their refresh tokens
  if (!user.isActive) {
    await user.clearRefreshTokens();
  }

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { user: user.toJSON() },
  });
});

// Get user statistics (Admin only)
export const getUserStats = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const adminUsers = await User.countDocuments({ role: 'admin' });
  const editorUsers = await User.countDocuments({ role: 'editor' });
  const regularUsers = await User.countDocuments({ role: 'user' });

  // Get recent users (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  res.status(200).json({
    success: true,
    data: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      roles: {
        admin: adminUsers,
        editor: editorUsers,
        user: regularUsers,
      },
      recentSignups: recentUsers,
    },
  });
});