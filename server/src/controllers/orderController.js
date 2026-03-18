import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { placeOrder } from '../services/orderService.js';

const scope = (req) => ({ business: req.user.business });

// GET /api/orders?status=&search=
export const listOrders = asyncHandler(async (req, res) => {
  const filter = scope(req);
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.orderNumber = { $regex: req.query.search, $options: 'i' };
  const orders = await Order.find(filter).populate('customer', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, ...scope(req) })
    .populate('customer')
    .populate('items.product', 'name sku image');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ success: true, order });
});

// POST /api/orders  { customer, items:[{product, quantity}], tax }
export const createOrder = asyncHandler(async (req, res) => {
  const { customer, items, tax = 0 } = req.body;
  const order = await placeOrder({
    business: req.user.business,
    customer,
    items,
    tax,
    createdBy: req.user._id,
    source: 'staff',
  });
  res.status(201).json({ success: true, order });
});

// PUT /api/orders/:id/status  { status }
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) throw new ApiError(400, 'Invalid status');

  const order = await Order.findOne({ _id: req.params.id, ...scope(req) });
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.status === 'cancelled') throw new ApiError(400, 'Cancelled orders cannot change status');

  // Cancelling restores stock.
  if (status === 'cancelled') {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
        await InventoryLog.create({
          ...scope(req),
          product: product._id,
          change: item.quantity,
          stockAfter: product.stock,
          reason: 'order_cancelled',
          order: order._id,
          user: req.user._id,
        });
      }
    }
  }

  order.status = status;
  await order.save();
  res.json({ success: true, order });
});
