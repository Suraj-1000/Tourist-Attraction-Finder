import express from 'express';
import Notification from '../Models/Notification.js';
import crypto from 'crypto';

const router = express.Router();

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const { message, userEmail, recipientType, type, details } = req.body;
    
    // For package notifications, check for duplicates based on package title
    if (type === 'package-added' || type === 'package-updated') {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const existingNotification = await Notification.findOne({
        type,
        'details.title': details.title,
        createdAt: { $gt: oneMinuteAgo }
      });

      if (existingNotification) {
        return res.status(200).json(existingNotification);
      }
    } else {
      // For other notifications, check based on existing criteria
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const existingNotification = await Notification.findOne({
        message,
        userEmail,
        recipientType,
        type,
        createdAt: { $gt: oneMinuteAgo }
      });

      if (existingNotification) {
        return res.status(200).json(existingNotification);
      }
    }

    // Generate a unique ID
    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    
    const notification = new Notification({
      id: uniqueId,
      message,
      userEmail,
      recipientType,
      type,
      details,
      timestamp: new Date(),
      read: false
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

// Get notifications for a specific user by email with filtering options
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { type, category, limit = 50 } = req.query;

    let query = { 
      userEmail: email,
      recipientType: 'user'
    };

    // Add type filter if provided
    if (type) {
      query.type = type;
    }

    // Add category filter for package notifications if provided
    if (category && (type === 'package-added' || type === 'package-updated')) {
      query['details.category'] = category;
    }

    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Get package notifications for a specific category
router.get('/packages/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const notifications = await Notification.find({
      type: 'package-added',
      'details.category': category
    })
    .sort({ timestamp: -1 })
    .limit(20);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching package notifications:', error);
    res.status(500).json({ message: 'Error fetching package notifications', error: error.message });
  }
});

// Get admin notifications with filtering
router.get('/admin', async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    
    let query = { recipientType: 'admin' };
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ message: 'Error fetching admin notifications', error: error.message });
  }
});

// Update notification read status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;

    const notification = await Notification.findOneAndUpdate(
      { id },
      { read },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

// Delete notifications by type for a user
router.delete('/user/:email/type/:type', async (req, res) => {
  try {
    const { email, type } = req.params;
    await Notification.deleteMany({ 
      userEmail: email,
      recipientType: 'user',
      type
    });

    res.json({ message: `All ${type} notifications deleted successfully` });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ message: 'Error deleting notifications', error: error.message });
  }
});

// Delete a specific notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndDelete({ id });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

// Delete all notifications for a user
router.delete('/user/:email/all', async (req, res) => {
  try {
    const { email } = req.params;
    await Notification.deleteMany({ 
      userEmail: email,
      recipientType: 'user'
    });

    res.json({ message: 'All notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    res.status(500).json({ message: 'Error deleting notifications', error: error.message });
  }
});

export default router; 