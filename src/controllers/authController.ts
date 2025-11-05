import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models/User';
import { generateTokenPair, verifyRefreshToken, JWTPayload } from '../utils/jwt';
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
    isActive: true,
  });

  await user.save();

  // ✅ Generate JWT token pair
  const tokenPayload: JWTPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
  };

  const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

  // ✅ Store refresh token
  await user.addRefreshToken(refreshToken);

  // ✅ Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    success: true,
    message: `User registered successfully as ${user.role}`,
    data: {
      user: user.toJSON(),
      token: accessToken,
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

  // ✅ Check if account is locked
  if (user.isLocked()) {
    throw new CustomError('Account temporarily locked due to too many failed login attempts', 423);
  }

  // ✅ Check if user is active
  if (!user.isActive) {
    throw new CustomError('Account is deactivated', 401);
  }

  // ✅ Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    throw new CustomError('Invalid credentials', 401);
  }

  // ✅ Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // ✅ Upgrade admin if email matches
  if (email === process.env.ADMIN_EMAIL?.trim() && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }

  // ✅ Update last login
  user.lastLogin = new Date();
  await user.save();

  // ✅ Generate JWT token pair
  const tokenPayload: JWTPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role,
  };

  const { accessToken, refreshToken } = generateTokenPair(tokenPayload);

  // ✅ Store refresh token
  await user.addRefreshToken(refreshToken);

  // ✅ Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token: accessToken,
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

// 🧩 Change password
export const changePassword = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) throw new CustomError('User not authenticated', 401);

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new CustomError('Current password and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new CustomError('New password must be at least 8 characters long', 400);
  }

  // ✅ Find user
  const user = await User.findById(req.user.id);
  if (!user) throw new CustomError('User not found', 404);

  // ✅ Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new CustomError('Current password is incorrect', 400);
  }

  // ✅ Update password
  user.passwordHash = newPassword; // Will be hashed by pre-save middleware
  await user.save();

  // ✅ Clear all refresh tokens to force re-login on all devices
  await user.clearRefreshTokens();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
  });
});

// 🧩 Update profile
export const updateProfile = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) throw new CustomError('User not authenticated', 401);

  const { fullName } = req.body;

  if (!fullName || fullName.trim().length === 0) {
    throw new CustomError('Full name is required', 400);
  }

  // ✅ Find and update user
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { fullName: fullName.trim() },
    { new: true, runValidators: true }
  );

  if (!user) throw new CustomError('User not found', 404);

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toJSON() },
  });
});

// 🧩 Refresh access token
export const refreshToken = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new CustomError('Refresh token not provided', 401);
  }

  try {
    // ✅ Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // ✅ Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw new CustomError('Invalid refresh token', 401);
    }

    // ✅ Check if user is active
    if (!user.isActive) {
      throw new CustomError('Account is deactivated', 401);
    }

    // ✅ Generate new token pair
    const tokenPayload: JWTPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(tokenPayload);

    // ✅ Replace old refresh token with new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken);

    // ✅ Set new refresh token as httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: accessToken,
      },
    });
  } catch (error) {
    throw new CustomError('Invalid refresh token', 401);
  }
});

// 🧩 Logout
export const logout = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken && req.user) {
    // ✅ Remove refresh token from user's token list
    const user = await User.findById(req.user.id);
    if (user) {
      await user.removeRefreshToken(refreshToken);
    }
  }

  // ✅ Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

// 🧩 Logout from all devices
export const logoutAll = asyncHandler(async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    throw new CustomError('User not authenticated', 401);
  }

  // ✅ Clear all refresh tokens
  const user = await User.findById(req.user.id);
  if (user) {
    await user.clearRefreshTokens();
  }

  // ✅ Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});
