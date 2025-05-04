import express from 'express';
import Signup from '../Models/Signup.js';
import { verifyToken } from '../config/auth.js';

const router = express.Router();

// Get all pending guides
router.get('/pending', verifyToken, async (req, res) => {
  try {
    const guides = await Signup.find({
      role: 'guide',
      'guideProfile.verificationStatus': 'pending'
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json(guides);
  } catch (error) {
    console.error('Error fetching guides:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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

// Get all rejected guides
router.get('/rejected', verifyToken, async (req, res) => {
  try {
    const guides = await Signup.find({
      role: 'guide',
      'guideProfile.verificationStatus': 'rejected'
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json(guides);
  } catch (error) {
    console.error('Error fetching rejected guides:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get guide by ID
router.get('/:guideId', verifyToken, async (req, res) => {
  try {
    const { guideId } = req.params;

    const guide = await Signup.findOne({
      _id: guideId,
      role: 'guide'
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

// Approve guide
router.put('/approve/:guideId', verifyToken, async (req, res) => {
  try {
    const { guideId } = req.params;
    const adminId = req.user.id;

    // Check if the user making the request is an admin
    const admin = await Signup.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve guides' });
    }

    const guide = await Signup.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Update guide verification status
    guide.guideProfile.isVerified = true;
    guide.guideProfile.verificationStatus = 'approved';
    guide.guideProfile.verificationDate = new Date();
    guide.guideProfile.verifiedBy = adminId;
    guide.guideProfile.rejectionReason = null;

    await guide.save();

    res.status(200).json({ 
      message: 'Guide approved successfully',
      guide: {
        id: guide._id,
        firstName: guide.firstName,
        lastName: guide.lastName,
        email: guide.email,
        verificationStatus: 'approved'
      }
    });
  } catch (error) {
    console.error('Error approving guide:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject guide
router.put('/reject/:guideId', verifyToken, async (req, res) => {
  try {
    const { guideId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // Check if the user making the request is an admin
    const admin = await Signup.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reject guides' });
    }

    const guide = await Signup.findById(guideId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({ message: 'Guide not found' });
    }

    // Update guide verification status
    guide.guideProfile.isVerified = false;
    guide.guideProfile.verificationStatus = 'rejected';
    guide.guideProfile.verificationDate = new Date();
    guide.guideProfile.verifiedBy = adminId;
    guide.guideProfile.rejectionReason = rejectionReason;

    await guide.save();

    res.status(200).json({ 
      message: 'Guide rejected successfully',
      guide: {
        id: guide._id,
        firstName: guide.firstName,
        lastName: guide.lastName,
        email: guide.email,
        verificationStatus: 'rejected',
        rejectionReason
      }
    });
  } catch (error) {
    console.error('Error rejecting guide:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
