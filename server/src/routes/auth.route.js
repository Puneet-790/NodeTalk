const router = require('express').Router();
const { register, login, logout, deleteAccount, verifyEmail } = require('../controllers/auth.controller');   


router.post('/register', register);
router.post('/verify-otp', verifyEmail);

router.post('/login', login);
router.post('/logout', logout);
router.get('/delete/:id', deleteAccount);


module.exports = router;
