import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
} from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors, auditLogger } from '../middleware/errorHandler';

const router = Router();

// Validation middleware
const createUserValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'user'])
    .withMessage('Role must be admin, editor, or user'),
];

const updateUserValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'user'])
    .withMessage('Role must be admin, editor, or user'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// User management routes
router.get('/', auditLogger('USER_LIST'), getUsers);
router.get('/stats', auditLogger('USER_STATS'), getUserStats);
router.get('/:id', auditLogger('USER_VIEW'), getUserById);
router.post('/', createUserValidation, handleValidationErrors, auditLogger('USER_CREATE'), createUser);
router.put('/:id', updateUserValidation, handleValidationErrors, auditLogger('USER_UPDATE'), updateUser);
router.delete('/:id', auditLogger('USER_DELETE'), deleteUser);
router.patch('/:id/toggle-status', auditLogger('USER_STATUS_TOGGLE'), toggleUserStatus);

export { router as userRoutes };