import { Business } from '../models/Business.js';
import { asyncHandler, ApiError } from '../utils/ApiError.js';

// GET /api/business — the signed-in user's business (incl. storefront slug)
export const getMyBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.business);
  if (!business) throw new ApiError(404, 'Business not found');
  res.json({ success: true, business });
});

// PUT /api/business — owner updates store name / settings
export const updateMyBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findById(req.user.business);
  if (!business) throw new ApiError(404, 'Business not found');
  if (req.body.name) business.name = req.body.name;
  if (req.body.currency) business.currency = req.body.currency;
  if (req.body.lowStockThreshold != null) business.lowStockThreshold = req.body.lowStockThreshold;
  await business.save(); // regenerates slug if the name changed
  res.json({ success: true, business });
});
