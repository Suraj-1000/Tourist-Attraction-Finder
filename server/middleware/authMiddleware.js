import jwt from 'jsonwebtoken';
import Signup from '../models/Signup.js';

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Check for userId or id in the token payload
    const userId = decoded.userId || decoded.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    const user = await Signup.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    req.userId = userId; // Set both user object and userId for convenience
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Combined middleware for routes that need both authentication and admin rights
export const authAdmin = [verifyToken, isAdmin];

export default { verifyToken, isAdmin, authAdmin };
