import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Attraction from '../Models/SearchAttraction.js';

const router = express.Router();


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'attractions', 
    allowed_formats: ['jpg', 'png', 'jpeg'], // Allowed file types
    resource_type: 'auto', // Allows both images and videos
  },
});

const upload = multer({ storage: storage });


// Route: Search attractions by name or address
router.get('/', async (req, res) => {
  try {
    const { query, category } = req.query;
    let searchQuery = {};

    // Build search query based on parameters
    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
      ];
    }

    if (category) {
      searchQuery.category = { $regex: new RegExp(`^${category}$`, 'i') }; // Case-insensitive exact match
    }

    console.log('Search Query:', searchQuery); // Debug log

    // If no filters are provided, return all attractions
    const attractions = await Attraction.find(searchQuery)
      .select('name image rating numberOfReviews category description address rankingString');

    console.log(`Found ${attractions.length} attractions`); // Debug log
    console.log('Categories found:', attractions.map(a => a.category)); // Debug log

    if (attractions.length === 0) {
      return res.status(404).json({ 
        message: category 
          ? `No attractions found in category "${category}"${query ? ` matching "${query}"` : ''}`
          : query 
          ? `No attractions found matching "${query}"`
          : 'No attractions found'
      });
    }

    res.status(200).json(attractions);
  } catch (error) {
    console.error("Search error:", error); // Debug log
    res.status(500).json({ error: error.message });
  }
});

// Fetch all attractions
router.get('/all', async (req, res) => {
  try {
    const attractions = await Attraction.find();
    console.log(attractions);
    res.status(200).json(attractions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Route: Delete an attraction by name
router.delete('/deleteByName', async (req, res) => {
  try {
    console.log("Incoming DELETE request:", req.query); // Debugging log

    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'Please provide the name of the attraction to delete.' });
    }

    const deletedAttraction = await Attraction.findOneAndDelete({ name });

    if (!deletedAttraction) {
      return res.status(404).json({ message: `No attraction found with the name "${name}".` });
    }

    res.status(200).json({ message: `Attraction "${name}" has been deleted successfully.` });
  } catch (error) {
    console.error("Error deleting attraction:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/attraction", async (req, res) => { 
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ message: "Attraction name is required" });
    }

    console.log(`🔍 Searching for attraction: ${name}`);

    const attraction = await Attraction.findOne({ name: name });

    if (!attraction) {
      console.log(`❌ Attraction not found: ${name}`);
      return res.status(404).json({ message: "Attraction not found" });
    }

    console.log(`✅ Attraction found: ${attraction.name}`);
    res.json(attraction);
  } catch (error) {
    console.error("🔥 Server error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});





router.put('/updateAttraction', upload.single('image'), async (req, res) => {
  try {
    const { name, subcategories, subtype, photos, ...updateData } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Attraction name is required for update' });
    }

    if (req.file) {
      updateData.image = req.file.path;
    }

    // ✅ Convert subcategories and subtype to arrays
    updateData.subcategories = subcategories ? JSON.parse(subcategories) : []; 
    updateData.subtype = subtype ? JSON.parse(subtype) : [];

    // ✅ Find the current attraction to preserve `photos`
    const existingAttraction = await Attraction.findOne({ name });

    if (!existingAttraction) {
      return res.status(404).json({ message: 'Attraction not found' });
    }

    // ✅ Preserve the photos array if it's not explicitly updated
    updateData.photos = existingAttraction.photos || [];

    const updatedAttraction = await Attraction.findOneAndUpdate(
      { name: name },
      { $set: updateData },
      { new: true }
    );

    res.json(updatedAttraction);
  } catch (error) {
    console.error('Error updating attraction:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});










export default router;
