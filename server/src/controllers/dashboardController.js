import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { asyncHandler } from '../utils/ApiError.js';

const scope = (req) => ({ business: req.user.business });

// GET /api/dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const business = req.user.business;

  const [products, orders, customerCount] = await Promise.all([
    Product.find({ business }),
    Order.find({ business }),
    Customer.countDocuments({ business }),
  ]);

  const paidOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);

  // Revenue for the last 7 days (chart data).
  const days = 7;
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d, label: d.toISOString().slice(5, 10), revenue: 0, orders: 0 };
  });
  for (const o of paidOrders) {
    const created = new Date(o.createdAt);
    const bucket = buckets.find(
      (b) => created >= b.date && created < new Date(b.date.getTime() + 86400000)
    );
    if (bucket) {
      bucket.revenue += o.total;
      bucket.orders += 1;
    }
  }

  // Orders grouped by status.
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  await Order.populate(recentOrders, { path: 'customer', select: 'name' });

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: customerCount,
      lowStockCount: lowStockProducts.length,
    },
    revenueSeries: buckets.map(({ label, revenue, orders }) => ({ label, revenue, orders })),
    statusCounts,
    lowStockProducts: lowStockProducts.slice(0, 10),
    recentOrders,
  });
});
