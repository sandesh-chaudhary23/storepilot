import { Product } from '../models/Product.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';

const scope = (req) => ({ business: req.user.business });

// POST /api/inventory/:productId/adjust  { change, reason, note }
// change is a signed delta: +10 restock, -3 adjustment, etc.
export const adjustStock = asyncHandler(async (req, res) => {
  const change = Number(req.body.change);
  if (!Number.isFinite(change) || change === 0) {
    throw new ApiError(400, 'Provide a non-zero numeric "change"');
  }

  const product = await Product.findOne({ _id: req.params.productId, ...scope(req) });
  if (!product) throw new ApiError(404, 'Product not found');

  const newStock = product.stock + change;
  if (newStock < 0) throw new ApiError(400, 'Adjustment would drop stock below zero');

  product.stock = newStock;
  await product.save();

  await InventoryLog.create({
    ...scope(req),
    product: product._id,
    change,
    stockAfter: newStock,
    reason: change > 0 ? 'restock' : 'adjustment',
    note: req.body.note || '',
    user: req.user._id,
  });

  res.json({ success: true, product });
});

// GET /api/inventory/logs?product=
export const listLogs = asyncHandler(async (req, res) => {
  const filter = scope(req);
  if (req.query.product) filter.product = req.query.product;
  const logs = await InventoryLog.find(filter)
    .populate('product', 'name sku')
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(200);
  res.json({ success: true, logs });
});

// GET /api/inventory/low-stock
export const lowStock = asyncHandler(async (req, res) => {
  const products = await Product.find(scope(req));
  const low = products.filter((p) => p.stock <= p.lowStockThreshold);
  res.json({ success: true, products: low });
});
