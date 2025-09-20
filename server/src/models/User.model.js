const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 3,
    maxLength: 30
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minLength: 6    
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  friends: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    acceptedAt: { type: Date, default: Date.now } // friendship accepted timestamp
  }],
  sentRequests: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now } // timestamp when request was sent
  }],
  friendRequests: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now } // timestamp when request was received
  }],
}, { timestamps: true });

// TTL index to auto-delete unverified users after 24 hours
userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { isVerified: false } }
);

module.exports = model('User', userSchema);
