const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshToken.model');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

const refreshTokenController = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  try {
    // Verify JWT
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Check if refresh token exists in DB
    const tokenInDb = await RefreshToken.findOne({ token: refreshToken });
    if (!tokenInDb) {
      return res.status(403).json({ message: "Refresh token invalid or revoked" });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: payload.userId },
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({ accessToken });

  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

module.exports = {refreshTokenController};
