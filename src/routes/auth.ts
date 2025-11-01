import { Router } from 'express';
import { register, login, getMe, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { registerValidation, loginValidation } from '../utils/validators';
import { handleValidationErrors, auditLogger } from '../middleware/errorHandler';
import { authRateLimiter } from '../middleware/security';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, registerValidation, handleValidationErrors, auditLogger('USER_REGISTER'), register);
router.post('/login', authRateLimiter, loginValidation, handleValidationErrors, auditLogger('USER_LOGIN'), login);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, auditLogger('USER_LOGOUT'), logout);

export { router as authRoutes };