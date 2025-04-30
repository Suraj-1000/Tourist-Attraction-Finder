import express from 'express';
import Signup from '../Models/Signup.js';
import { verifyToken } from '../config/auth.js';

const router = express.Router();

// Get all approved guides
router.get('/approved', verifyToken, async (req, res) => {
  try {
    const guides = await Signup.find({
      role: 'guide',
      'guideProfile.verificationStatus': 'approved',
      'guideProfile.isVerified': true
    }).select('-password').sort({ firstName: 1 });

    res.status(200).json(guides);
  } catch (error) {
    console.error('Error fetching approved guides:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get guide by ID
router.get('/:guideId', verifyToken, async (req, res) => {
  try {
    const { guideId } = req.params;

    const guide = await Signup.findOne({
      _id: guideId,
      role: 'guide',
      'guideProfile.isVerified': true
    }).select('-password');

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.status(200).json(guide);
  } catch (error) {
    console.error('Error fetching guide details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 