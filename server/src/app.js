import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import { notFound, errorHandler } from './middlewares/error.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173',
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  // Serve locally-stored uploads (fallback when Cloudinary isn't configured).
  app.use('/uploads', express.static(path.resolve('uploads')));

  app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/shop', shopRoutes);
  app.use('/api/business', businessRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
