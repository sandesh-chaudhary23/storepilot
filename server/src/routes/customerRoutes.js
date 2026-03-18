import { Router } from 'express';
import {
  listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer,
} from '../controllers/customerController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
