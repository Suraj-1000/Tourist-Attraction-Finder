import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import UserFavorites from '../models/UserFavorites.js';

const router = express.Router();

// Add to favorites
router.post('/', verifyToken, async (req, res) => {
  try {
    const { itemType, itemId, itemName, itemDetails } = req.body;
    const userId = req.user._id;

    // Check if already in favorites
    const existing = await UserFavorites.findOne({
      userId,
      itemId,
      itemType
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Item already in favorites'
      });
    }

    const favorite = new UserFavorites({
      userId,
      itemType,
      itemId,
      itemName,
      itemDetails
    });

    await favorite.save();
    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's favorites
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type } = req.query;

    const query = { userId };
    if (type) query.itemType = type;

    const favorites = await UserFavorites.find(query)
      .sort({ addedAt: -1 });

    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from favorites
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const favoriteId = req.params.id;

    const favorite = await UserFavorites.findOneAndDelete({
      _id: favoriteId,
      userId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check if item is in favorites
router.get('/check/:itemId', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.itemId;
    const { type } = req.query;

    const favorite = await UserFavorites.findOne({
      userId,
      itemId,
      itemType: type
    });

    res.json({
      success: true,
      isFavorite: !!favorite
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router; 
