import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Signup from '../Models/Signup.js';
import nodemailer from "nodemailer";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles', 
    allowed_formats: ['jpg', 'png', 'jpeg'], 
    resource_type: 'auto', 
  },
});

const upload = multer({ storage: storage });

const otpStore = {};  
const OTP_EXPIRY_TIME = 10 * 60 * 1000;

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();  // Generates a 6-digit OTP
};


// POST route for signup
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, termsAccepted } = req.body;

    // Check if all fields are provided
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || termsAccepted === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if email already exists
    const existingUserByEmail = await Signup.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Check if phone number already exists
    const existingUserByPhone = await Signup.findOne({ phone });
    if (existingUserByPhone) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }

    // Validate phone number format (starts with 98 or 97 and is 10 digits long)
    const phoneRegex = /^(98|97)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Phone number must start with 98 or 97 and contain 10 digits' });
    }

    // Determine role based on email
    const adminEmail = 'suraj.explore.nepal@gmail.com';
    const role = email === adminEmail ? "admin" : "user";
    


    // OTP generation and email sending
    const otp = generateOTP();
    otpStore[email] = { 
      otp, 
      expiry: Date.now() + OTP_EXPIRY_TIME, 
      firstName, 
      lastName, 
      email, 
      phone, 
      password, 
      role,
      termsAccepted: true // Store termsAccepted value
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Signup",
      html: `
        <p>Hello ${firstName},</p>
        <p>Thank you for signing up with us! To complete your registration, please verify your email by entering the OTP below:</p>
        <p style="font-size: 18px; font-weight: bold;">Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>Explore Nepal</p>
      `,
    });

    res.status(200).json({ message: 'User registered successfully. OTP sent to your email.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// POST route for OTP verification
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!otp || !email) {
    return res.status(400).json({ message: 'OTP and email are required' });
  }

  const storedOtp = otpStore[email];

  if (!storedOtp || !storedOtp.otp) {
    return res.status(400).json({ message: 'Invalid OTP request' });
  }

  if (storedOtp.expiry < Date.now()) {
    delete otpStore[email]; // OTP expired
    return res.status(400).json({ message: 'OTP expired' });
  }

  if (storedOtp.otp === otp) {
    const { firstName, lastName, email, phone, password, role, termsAccepted } = storedOtp;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with all required fields
    const newUser = await Signup.create({ 
      firstName, 
      lastName, 
      email, 
      phone, 
      password: hashedPassword, 
      role,
      termsAccepted: true // Explicitly set to true since user accepted during signup
    });

    delete otpStore[email];

    res.status(200).json({ message: 'OTP verified successfully. Account created!' });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
});

// POST route for creating new admin
router.post('/create-admin', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, createdBy } = req.body;

    // Check if all required fields are provided
    if (!firstName || !lastName || !email || !phone || !password || !createdBy) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if the creator is an admin
    const creator = await Signup.findById(createdBy);
    if (!creator || creator.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create other admins' });
    }

    // Check if email already exists
    const existingUserByEmail = await Signup.findOne({ email });
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Check if phone number already exists
    const existingUserByPhone = await Signup.findOne({ phone });
    if (existingUserByPhone) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }

    // Validate phone number format
    const phoneRegex = /^(98|97)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Phone number must start with 98 or 97 and contain 10 digits' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const newAdmin = await Signup.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      termsAccepted: true
    });

    res.status(201).json({ 
      message: 'Admin created successfully',
      admin: {
        id: newAdmin._id,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;