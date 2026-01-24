import express from 'express';
import Signup from '../models/Signup.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to update user preferences
router.put('/update-preferences', verifyToken, async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user._id;

    // Validate preferences against the enum values
    const validCategories = ['None', 'Cultural', 'Festival', 'Sports', 'Music', 'Food', 'Religious'];
    
    // Special handling for 'None' preference
    let validPreferences;
    if (preferences.includes('None')) {
      validPreferences = ['None'];
    } else {
      validPreferences = preferences.filter(pref => validCategories.includes(pref));
      // If no valid preferences, default to None
      if (validPreferences.length === 0) {
        validPreferences = ['None'];
      }
    }

    // Update user preferences
    const updatedUser = await Signup.findByIdAndUpdate(
      userId,
      { eventPreferences: validPreferences },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: updatedUser.eventPreferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
});

// Route to get user preferences
router.get('/get-preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await Signup.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      preferences: user.eventPreferences
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
});

export default router; 
