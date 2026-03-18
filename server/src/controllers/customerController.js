import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';

const scope = (req) => ({ business: req.user.business });

export const listCustomers = asyncHandler(async (req, res) => {
  const filter = scope(req);
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { phone: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, customers });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, ...scope(req) });
  if (!customer) throw new ApiError(404, 'Customer not found');
  const orders = await Order.find({ customer: customer._id, ...scope(req) }).sort({ createdAt: -1 });
  const totalSpent = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  res.json({ success: true, customer, orders, stats: { orderCount: orders.length, totalSpent } });
});

export const createCustomer = asyncHandler(async (req, res) => {
  if (!req.body.name) throw new ApiError(400, 'Customer name is required');
  const customer = await Customer.create({ ...scope(req), ...req.body });
  res.status(201).json({ success: true, customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, ...scope(req) },
    req.body,
    { new: true, runValidators: true }
  );
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findOneAndDelete({ _id: req.params.id, ...scope(req) });
  if (!customer) throw new ApiError(404, 'Customer not found');
  res.json({ success: true, message: 'Customer deleted' });
});
