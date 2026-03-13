import { Router } from 'express';
import { adjustStock, listLogs, lowStock } from '../controllers/inventoryController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/logs', listLogs);
router.get('/low-stock', lowStock);
router.post('/:productId/adjust', adjustStock);

export default router;
