import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import UserEmergencyContact from '../models/UserEmergencyContacts.js';

const router = express.Router();

// Add emergency contact
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const contactData = {
      ...req.body,
      userId
    };

    const contact = new UserEmergencyContact(contactData);
    await contact.save();

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all emergency contacts for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const contacts = await UserEmergencyContact.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update emergency contact
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const contactId = req.params.id;

    const contact = await UserEmergencyContact.findOne({
      _id: contactId,
      userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    const updatedContact = await UserEmergencyContact.findByIdAndUpdate(
      contactId,
      {
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true }
    );

    res.json({
      success: true,
      data: updatedContact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete emergency contact
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const contactId = req.params.id;

    const contact = await UserEmergencyContact.findOneAndDelete({
      _id: contactId,
      userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Emergency contact deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get specific emergency contact
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const contactId = req.params.id;

    const contact = await UserEmergencyContact.findOne({
      _id: contactId,
      userId
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Emergency contact not found'
      });
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router; 
