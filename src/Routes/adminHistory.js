import express from 'express';
import { verifyToken } from '../config/auth.js';
import UserHistory from '../Models/UserHistory.js';

const router = express.Router();

// Get all user history with populated user details
router.get('/all', async (req, res) => {
  try {
    const history = await UserHistory.find()
      .populate({
        path: 'userId',
        select: 'firstName lastName email'
      })
      .sort({ timestamp: -1 });

    // Transform the data to include full user information
    const transformedHistory = history.map(entry => {
      const historyObj = entry.toObject();
      return {
        ...historyObj,
        userFullName: historyObj.userId ? `${historyObj.userId.firstName} ${historyObj.userId.lastName}` : 'Unknown User',
        userEmail: historyObj.userId ? historyObj.userId.email : 'No email'
      };
    });

    res.json({ success: true, data: transformedHistory });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch history',
      error: error.message 
    });
  }
});

// Delete multiple history entries
router.post('/delete-multiple', async (req, res) => {
  try {
    const { ids } = req.body;
    await UserHistory.deleteMany({ _id: { $in: ids } });
    res.json({ 
      success: true, 
      message: 'History entries deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting history entries:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete history entries',
      error: error.message 
    });
  }
});

// Delete single history entry
router.delete('/:id', async (req, res) => {
  try {
    await UserHistory.findByIdAndDelete(req.params.id);
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