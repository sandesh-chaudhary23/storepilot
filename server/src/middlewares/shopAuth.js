import jwt from 'jsonwebtoken';
import { Business } from '../models/Business.js';
import { Customer } from '../models/Customer.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { cookieOptions } from '../utils/token.js';

/** Resolves :slug -> req.store (the Business). Used by every shop route. */
export const resolveStore = asyncHandler(async (req, _res, next) => {
  const store = await Business.findOne({ slug: req.params.slug });
  if (!store) throw new ApiError(404, 'Store not found');
  req.store = store;
  next();
});

export function signShopToken(customerId) {
  return jwt.sign({ cid: customerId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function sendShopCookie(res, customerId) {
  const token = signShopToken(customerId);
  res.cookie('shopToken', token, cookieOptions());
  return token;
}

/** Requires a logged-in shopper whose account belongs to the resolved store. */
export const protectCustomer = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.shopToken ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);
  if (!token) throw new ApiError(401, 'Please sign in to continue');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Session expired, please sign in again');
  }

  const customer = await Customer.findById(decoded.cid);
  if (!customer || !customer.hasAccount) throw new ApiError(401, 'Account not found');
  if (String(customer.business) !== String(req.store._id)) {
    throw new ApiError(403, 'This account does not belong to this store');
  }

  req.customer = customer;
  next();
});
