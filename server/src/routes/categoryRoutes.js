import { Router } from 'express';
import {
  listCategories, createCategory, updateCategory, deleteCategory,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', listCategories);
router.post('/', authorize('owner'), createCategory);
router.put('/:id', authorize('owner'), updateCategory);
router.delete('/:id', authorize('owner'), deleteCategory);

export default router;
