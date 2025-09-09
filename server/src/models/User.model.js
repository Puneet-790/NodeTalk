const Schema = require('mongoose').Schema;
const model = require('mongoose').model;    

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
    friends: {
        type: Array,
        default: [],
        ref: 'User'
    },
    sentRequests: {
        type: Array,
        default: [],
        ref: 'User'
    },
    friendRequests: { 
        type: Array,
        default: [],
        ref: 'User'
    },
}, {timestamps: true } );

// TTL index to auto-delete unverified users after 24 hours
userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { isVerified: false } }
);

module.exports = model('User', userSchema);