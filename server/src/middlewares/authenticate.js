const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshToken.model');




const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Check if a valid refresh token exists for this user
    const tokenExists = await RefreshToken.findOne({ userId: payload.userId });
    if (!tokenExists) return res.status(401).json({ message: "Token invalid. Please login again." });

    req.user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired access token" });
  }
};


module.exports = {authenticate};