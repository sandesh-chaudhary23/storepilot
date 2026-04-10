import { Router } from 'express';
import { getMyBusiness, updateMyBusiness } from '../controllers/businessController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();
router.use(protect);
router.get('/', getMyBusiness);
router.put('/', authorize('owner'), updateMyBusiness);

export default router;
