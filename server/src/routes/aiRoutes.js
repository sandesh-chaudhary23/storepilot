import { Router } from 'express';
import { generateContent } from '../controllers/aiController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.post('/product-content', protect, generateContent);

export default router;
