/**
 * Seeds a demo owner + business with categories, products, customers and orders.
 * Run with: npm run seed   (requires MONGODB_URI, otherwise seeds the in-memory DB
 * which resets on exit — useful mainly for local Atlas dev).
 */
import 'dotenv/config';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Business } from '../models/Business.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Order } from '../models/Order.js';
import { InventoryLog } from '../models/InventoryLog.js';

const DEMO_EMAIL = 'owner@storepilot.app';

async function seed() {
  await connectDB();

  // Idempotent: reuse the existing demo user/business so re-seeding doesn't
  // orphan businesses or bump the storefront slug (demo-store, demo-store-1, …).
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({ name: 'Demo Owner', email: DEMO_EMAIL, password: 'password123', role: 'owner' });
  } else {
    user.name = 'Demo Owner';
    user.password = 'password123'; // ensure the known demo password
    await user.save();
  }

  // Remove any orphaned demo businesses from earlier seed runs so the base
  // slug 'demo-store' is free for the active business.
  await Business.deleteMany({ owner: { $ne: user._id }, slug: /^demo-store/ });

  let business = await Business.findOne({ owner: user._id });
  if (!business) business = await Business.create({ name: 'Demo Store', owner: user._id });
  business.name = 'Demo Store';
  business.slug = undefined; // regenerate cleanly (-> 'demo-store')
  await business.save();
  user.business = business._id;
  await user.save();

  const B = business._id;
  await Promise.all([
    Category.deleteMany({ business: B }),
    Product.deleteMany({ business: B }),
    Customer.deleteMany({ business: B }),
    Order.deleteMany({ business: B }),
    InventoryLog.deleteMany({ business: B }),
  ]);

  const [apparel, electronics, home] = await Category.create([
    { business: B, name: 'Apparel' },
    { business: B, name: 'Electronics' },
    { business: B, name: 'Home' },
  ]);

  const products = await Product.create([
    { business: B, name: 'Classic T-Shirt', sku: 'TSHIRT-01', price: 19.99, cost: 6, stock: 120, category: apparel._id, lowStockThreshold: 20, description: 'Soft cotton everyday tee.' },
    { business: B, name: 'Wireless Earbuds', sku: 'EARBUD-01', price: 59.99, cost: 22, stock: 8, category: electronics._id, lowStockThreshold: 10, description: 'Compact true-wireless earbuds.' },
    { business: B, name: 'Ceramic Mug', sku: 'MUG-01', price: 12.5, cost: 3, stock: 3, category: home._id, lowStockThreshold: 15, description: 'Hand-glazed 12oz mug.' },
    { business: B, name: 'Denim Jacket', sku: 'JACKET-01', price: 79.0, cost: 30, stock: 40, category: apparel._id, lowStockThreshold: 10, description: 'Classic mid-wash denim jacket.' },
    { business: B, name: 'USB-C Cable', sku: 'CABLE-01', price: 9.99, cost: 2, stock: 200, category: electronics._id, lowStockThreshold: 25, description: 'Braided 1m fast-charge cable.' },
  ]);

  const customers = await Customer.create([
    { business: B, name: 'Alice Johnson', email: 'alice@example.com', phone: '555-0101' },
    { business: B, name: 'Bob Smith', email: 'bob@example.com', phone: '555-0102' },
    { business: B, name: 'Carol Lee', email: 'carol@example.com', phone: '555-0103' },
  ]);

  // A demo shopper with a storefront login.
  const shopper = new Customer({
    business: B, name: 'Sam Shopper', email: 'shopper@storepilot.app',
    phone: '555-0199', password: 'password123', hasAccount: true,
  });
  await shopper.save();

  // A couple of demo orders (decrement stock + log).
  let orderNo = 1;
  for (const [i, spec] of [[0, 2], [4, 3], [3, 1]].entries()) {
    const product = products[spec[0]];
    const qty = spec[1];
    const subtotal = product.price * qty;
    await Order.create({
      business: B,
      orderNumber: `ORD-${String(orderNo++).padStart(5, '0')}`,
      customer: customers[i % customers.length]._id,
      items: [{ product: product._id, name: product.name, sku: product.sku, price: product.price, quantity: qty }],
      subtotal,
      tax: +(subtotal * 0.08).toFixed(2),
      total: +(subtotal * 1.08).toFixed(2),
      status: ['delivered', 'shipped', 'pending'][i],
      createdBy: user._id,
    });
    product.stock -= qty;
    await product.save();
  }

  console.log(
    `\n✅ Seed complete.` +
    `\n   Staff login:     ${DEMO_EMAIL} / password123` +
    `\n   Shopper login:   shopper@storepilot.app / password123` +
    `\n   Storefront URL:  /shop/${business.slug}\n`
  );
  await disconnectDB();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
