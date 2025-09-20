const router = require('express').Router();
const { register, login, logout, deleteAccount, verifyEmail } = require('../controllers/auth.controller');   
const {authenticate} = require('../middlewares/authenticate');
const { refreshTokenController } = require('../utils/generateTokens');
const { loginLimiter, otpLimiter } = require('../utils/limiters');

router.post('/register', register);
router.post('/verify-otp',otpLimiter, verifyEmail);

router.post('/login',loginLimiter, login);
router.post('/logout', logout);
// router.get('/delete/:id', deleteAccount);

router.get('/refresh-token', refreshTokenController);

router.get('/profile', authenticate, (req, res) => {
  res.json({ message: "Protected profile", userId: req.user.userId });
});

module.exports = router;
