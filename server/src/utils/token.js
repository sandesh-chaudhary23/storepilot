import jwt from 'jsonwebtoken';

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Auth-cookie attributes. In production the frontend is served over HTTPS from
 * Vercel and reaches this API via a same-origin `/api` rewrite, so the cookie
 * must be `Secure; SameSite=None` for the browser to store and resend it.
 * In dev we stay on `lax`/insecure so it works over plain http://localhost.
 */
export function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd || process.env.COOKIE_SECURE === 'true';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

/** Sets the auth JWT as an HTTP-only cookie and returns it too (for header clients). */
export function sendAuthCookie(res, userId) {
  const token = signToken({ id: userId });
  res.cookie('token', token, cookieOptions());
  return token;
}
