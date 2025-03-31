import express from 'express';
import Emergency from '../Models/Emergency.js';  // Use default import

const router = express.Router();

router.post('/', async (req, res) => {
    try {
      const { name, phone, type } = req.body;
      const newEmergency = new Emergency({ name, phone, type });
      await newEmergency.save();
      res.status(201).json({ message: 'Emergency contact added successfully', newEmergency });
    } catch (error) {
      res.status(500).json({ message: 'Error adding emergency contact', error });
    }
});


router.get('/View', async (req, res) => {
    try {
        const emergencyContacts = await Emergency.find();
        res.status(200).json(emergencyContacts);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving emergency contacts', error });
    }
});


router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, phone, type } = req.body;

    try {
        const updatedEmergency = await Emergency.findByIdAndUpdate(id, { name, phone, type }, { new: true });
        
        if (!updatedEmergency) {
            return res.status(404).json({ message: `No contact found with ID "${id}".` });
        }

        res.status(200).json({ message: 'Emergency contact updated successfully', updatedEmergency });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ message: 'Error updating emergency contact', error });
    }
});



router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`Received DELETE request for ID: ${id}`);

    try {
        const deletedContact = await Emergency.findByIdAndDelete(id);
        
        if (!deletedContact) {
            console.log(`No contact found with ID "${id}".`);
            return res.status(404).json({ message: `No contact found with ID "${id}".` });
        }

        console.log(`Contact with ID "${id}" deleted successfully.`);
        res.status(200).json({ message: `Contact has been deleted successfully.` });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: error.message });
    }
});




export default router;
