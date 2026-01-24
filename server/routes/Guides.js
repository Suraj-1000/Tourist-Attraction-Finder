import express from 'express';
import Signup from '../models/Signup.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all approved guides
router.get('/approved', verifyToken, async (req, res) => {
  try {
    const guides = await Signup.find({
      role: 'guide',
      'guideProfile.verificationStatus': 'approved',
      'guideProfile.isVerified': true
    })
    .populate('guideProfile.reviews.touristId', 'firstName lastName image')
    .select('-password')
    .sort({ firstName: 1 });

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
    })
    .populate('guideProfile.reviews.touristId', 'firstName lastName image')
    .select('-password');

    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    res.status(200).json(guide);
  } catch (error) {
    console.error('Error fetching guide details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get pending guides for approval
router.get('/pending', verifyToken, async (req, res) => {
  try {
    const guides = await Signup.find({
      role: 'guide'
    })
    .populate('guideProfile.reviews.touristId', 'firstName lastName image')
    .select('-password')
    .sort({ firstName: 1 });

    res.status(200).json(guides);
  } catch (error) {
    console.error('Error fetching guides for approval:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all guides for admin view
router.get('/all', verifyToken, async (req, res) => {
  try {
    const guides = await Signup.find({
      role: 'guide'
    })
    .populate('guideProfile.reviews.touristId', 'firstName lastName image')
    .select('-password')
    .sort({ 'guideProfile.verificationStatus': 1, firstName: 1 });

    res.status(200).json(guides);
  } catch (error) {
    console.error('Error fetching all guides:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add a reply to a review
router.post('/reply/:reviewId', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    const guideId = req.userId;

    if (!reply || typeof reply !== 'string') {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    // Find the guide
    const guide = await Signup.findOne({
      _id: guideId,
      role: 'guide'
    });

    if (!guide) {
      return res.status(403).json({ message: 'Only guides can reply to reviews' });
    }

    // Find the review in the guide's profile
    const reviewIndex = guide.guideProfile.reviews.findIndex(
      review => review._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update the review with the reply
    guide.guideProfile.reviews[reviewIndex].reply = reply;
    await guide.save();

    res.status(200).json({
      message: 'Reply added successfully',
      review: guide.guideProfile.reviews[reviewIndex]
    });
  } catch (error) {
    console.error('Error adding reply to review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 
