import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Signup from '../Models/Signup.js';
import { verifyToken } from '../config/auth.js';

const router = express.Router();

// Storage for profile images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profiles', 
    allowed_formats: ['jpg', 'png', 'jpeg'], 
    resource_type: 'auto', 
  },
});

// Storage for documents
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

// User Profile Routes
router.get('/getProfile', verifyToken, async (req, res) => {
  try {
    const user = await Signup.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/updateProfile', verifyToken, upload.single('image'), async (req, res) => {
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

// Guide Profile Routes
router.get('/getGuideProfile', verifyToken, async (req, res) => {
  try {
    const user = await Signup.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the guide profile directly without any parsing
    res.status(200).json({
      ...user.toObject(),
      guideProfile: user.guideProfile || {
        languages: [],
        licenseNumber: '',
        licenseDocument: null,
        educationCertificates: [],
        regionsOfExpertise: [],
        serviceTypes: [],
        pricing: {
          perDay: 0,
          packages: []
        },
        availability: [],
        ratings: {
          average: 0,
          total: 0
        },
        reviews: []
      }
    });
  } catch (error) {
    console.error('Error fetching guide profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload document route
router.post('/uploadDocument', verifyToken, uploadDocument.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: req.file.path });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Error uploading document' });
  }
});

router.put('/updateGuideProfile', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Handle image upload if present
    if (req.file) {
      updateData.image = req.file.path;
    }

    // Fetch current user to get existing verification data
    const currentUser = await Signup.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle guide profile data separately
    if (updateData.guideProfile) {
      // Ensure guideProfile is an object, not a string
      const newGuideProfile = typeof updateData.guideProfile === 'string' 
        ? JSON.parse(updateData.guideProfile) 
        : updateData.guideProfile;

      // Get existing verification fields
      const existingGuideProfile = currentUser.guideProfile || {};
      const verificationFields = {
        isVerified: existingGuideProfile.isVerified || false,
        verificationStatus: existingGuideProfile.verificationStatus || 'pending',
        verificationDate: existingGuideProfile.verificationDate || null,
        verifiedBy: existingGuideProfile.verifiedBy || null,
        rejectionReason: existingGuideProfile.rejectionReason || null
      };

      // Merge new data with existing verification fields
      updateData.guideProfile = {
        ...newGuideProfile,
        ...verificationFields
      };
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
    console.error('Error updating guide profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});

// Get admin details by ID
router.get('/getAdminDetails/:adminId', verifyToken, async (req, res) => {
  try {
    const admin = await Signup.findById(req.params.adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Return only necessary admin details
    res.status(200).json({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email
    });
  } catch (error) {
    console.error('Error fetching admin details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;