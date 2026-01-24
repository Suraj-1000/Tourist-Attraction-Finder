import express from 'express';
import UserFavorites from '../models/UserFavorites.js';

const router = express.Router();

// Get all user favorites with populated user details
router.get('/all', async (req, res) => {
  try {
    const favorites = await UserFavorites.find()
      .populate({
        path: 'userId',
        select: 'firstName lastName email'
      })
      .sort({ addedAt: -1 });

    // Transform the data to include full user information
    const transformedFavorites = favorites.map(entry => {
      const favoriteObj = entry.toObject();
      return {
        ...favoriteObj,
        userFullName: favoriteObj.userId ? `${favoriteObj.userId.firstName} ${favoriteObj.userId.lastName}` : 'Unknown User',
        userEmail: favoriteObj.userId ? favoriteObj.userId.email : 'No email',
        itemDetails: favoriteObj.itemDetails || {}
      };
    });

    res.json({ 
      success: true, 
      data: transformedFavorites 
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch favorites',
      error: error.message 
    });
  }
});

// Delete a favorite entry
router.delete('/:id', async (req, res) => {
  try {
    await UserFavorites.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true, 
      message: 'Favorite entry deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting favorite entry:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete favorite entry',
      error: error.message 
    });
  }
});

export default router; 
