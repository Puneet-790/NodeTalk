const rateLimit = require('express-rate-limit');

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 requests per IP
  message: "Too many login attempts. Try again after 15 minutes."
});

// OTP verification limiter
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many OTP attempts. Try again later."
});


module.exports = {loginLimiter, otpLimiter}
