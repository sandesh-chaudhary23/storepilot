import { Product } from '../models/Product.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { saveImage } from '../services/uploadService.js';

const scope = (req) => ({ business: req.user.business });

// GET /api/products?search=&category=&lowStock=&page=&limit=
export const listProducts = asyncHandler(async (req, res) => {
  const { search, category, lowStock, page = 1, limit = 50 } = req.query;
  const filter = scope(req);

  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { sku: { $regex: search, $options: 'i' } },
  ];
  if (category) filter.category = category;

  let query = Product.find(filter).populate('category', 'name').sort({ createdAt: -1 });
  const all = await query;
  let items = all;
  if (lowStock === 'true') items = all.filter((p) => p.stock <= p.lowStockThreshold);

  const start = (Number(page) - 1) * Number(limit);
  const paged = items.slice(start, start + Number(limit));

  res.json({ success: true, total: items.length, products: paged });
});

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ...scope(req) }).populate('category', 'name');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, product });
});

// POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, price } = req.body;
  if (!name || !sku || price == null) throw new ApiError(400, 'Name, SKU and price are required');

  const image = req.file ? await saveImage(req.file, req) : req.body.image || '';
  const tags = normalizeTags(req.body.tags);

  const product = await Product.create({
    ...scope(req),
    name,
    sku,
    price: Number(price),
    cost: Number(req.body.cost || 0),
    description: req.body.description || '',
    tags,
    category: req.body.category || undefined,
    stock: Number(req.body.stock || 0),
    lowStockThreshold: Number(req.body.lowStockThreshold ?? 5),
    image,
  });

  if (product.stock > 0) {
    await InventoryLog.create({
      ...scope(req),
      product: product._id,
      change: product.stock,
      stockAfter: product.stock,
      reason: 'initial',
      user: req.user._id,
    });
  }

  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id  (does NOT change stock — use inventory endpoints for that)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, ...scope(req) });
  if (!product) throw new ApiError(404, 'Product not found');

  const fields = ['name', 'sku', 'description', 'price', 'cost', 'category', 'lowStockThreshold', 'active'];
  for (const f of fields) if (req.body[f] !== undefined) product[f] = req.body[f];
  if (req.body.tags !== undefined) product.tags = normalizeTags(req.body.tags);
  if (req.file) product.image = await saveImage(req.file, req);
  else if (req.body.image !== undefined) product.image = req.body.image;

  await product.save();
  res.json({ success: true, product });
});

// DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, ...scope(req) });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true, message: 'Product deleted' });
});

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return tags.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}
