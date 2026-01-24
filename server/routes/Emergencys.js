import express from 'express';
import Emergency from '../models/Emergency.js';

const router = express.Router();

// Add new emergency contact
router.post('/', async (req, res) => {
    try {
        const { phone, type, icon } = req.body;
        const newEmergency = new Emergency({ 
            phone, 
            type, 
            icon: icon || "📞" 
        });
        await newEmergency.save();
        res.status(201).json({ 
            success: true,
            message: 'Emergency contact added successfully', 
            newEmergency 
        });
    } catch (error) {
        console.error('Error adding emergency contact:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error adding emergency contact', 
            error: error.message 
        });
    }
});

// Get all emergency contacts
router.get('/View', async (req, res) => {
    try {
        const emergencyContacts = await Emergency.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: emergencyContacts
        });
    } catch (error) {
        console.error('Error retrieving emergency contacts:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error retrieving emergency contacts', 
            error: error.message 
        });
    }
});

// Update emergency contact
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { phone, type, icon } = req.body;

    try {
        const updatedEmergency = await Emergency.findByIdAndUpdate(
            id, 
            { 
                phone, 
                type, 
                icon: icon || "📞",
                updatedAt: Date.now()
            }, 
            { new: true }
        );
        
        if (!updatedEmergency) {
            return res.status(404).json({ 
                success: false,
                message: `No contact found with ID "${id}".` 
            });
        }

        res.status(200).json({ 
            success: true,
            message: 'Emergency contact updated successfully', 
            updatedEmergency 
        });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating emergency contact', 
            error: error.message 
        });
    }
});

// Delete emergency contact
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedContact = await Emergency.findByIdAndDelete(id);
        
        if (!deletedContact) {
            return res.status(404).json({ 
                success: false,
                message: `No contact found with ID "${id}".` 
            });
        }

        res.status(200).json({ 
            success: true,
            message: 'Contact has been deleted successfully.' 
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting emergency contact',
            error: error.message 
        });
    }
});

export default router;
