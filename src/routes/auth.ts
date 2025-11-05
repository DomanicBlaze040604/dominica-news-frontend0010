import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  logout, 
  logoutAll,
  refreshToken,
  changePassword,
  updateProfile
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { registerValidation, loginValidation, changePasswordValidation } from '../utils/validators';
import { handleValidationErrors, auditLogger } from '../middleware/errorHandler';
import { authRateLimiter } from '../middleware/security';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, registerValidation, handleValidationErrors, auditLogger('USER_REGISTER'), register);
router.post('/login', authRateLimiter, loginValidation, handleValidationErrors, auditLogger('USER_LOGIN'), login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, auditLogger('USER_LOGOUT'), logout);
router.post('/logout-all', authenticate, auditLogger('USER_LOGOUT_ALL'), logoutAll);
router.put('/change-password', authenticate, changePasswordValidation, handleValidationErrors, auditLogger('PASSWORD_CHANGE'), changePassword);
router.put('/profile', authenticate, auditLogger('PROFILE_UPDATE'), updateProfile);

export { router as authRoutes };