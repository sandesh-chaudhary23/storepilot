import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { ApiError } from '../utils/ApiError.js';

async function nextOrderNumber(business) {
  const count = await Order.countDocuments({ business });
  return `ORD-${String(count + 1).padStart(5, '0')}`;
}

/**
 * Creates an order for a business: validates stock up front, then decrements
 * stock and writes inventory logs. Shared by the staff API and the storefront
 * so stock accounting is identical regardless of who places the order.
 *
 * @param {Object}   opts
 * @param {ObjectId} opts.business    business the order belongs to
 * @param {ObjectId} [opts.customer]  optional customer id (validated against business)
 * @param {Array}    opts.items       [{ product, quantity }]
 * @param {number}   [opts.tax]
 * @param {ObjectId} [opts.createdBy] staff user id (null for storefront)
 * @param {'staff'|'storefront'} [opts.source]
 */
export async function placeOrder({ business, customer, items, tax = 0, createdBy = null, source = 'staff' }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'An order needs at least one item');
  }

  if (customer) {
    const exists = await Customer.findOne({ _id: customer, business });
    if (!exists) throw new ApiError(400, 'Customer not found');
  }

  // Resolve products and validate stock before mutating anything.
  const resolved = [];
  for (const line of items) {
    const qty = Number(line.quantity);
    if (!qty || qty < 1) throw new ApiError(400, 'Each item needs a quantity of at least 1');
    const product = await Product.findOne({ _id: line.product, business });
    if (!product) throw new ApiError(400, `Product ${line.product} not found`);
    if (!product.active) throw new ApiError(400, `${product.name} is not available`);
    if (product.stock < qty) {
      throw new ApiError(400, `Insufficient stock for ${product.name} (have ${product.stock}, need ${qty})`);
    }
    resolved.push({ product, qty });
  }

  const orderItems = resolved.map(({ product, qty }) => ({
    product: product._id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    quantity: qty,
  }));
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + Number(tax);

  const order = await Order.create({
    business,
    orderNumber: await nextOrderNumber(business),
    customer: customer || undefined,
    items: orderItems,
    subtotal,
    tax: Number(tax),
    total,
    status: 'pending',
    createdBy: createdBy || undefined,
    source,
  });

  for (const { product, qty } of resolved) {
    product.stock -= qty;
    await product.save();
    await InventoryLog.create({
      business,
      product: product._id,
      change: -qty,
      stockAfter: product.stock,
      reason: 'sale',
      order: order._id,
      user: createdBy || undefined,
    });
  }

  return order;
}
