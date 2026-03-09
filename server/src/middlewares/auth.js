import { verifyToken } from '../utils/token.js';
import { User } from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

/** Requires a valid JWT (cookie or Bearer header). Attaches req.user. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) throw new ApiError(401, 'Not authenticated');

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');

  req.user = user;
  next();
});

/** Restricts a route to specific roles, e.g. authorize('owner'). */
export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission for this action'));
  }
  next();
};
