import express from 'express';
import { verifyToken } from '../config/auth.js';
import UserHistory from '../Models/UserHistory.js';

const router = express.Router();

// Add to history
router.post('/', verifyToken, async (req, res) => {
  try {
    const { action, itemType, itemId, itemName } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!action || !itemType || !itemName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate action type
    const validActions = [
      'viewed details',
      'shared',
      'copied link of',
      'booked',
      'added to favorites',
      'removed from favorites',
      'searched',
      'filtered category'
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action type'
      });
    }

    const historyEntry = new UserHistory({
      userId,
      action,
      itemType,
      itemId: itemId || Date.now().toString(),
      itemName
    });

    await historyEntry.save();
    res.status(201).json({ success: true, data: historyEntry });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save history entry',
      error: error.message
    });
  }
});

// Get user's history with pagination and filtering
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      type,
      action,
      limit = 50,
      page = 1,
      startDate,
      endDate
    } = req.query;

    const query = { userId };

    // Add filters if provided
    if (type) query.itemType = type;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const history = await UserHistory.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await UserHistory.countDocuments(query);

    res.json({
      success: true,
      data: history,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
});

// Clear history with optional filtering
router.delete('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, action, startDate, endDate } = req.query;

    const query = { userId };

    // Add filters if provided
    if (type) query.itemType = type;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const result = await UserHistory.deleteMany(query);

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} history entries`
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history',
      error: error.message
    });
  }
});

// Delete specific history entry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const historyId = req.params.id;

    const historyEntry = await UserHistory.findOneAndDelete({
      _id: historyId,
      userId
    });

    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: 'History entry not found or unauthorized'
      });
    }

    res.json({
      success: true,
      message: 'History entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete history entry',
      error: error.message
    });
  }
});

export default router; 