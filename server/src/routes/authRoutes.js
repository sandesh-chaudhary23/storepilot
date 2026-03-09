import { Router } from 'express';
import {
  register, login, logout, me, forgotPassword, resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
