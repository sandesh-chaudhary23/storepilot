import { Router } from 'express';
import {
  getStore, listShopProducts, getShopProduct, listShopCategories,
  registerCustomer, loginCustomer, logoutCustomer, meCustomer,
  createShopOrder, listShopOrders,
} from '../controllers/shopController.js';
import { resolveStore, protectCustomer } from '../middlewares/shopAuth.js';

// Mounted at /api/shop — every route is scoped to a store slug.
const router = Router({ mergeParams: true });

// Runs whenever a route has a :slug param — resolves req.store once.
router.param('slug', resolveStore);

// Public catalog
router.get('/:slug', getStore);
router.get('/:slug/products', listShopProducts);
router.get('/:slug/products/:id', getShopProduct);
router.get('/:slug/categories', listShopCategories);

// Customer auth
router.post('/:slug/auth/register', registerCustomer);
router.post('/:slug/auth/login', loginCustomer);
router.post('/:slug/auth/logout', logoutCustomer);
router.get('/:slug/auth/me', protectCustomer, meCustomer);

// Customer orders
router.post('/:slug/orders', protectCustomer, createShopOrder);
router.get('/:slug/orders', protectCustomer, listShopOrders);

export default router;
