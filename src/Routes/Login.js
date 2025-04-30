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

    // Update last login time without triggering validation
    await Signup.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLogin: new Date(),
          // Only set gender if it's a valid value
          ...(user.gender && ['Male', 'Female', 'Others'].includes(user.gender) ? { gender: user.gender } : { gender: null })
        } 
      }
    );

    // Fetch the updated user
    const updatedUser = await Signup.findById(user._id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: updatedUser._id,
        role: updatedUser.role  // Include role in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return token along with user details
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        gender: updatedUser.gender || null,
        dateOfBirth: updatedUser.dateOfBirth,
        image: updatedUser.image,
        role: updatedUser.role,
        lastLogin: updatedUser.lastLogin,
        guideProfile: updatedUser.role === 'guide' ? {
          isVerified: updatedUser.guideProfile.verificationStatus === 'approved',
          verificationStatus: updatedUser.guideProfile.verificationStatus,
          languages: updatedUser.guideProfile.languages,
          regionsOfExpertise: updatedUser.guideProfile.regionsOfExpertise,
          serviceTypes: updatedUser.guideProfile.serviceTypes,
          rejectionReason: updatedUser.guideProfile.rejectionReason
        } : null
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
