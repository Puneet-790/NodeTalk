const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sendEmail = require('../utils/sendEmail');
const User = require('../models/User.model');
const Otp = require('../models/Otp.model');
const RefreshToken = require('../models/refreshToken.model');

const generateOTP = require('../utils/generateOtp');
const { firstTime } = require('../utils/mailTemplate');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const register = async (req, res) => {
  const {fullname, email, password} = req.body;
//   console.log(req.body);
  

  if(!fullname || !email || !password) {
    return res.status(400).json({message: "All fields are required"});
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ message: "Password must be at least 8 characters, include uppercase, lowercase, number, and special character." });
  }
  // if(password.length < 8) {
  //   return res.status(400).json({message: "Password must be at least 8 characters long"});
  // }

  if(!email.includes('@')) {
    return res.status(400).json({message: "Please enter a valid email"});
  }

  if(fullname.length < 3) {
    return res.status(400).json({message: "Name must be at least 3 characters long"});
  }

  if(fullname.length > 30) {
    return res.status(400).json({message: "Fullname is too long"});
  }

  const existingUser = await User.findOne({email}); // Replace with actual DB check
  if(existingUser) {
    // console.log(existingUser);
    
    return res.status(400).json({message: "User already exists"});
  }
    const hashedPassword = await bcrypt.hash(password, 10);; // Replace with actual hashing
    const user = {name: fullname, email, password: hashedPassword};
    
    // Save user to DB (omitted)
    try {
        const newUser = new User(user);
        await newUser.save();
        // console.log(newUser);
        // Send verification email
        // console.log(newUser.email);
        
        const otp = generateOTP(6);
        const newOtp = new Otp({email: newUser.email, otp});
        await newOtp.save();
        console.log(newOtp);    

        sendEmail(newUser.email, "Verify your NodeTalk account – OTP inside!",  firstTime(otp));
        return res.status(201).json({message: "User registered successfully. Please verify your account"});
        
    } catch (error) {
        return res.status(500).json({message: "Error registering user"});
    }
}

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(400).json({ message: "Email does not exist. Please register first." });
    }
    if (existingUser.isVerified) {
      return res.status(400).json({ message: "Email already verified. Please login." });
    }

    const otpInDB = await Otp.findOne({ email });
    if (!otpInDB) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    // Check if user is locked
    if (otpInDB.lockedUntil && otpInDB.lockedUntil > Date.now()) {
      const waitTime = Math.ceil((otpInDB.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({ message: `Too many attempts. Try again after ${waitTime} minutes.` });
    }

    // OTP match check
    if (otpInDB.otp !== otp) {
      otpInDB.attempts += 1;

      if (otpInDB.attempts >= 5) {
        otpInDB.lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // lock 2 hrs
        await otpInDB.save();
        return res.status(429).json({ message: "Too many invalid attempts. Try again after 2 hours." });
      }

      await otpInDB.save();
      return res.status(400).json({ message: `Invalid OTP. Attempts left: ${5 - otpInDB.attempts}` });
    }

    // OTP is correct → verify user
    existingUser.isVerified = true;
    await existingUser.save();

    await Otp.deleteMany({ email }); // cleanup
    return res.status(200).json({ message: "Email verified successfully. You can now login." });

  } catch (error) {
    return res.status(500).json({ message: "Error verifying email" });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email does not exist" });

    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    let otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      // If no OTP exists, create a new one
      const otp = generateOTP(6);
      otpRecord = new Otp({ email, otp, attempts: 0, resendCount: 1 });
      await otpRecord.save();
      sendEmail(email, "Verify your NodeTalk account – OTP inside!", firstTime(otp));
      return res.status(200).json({ message: "OTP sent successfully" });
    }

    // Check resend limit
    if (otpRecord.resendCount >= 5) {
      return res.status(429).json({ message: "Resend limit reached. Try again later." });
    }

    // Generate new OTP and update record
    const otp = generateOTP(6);
    otpRecord.otp = otp;
    otpRecord.attempts = 0; // reset attempts
    otpRecord.resendCount += 1;
    otpRecord.lockedUntil = null; // reset lock if any
    await otpRecord.save();

    // Send email
    sendEmail(email, "Verify your NodeTalk account – OTP inside!", firstTime(otp));

    return res.status(200).json({ message: "OTP resent successfully" });

  } catch (error) {
    return res.status(500).json({ message: "Error resending OTP", error: error.message });
  }
};

// const login = async (req, res) => {
//    const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "Invalid email or password" });

//     if (!user.isVerified) {
//       return res.status(403).json({ message: "Email not verified. Please verify your email first." });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

//     // Generate tokens
//     const accessToken = jwt.sign({ userId: user._id }, JWT_ACCESS_SECRET, { expiresIn: '15m' });
//     const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

//     // Store refresh token in HTTP-only cookie
//     res.cookie('refreshToken', refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production', // only in HTTPS
//       sameSite: 'strict',
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     return res.status(200).json({
//       message: "Login successful",
//       accessToken,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email
//       }
//     });

//   } catch (error) {
//     return res.status(500).json({ message: "Error logging in", error: error.message });
//   }
// }

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your email first." });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user._id },
      JWT_ACCESS_SECRET,
      { expiresIn: '15m' } // short-lived
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' } // long-lived
    );

    // Save refresh token in DB
    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Send refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/', // must match cookie path
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

const deleteAccount = async (req, res) => {
    const {id } = req.params;
    // console.log(id);
    
    const user = await User.findByIdAndDelete(id);
    if(!user) {
        return res.status(404).json({message: "User not found"});
    }
    return res.status(200).json({message: "User deleted successfully"});
}
module.exports = { register, verifyEmail, resendOtp, login, logout, deleteAccount };