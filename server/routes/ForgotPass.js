import express from 'express';
import Signup from '../models/Signup.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Generate a 6-digit reset code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST route to send reset code
router.post('/', async (req, res) => {  // Updated route to /forgot
    try {
      const { email } = req.body;
  
      // Validate email input
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
  
      // Find user by email
      const user = await Signup.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Generate reset code and expiry
      const resetCode = generateResetCode();
      const resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 minutes from now
  
      // Save reset code to database
      user.resetCode = resetCode;
      user.resetCodeExpires = resetCodeExpires;
      await user.save();
  
      // Send reset code via email
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: 'explorenepal.it@gmail.com',
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${resetCode}. It will expire in 15 minutes.`,
      };
  
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ message: 'Reset code sent to your email' });
    } catch (error) {
      console.error('Error in forgot-password:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
