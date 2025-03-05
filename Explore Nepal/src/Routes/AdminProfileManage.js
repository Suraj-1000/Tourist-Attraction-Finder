import express from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Signup from '../Models/Signup.js';

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

// GET route to fetch all users
router.get('/getProfile/:id', async (req, res) => {
  try {
    const { id } = req.params; 

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await Signup.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});





router.put('/updateProfile/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params; // Get userId from the request params
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ message: 'User ID is required for update' });
    }

    // If an image is uploaded, store the Cloudinary URL
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Update user based on ID
    const updatedUser = await Signup.findByIdAndUpdate(
      id,
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
