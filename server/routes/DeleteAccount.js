import express from 'express';
import mongoose from 'mongoose';
import Signup from '../models/Signup.js';

const router = express.Router();

// DELETE route to delete a user account
router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!id || id === 'undefined' || id === 'null') {
        return res.status(400).json({ message: 'User ID is required for deletion' });
      }
  
      // Validate MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
  
      const deletedUser = await Signup.findByIdAndDelete(id);
  
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ message: 'User account deleted successfully' });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ 
        message: 'Internal Server Error', 
        error: error.message || 'An unexpected error occurred'
      });
    }
  });
  

  export default router;
