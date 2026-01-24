import express from 'express';
import Signup from '../models/Signup.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// GET route for fetching users sorted by last login
router.get('/users', async (req, res) => {
  try {
    const users = await Signup.find().sort({ lastLogin: -1 }); // Sort by lastLogin in descending order
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE route for deleting a user
router.delete('/users/:id', async (req, res) => {
  try {
    const deletedUser = await Signup.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT route for updating a user
router.put('/users/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = req.body;
    if (req.file) {
      updateData.image = req.file.path;
    }

    const updatedUser = await Signup.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add the logout route
router.post('/logout/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { logoutTime } = req.body;
    
    console.log('Received logout request for user:', userId); // Debug log
    console.log('Logout time:', logoutTime); // Debug log

    // Ensure logoutTime is a valid date
    const parsedLogoutTime = new Date(logoutTime);
    if (isNaN(parsedLogoutTime.getTime())) {
      console.error('Invalid logout time received:', logoutTime);
      return res.status(400).json({ message: 'Invalid logout time format' });
    }

    // First find the user to ensure they exist
    const user = await Signup.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user with the new logout time
    const updatedUser = await Signup.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          logoutTime: parsedLogoutTime,
          lastLogin: user.lastLogin // Preserve the last login time
        } 
      },
      { new: true }
    );

    console.log('Successfully updated logout time for user:', userId);
    console.log('Updated user:', {
      id: updatedUser._id,
      lastLogin: updatedUser.lastLogin,
      logoutTime: updatedUser.logoutTime
    });

    res.status(200).json({ 
      message: 'Logout time updated successfully',
      user: {
        id: updatedUser._id,
        lastLogin: updatedUser.lastLogin,
        logoutTime: updatedUser.logoutTime
      }
    });
  } catch (error) {
    console.error('Error updating logout time:', error);
    res.status(500).json({ 
      message: 'Error updating logout time', 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Update the isUserActive function
const isUserActive = (user) => {
  if (!user.lastLogin) return false;
  
  const lastLoginTime = new Date(user.lastLogin).getTime();
  const currentTime = new Date().getTime();
  const fiveMinutes = 5 * 60 * 1000; // Changed from 30 to 5 minutes
  
  // Check if there's a more recent logout
  if (user.logoutTime) {
    const logoutTime = new Date(user.logoutTime).getTime();
    if (logoutTime > lastLoginTime) {
      return false;
    }
  }
  
  return (currentTime - lastLoginTime) <= fiveMinutes;
};

export default router;
