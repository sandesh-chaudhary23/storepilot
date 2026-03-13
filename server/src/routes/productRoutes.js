import { Router } from 'express';
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
} from '../controllers/productController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = Router();
router.use(protect);

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', authorize('owner'), upload.single('image'), createProduct);
router.put('/:id', authorize('owner'), upload.single('image'), updateProduct);
router.delete('/:id', authorize('owner'), deleteProduct);

export default router;
