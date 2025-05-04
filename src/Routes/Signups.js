import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Signup from '../Models/Signup.js';
import nodemailer from "nodemailer";
import jwt from 'jsonwebtoken';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles', 
    allowed_formats: ['jpg', 'png', 'jpeg'], 
    resource_type: 'auto', 
  },
});

// Create a separate storage for documents
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'documents', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'], 
    resource_type: 'auto', 
  },
});

const upload = multer({ storage: storage });
const uploadDocument = multer({ storage: documentStorage });

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
    const { firstName, lastName, email, phone, password, confirmPassword, termsAccepted, role, gender, dateOfBirth, address, image, guideProfile } = req.body;

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

    // Determine role based on email or provided role
    const adminEmail = 'suraj.explore.nepal@gmail.com';
    const finalRole = email === adminEmail ? "admin" : role || "user";
    
    // Check for additional required fields for guides
    if (finalRole === 'guide') {
      if (!gender || !dateOfBirth || !address || !image) {
        return res.status(400).json({ message: 'Gender, date of birth, address, and profile image are required for guides' });
      }
    }

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
      role: finalRole,
      gender: finalRole === 'guide' ? gender : null,
      dateOfBirth: finalRole === 'guide' ? new Date(dateOfBirth) : null,
      address: finalRole === 'guide' ? address : '',
      image: finalRole === 'guide' ? image : null,
      guideProfile: finalRole === 'guide' ? guideProfile : null,
      termsAccepted: true
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
    const { firstName, lastName, email, phone, password, role, gender, dateOfBirth, address, image, guideProfile, termsAccepted } = storedOtp;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with all required fields
    const newUser = await Signup.create({ 
      firstName, 
      lastName, 
      email, 
      phone, 
      password: hashedPassword, 
      role,
      gender: role === 'guide' ? gender : null,
      dateOfBirth: role === 'guide' ? dateOfBirth : null,
      address: role === 'guide' ? address : '',
      image: role === 'guide' ? image : null,
      guideProfile: role === 'guide' ? {
        ...guideProfile,
        isVerified: false,
        verificationStatus: 'pending',
        verificationDate: null,
        verifiedBy: null,
        rejectionReason: null,
        languages: guideProfile.languages || [],
        licenseNumber: guideProfile.licenseNumber || '',
        licenseDocument: guideProfile.licenseDocument || null,
        educationCertificates: guideProfile.educationCertificates || [],
        regionsOfExpertise: guideProfile.regionsOfExpertise || [],
        serviceTypes: guideProfile.serviceTypes || []
      } : null,
      termsAccepted: true
    });

    delete otpStore[email];

    // If the user is a guide, send notification to admin
    if (role === 'guide') {
      // Find admin users
      const admins = await Signup.find({ role: 'admin' });
      
      // Send email to each admin
      for (const admin of admins) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: admin.email,
          subject: "New Guide Registration Requires Verification",
          html: `
            <p>Hello Admin,</p>
            <p>A new guide has registered and requires verification:</p>
            <ul>
              <li>Name: ${firstName} ${lastName}</li>
              <li>Email: ${email}</li>
              <li>Phone: ${phone}</li>
              <li>Gender: ${gender}</li>
              <li>Address: ${address}</li>
              <li>License Number: ${guideProfile?.licenseNumber || 'Not provided'}</li>
            </ul>
            <p>Please review their application in the admin dashboard.</p>
            <p>Best regards,<br>Explore Nepal System</p>
          `,
        });
      }
    }

    res.status(200).json({ 
      message: role === 'guide' 
        ? 'Account created! Please wait for admin verification before accessing guide features.'
        : 'OTP verified successfully. Account created!',
      user: newUser
    });
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

// Middleware to verify token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Update user preferences
router.put('/update-preferences', verifyToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.userId;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({ message: 'Preferences must be an array' });
    }

    const validCategories = ['Cultural', 'Festival', 'Sports', 'Music', 'Food', 'Religious'];
    const invalidCategories = preferences.filter(pref => !validCategories.includes(pref));
    
    if (invalidCategories.length > 0) {
      return res.status(400).json({ 
        message: `Invalid categories: ${invalidCategories.join(', ')}` 
      });
    }

    const updatedUser = await Signup.findByIdAndUpdate(
      userId,
      { eventPreferences: preferences },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedUser.eventPreferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user preferences
router.get('/get-preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await Signup.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      preferences: user.eventPreferences
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to handle guide verification by admin
router.post('/verify-guide/:guideId', verifyToken, async (req, res) => {
  try {
    const { guideId } = req.params;
    const adminId = req.userId;

    // Check if the user making the request is an admin
    const admin = await Signup.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can verify guides' });
    }

    const guide = await Signup.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Update guide verification status
    guide.guideProfile.isVerified = true;
    await guide.save();

    res.status(200).json({ 
      message: 'Guide verified successfully',
      guide: {
        id: guide._id,
        firstName: guide.firstName,
        lastName: guide.lastName,
        email: guide.email,
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Error verifying guide:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to get guide profile
router.get('/guide-profile/:guideId', async (req, res) => {
  try {
    const { guideId } = req.params;
    const guide = await Signup.findById(guideId).select('firstName lastName email phone guideProfile');

    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.status(200).json({
      guide: {
        id: guide._id,
        firstName: guide.firstName,
        lastName: guide.lastName,
        email: guide.email,
        phone: guide.phone,
        profile: guide.guideProfile
      }
    });
  } catch (error) {
    console.error('Error fetching guide profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to update guide profile
router.put('/guide-profile/:guideId', verifyToken, async (req, res) => {
  try {
    const { guideId } = req.params;
    const userId = req.userId;
    const updates = req.body;

    // Check if the user is updating their own profile
    if (guideId !== userId) {
      return res.status(403).json({ message: 'You can only update your own profile' });
    }

    const guide = await Signup.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Update guide profile
    guide.guideProfile = {
      ...guide.guideProfile,
      ...updates
    };

    await guide.save();

    res.status(200).json({
      message: 'Guide profile updated successfully',
      profile: guide.guideProfile
    });
  } catch (error) {
    console.error('Error updating guide profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Document upload route
router.post('/upload-document', uploadDocument.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get the secure URL from the uploaded file
    const documentUrl = req.file.path;

    res.status(200).json({
      message: 'Document uploaded successfully',
      url: documentUrl
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Error uploading document' });
  }
});

// Route to get basic user info by ID (for reviews, etc.)
router.get('/user-basic/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await Signup.findById(userId).select('firstName lastName email image');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        image: user.image
      }
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;