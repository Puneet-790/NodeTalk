const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => Date.now() + 5 * 60 * 1000, // 5 mins
    },
    attempts: { type: Number, default: 0 }, // wrong attempts counter
    lockedUntil: { type: Date, default: null }, // account lock time
  },
  {
    timestamps: true,
  }
);

// TTL index to auto-remove after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
