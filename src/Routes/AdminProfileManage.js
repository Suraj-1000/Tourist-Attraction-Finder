import express from 'express';
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
    allowed_formats: ['jpg', 'png', 'jpeg'], 
    resource_type: 'auto', 
  },
});

const upload = multer({ storage: storage });



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