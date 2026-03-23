import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { generateProductContent } from '../services/aiService.js';

// POST /api/ai/product-content  { name, category, keywords }
export const generateContent = asyncHandler(async (req, res) => {
  const { name, category, keywords } = req.body;
  if (!name) throw new ApiError(400, 'Product name is required');
  const result = await generateProductContent({ name, category, keywords });
  res.json({ success: true, ...result });
});
