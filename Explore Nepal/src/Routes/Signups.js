import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Signup from '../Models/Signup.js';
import authMiddleware from '../config/auth.js';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles', 
    allowed_formats: ['jpg', 'png', 'jpeg'], // Allowed file types
    resource_type: 'auto', // Allows both images and videos
  },
});


const upload = multer({ storage: storage });

// POST route for signup
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, termsAccepted } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || termsAccepted === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if the email is already registered
    const existingUser = await Signup.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new Signup({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      termsAccepted,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/getProfile', authMiddleware, async (req, res) => {
  try {
    const user = await Signup.findById(req.user.id); // Get logged-in user details
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT Update Profile (Protected)
router.put('/updateProfile', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const updateData = req.body;

    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedUser = await Signup.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

export default router;