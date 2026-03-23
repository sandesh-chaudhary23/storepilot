import { asyncHandler, ApiError } from '../utils/ApiError.js';
import { saveImage } from '../services/uploadService.js';

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  business: u.business,
  avatar: u.avatar,
});

// PUT /api/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  if (name) req.user.name = name;
  if (email) req.user.email = email.toLowerCase();
  await req.user.save();
  res.json({ success: true, user: publicUser(req.user) });
});

// PUT /api/profile/password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }
  const user = await req.user.constructor.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword || ''))) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

// POST /api/profile/avatar
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No image uploaded');
  req.user.avatar = await saveImage(req.file, req);
  await req.user.save();
  res.json({ success: true, user: publicUser(req.user) });
});
