import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { placeOrder } from '../services/orderService.js';
import { sendShopCookie } from '../middlewares/shopAuth.js';
import { cookieOptions } from '../utils/token.js';

const publicCustomer = (c) => ({
  id: c._id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  address: c.address,
});

// ─── Storefront (public) ──────────────────────────────────

// GET /api/shop/:slug
export const getStore = asyncHandler(async (req, res) => {
  const { _id, name, slug, currency } = req.store;
  res.json({ success: true, store: { id: _id, name, slug, currency } });
});

// GET /api/shop/:slug/products?search=&category=
export const listShopProducts = asyncHandler(async (req, res) => {
  const filter = { business: req.store._id, active: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { tags: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const products = await Product.find(filter).populate('category', 'name').sort({ createdAt: -1 });
  res.json({ success: true, products });
});

// GET /api/shop/:slug/products/:id
export const getShopProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    business: req.store._id,
    active: true,
  }).populate('category', 'name');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

// GET /api/shop/:slug/categories
export const listShopCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ business: req.store._id }).sort({ name: 1 });
  res.json({ success: true, categories });
});

// ─── Customer auth ────────────────────────────────────────

// POST /api/shop/:slug/auth/register  { name, email, password, phone }
export const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const normEmail = email.toLowerCase().trim();
  let customer = await Customer.findOne({ business: req.store._id, email: normEmail }).select('+password');

  if (customer?.hasAccount) throw new ApiError(409, 'An account with this email already exists');

  if (customer) {
    // A staff-created record with this email exists — attach an account to it.
    customer.password = password;
    customer.hasAccount = true;
    if (phone && !customer.phone) customer.phone = phone;
  } else {
    customer = new Customer({ business: req.store._id, name, email: normEmail, phone: phone || '', password, hasAccount: true });
  }
  await customer.save();

  sendShopCookie(res, customer._id);
  res.status(201).json({ success: true, customer: publicCustomer(customer) });
});

// POST /api/shop/:slug/auth/login  { email, password }
export const loginCustomer = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const customer = await Customer.findOne({
    business: req.store._id,
    email: email.toLowerCase().trim(),
    hasAccount: true,
  }).select('+password');

  if (!customer || !(await customer.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  sendShopCookie(res, customer._id);
  res.json({ success: true, customer: publicCustomer(customer) });
});

// POST /api/shop/:slug/auth/logout
export const logoutCustomer = asyncHandler(async (_req, res) => {
  res.clearCookie('shopToken', cookieOptions());
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/shop/:slug/auth/me
export const meCustomer = asyncHandler(async (req, res) => {
  res.json({ success: true, customer: publicCustomer(req.customer) });
});

// ─── Customer orders ──────────────────────────────────────

// POST /api/shop/:slug/orders  { items:[{product, quantity}] }
export const createShopOrder = asyncHandler(async (req, res) => {
  const order = await placeOrder({
    business: req.store._id,
    customer: req.customer._id,
    items: req.body.items,
    tax: 0,
    createdBy: null,
    source: 'storefront',
  });
  res.status(201).json({ success: true, order });
});

// GET /api/shop/:slug/orders
export const listShopOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ business: req.store._id, customer: req.customer._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});
