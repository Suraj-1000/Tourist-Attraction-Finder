import express from 'express';
import Signup from '../Models/Signup.js';
import bcrypt from 'bcryptjs'; // Import bcryptjs for hashing passwords

const router = express.Router();

// Function to get current time in Nepal Time (NPT)
const getNepalTime = () => {
  return new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" });
};

// Function to check if the reset code is expired
const isResetCodeExpired = (expiresAt) => {
  const currentNepalTime = new Date(getNepalTime()).getTime();
  return currentNepalTime > new Date(expiresAt).getTime(); // Compare expiry time with current Nepal time
};

// POST route to reset the password
router.post('/', async (req, res) => {
  try {
    const { resetCode, newPassword, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!resetCode || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Reset code, new password, and confirm password are required' });
    }

    // Check if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Find user by resetCode stored in the database
    const user = await Signup.findOne({ resetCode });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the reset code is expired
    if (isResetCodeExpired(user.resetCodeExpires)) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    // Check if the reset code matches
    if (user.resetCode !== resetCode) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Hash the new password before saving it
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt); // Hash the password using bcrypt

    // Reset the password (store the hashed password)
    user.password = hashedPassword;
    user.resetCode = null; // Optional: Clear the reset code
    user.resetCodeExpires = null; // Optional: Clear the reset code expiry

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error('Error in pass-reset:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
