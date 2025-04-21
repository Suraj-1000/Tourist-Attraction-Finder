import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Event from '../Models/Event.js';


// Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Events',
    allowed_formats: ['jpg', 'png', 'jpeg'], // Allowed file types
    resource_type: 'image', // Allows both images and videos
  },
});

const upload = multer({ storage: storage });


const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search events
router.get('/search', async (req, res) => {
  try {
    const { query, category } = req.query;
    let searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    const events = await Event.find(searchQuery).sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create event
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const eventData = JSON.parse(req.body.data);
    
    // Validate location details
    if (!eventData.locationDetails || 
        !eventData.locationDetails.latitude || 
        !eventData.locationDetails.longitude || 
        !eventData.locationDetails.formattedAddress) {
      return res.status(400).json({ 
        message: 'Location details are required',
        type: 'ValidationError'
      });
    }

    // Ensure schedule has day field
    if (eventData.schedule && Array.isArray(eventData.schedule)) {
      eventData.schedule = eventData.schedule.map(item => ({
        day: item.day || "Day 1",
        time: item.time,
        activity: item.activity
      }));
    }

    // Add image if uploaded
    if (req.file) {
      eventData.image = req.file.path;
    }

    const event = new Event(eventData);
    const newEvent = await event.save();
    res.status(201).json(newEvent);

  } catch (error) {
    console.error('Event creation error:', error);
    res.status(400).json({ 
      message: error.message,
      type: error.name,
      details: error.errors
    });
  }
});

// Update event
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Parse the event data from the request body
    const eventData = JSON.parse(req.body.data);

    // Validate location details
    if (!eventData.locationDetails || 
        !eventData.locationDetails.latitude || 
        !eventData.locationDetails.longitude || 
        !eventData.locationDetails.formattedAddress) {
      return res.status(400).json({ 
        message: 'Location details are required',
        type: 'ValidationError'
      });
    }

    // Add image if uploaded
    if (req.file) {
      eventData.image = req.file.path;
    }

    // Ensure schedule has day field
    if (eventData.schedule && Array.isArray(eventData.schedule)) {
      eventData.schedule = eventData.schedule.map(item => ({
        day: item.day || "Day 1",
        time: item.time,
        activity: item.activity
      }));
    }

    // Update the event with the new data
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      eventData,
      { new: true, runValidators: true }
    );

    res.json(updatedEvent);
  } catch (error) {
    console.error('Event update error:', error);
    res.status(400).json({ 
      message: error.message,
      type: error.name,
      details: error.errors
    });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const events = await Event.find({
      startDate: { $gt: new Date() }
    }).sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get events by category
router.get('/category/:category', async (req, res) => {
  try {
    const events = await Event.find({
      category: req.params.category
    }).sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 