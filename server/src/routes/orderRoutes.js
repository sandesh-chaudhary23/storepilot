import { Router } from 'express';
import {
  listOrders, getOrder, createOrder, updateOrderStatus,
} from '../controllers/orderController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.put('/:id/status', updateOrderStatus);

export default router;
