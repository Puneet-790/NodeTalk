const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User.model');
const Otp = require('../models/Otp.model');

const generateOTP = require('../utils/generateOtp');
const { firstTime } = require('../utils/mailTemplate');


const register = async (req, res) => {
  const {fullname, email, password} = req.body;
//   console.log(req.body);
  

  if(!fullname || !email || !password) {
    return res.status(400).json({message: "All fields are required"});
  }

  if(password.length < 6) {
    return res.status(400).json({message: "Password must be at least 6 characters long"});
  }

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

const login = async (req, res) => {
  res.send('Login endpoint');
}

const logout = async (req, res) => {
  res.send('Logout endpoint');
}

const deleteAccount = async (req, res) => {
    const {id } = req.params;
    // console.log(id);
    
    const user = await User.findByIdAndDelete(id);
    if(!user) {
        return res.status(404).json({message: "User not found"});
    }
    return res.status(200).json({message: "User deleted successfully"});
}
module.exports = { register, verifyEmail, login, logout, deleteAccount };