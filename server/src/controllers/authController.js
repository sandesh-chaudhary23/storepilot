import crypto from 'crypto';
import { User } from '../models/User.js';
import { Business } from '../models/Business.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { sendAuthCookie, cookieOptions } from '../utils/token.js';
import { sendEmail } from '../services/emailService.js';

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  business: u.business,
  avatar: u.avatar,
});

// POST /api/auth/register  — creates an owner + their business
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, businessName } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password, role: 'owner' });
  const business = await Business.create({
    name: businessName?.trim() || `${name}'s Store`,
    owner: user._id,
  });
  user.business = business._id;
  await user.save();

  const token = sendAuthCookie(res, user._id);
  res.status(201).json({ success: true, token, user: publicUser(user) });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = sendAuthCookie(res, user._id);
  res.json({ success: true, token, user: publicUser(user) });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always respond success to avoid leaking which emails exist.
  if (user) {
    const rawToken = user.createResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Reset your StorePilot password',
      html: `<p>Hi ${user.name},</p><p>Reset your password using the link below (valid 30 minutes):</p>
             <p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw new ApiError(400, 'Reset token is invalid or has expired');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const token = sendAuthCookie(res, user._id);
  res.json({ success: true, token, user: publicUser(user) });
});
