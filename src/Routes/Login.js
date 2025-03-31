import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Signup from '../Models/Signup.js';

const router = express.Router();

// POST route for login
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const adminEmail = 'suraj.explore.nepal@gmail.com';
    const userRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Any email for user

    if (email !== adminEmail && !userRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const user = await Signup.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();
    

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        role: user.role  // Include role in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return token along with user details
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        image: user.image,
        role: user.role,
        lastLogin: user.lastLogin,
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
