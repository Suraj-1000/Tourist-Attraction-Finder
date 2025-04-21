import express from 'express';
import Contact from '../Models/ContactSchema.js';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const router = express.Router();

// Validation middleware
const validateContactForm = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters long'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isIn([
      'Account Issues',
      'Payment Problems',
      'Search Feature Issues',
      'Map Navigation Problems',
      'Recommendation System',
      'Itinerary Planning Help',
      'Attraction Information Issues',
      'Review System Problems',
      'General Inquiry',
      'Other'
    ])
    .withMessage('Invalid subject selected'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10 })
    .withMessage('Message must be at least 10 characters long')
];

// Submit contact form
router.post('/submit', validateContactForm, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, subject, message } = req.body;

    // Create new contact entry
    const newContact = new Contact({
      fullName,
      email,
      subject,
      message
    });

    // Save to database
    await newContact.save();

    res.status(201).json({
      success: true,
      message: 'Your message has been submitted successfully',
      data: newContact
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your message',
      error: error.message
    });
  }
});

// Get all contact submissions (admin route)
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await Contact.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching submissions',
      error: error.message
    });
  }
});

// Update contact submission status (admin route)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, adminMessage } = req.body;
    const { id } = req.params;

    // Validate the contact ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID format'
      });
    }

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const updateData = {
      status,
      ...(adminMessage && { adminMessage })
    };

    const updatedSubmission = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: updatedSubmission
    });
  } catch (error) {
    console.error('Error updating submission status:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating status',
      error: error.message
    });
  }
});

// Send notification email
router.post('/notify', async (req, res) => {
  try {
    const { email, fullName, subject, message } = req.body;

    // Here you would implement your email sending logic
    // For example, using nodemailer or a similar service
    
    // For now, we'll just simulate success
    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

export default router; 