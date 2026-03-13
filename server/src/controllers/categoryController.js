import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';

const scope = (req) => ({ business: req.user.business });

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find(scope(req)).sort({ name: 1 });
  res.json({ success: true, categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Category name is required');
  const category = await Category.create({ ...scope(req), name });
  res.status(201).json({ success: true, category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, ...scope(req) },
    { name: req.body.name },
    { new: true, runValidators: true }
  );
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await Product.countDocuments({ category: req.params.id, ...scope(req) });
  if (inUse) throw new ApiError(409, `Category is used by ${inUse} product(s)`);
  const category = await Category.findOneAndDelete({ _id: req.params.id, ...scope(req) });
  if (!category) throw new ApiError(404, 'Category not found');
  res.json({ success: true, message: 'Category deleted' });
});
