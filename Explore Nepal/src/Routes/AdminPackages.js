import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Package from '../Models/AdminPackage.js';

const router = express.Router();

// Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Packages',
    allowed_formats: ['jpg', 'png', 'jpeg'], // Allowed file types
    resource_type: 'image', // Allows both images and videos
  },
});

const upload = multer({ storage: storage });

// Route to Add a New Itinerary Package
router.post("/Add-Package", upload.single("image"), async (req, res) => {
  try {
    const packageData = {
      ...req.body,
      imageUrl: req.file ? req.file.path : null, // Save the Cloudinary URL
    };

    // Parse the itinerary if it's a string
    if (typeof packageData.itinerary === 'string') {
      try {
        packageData.itinerary = JSON.parse(packageData.itinerary);
      } catch (error) {
        console.error("Error parsing itinerary:", error);
        return res.status(400).json({ message: "Invalid itinerary format" });
      }
    }

    const newPackage = new Package(packageData);
    await newPackage.save();

    // Send notification
    const notificationHub = req.app.get('notificationHub');
    if (notificationHub) {
      notificationHub.sendPackageAddedNotification({
        title: packageData.title,
        category: packageData.category,
        price: packageData.price,
        duration: packageData.duration
      });
    }

    res.status(201).json({
      message: "Package added successfully",
      package: newPackage,
    });
  } catch (error) {
    console.error("Error adding package:", error);
    res.status(500).json({ message: "Error adding package", error: error.message });
  }
});

// ✅ Fetch all packages
router.get('/all', async (req, res) => {
  try {
    const packages = await Package.find();
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Search packages by title or address
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Please provide a search query' });
    }

    const packages = await Package.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } },
      ],
    });

    if (packages.length === 0) {
      return res.status(404).json({ message: 'No packages found' });
    }

    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete package by title
router.delete('/deleteByTitle', async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ error: 'Please provide the package title to delete.' });
    }

    const deletedPackage = await Package.findOneAndDelete({ title });

    if (!deletedPackage) {
      return res.status(404).json({ message: `No package found with the title "${title}".` });
    }

    res.status(200).json({ message: `Package "${title}" has been deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/package", async (req, res) => { 
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ message: "Package title is required." });
    }

    console.log(`🔍 Searching for package: ${title}`);

    const packageData  = await Package.findOne({ title: { $regex: new RegExp(title, 'i') } });

    if (!packageData) {
      console.log(`❌ Package not found: ${title}`);
      return res.status(404).json({ message: `No package found with the title "${title}".` });
    }

    console.log(`✅ Package found: ${packageData.title}`);
    res.json(packageData);
  } catch (error) {
    console.error("🔥 Server error:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});



router.put('/updatePackage', upload.single('image'), async (req, res) => {
  try {
      console.log("📥 Incoming Update Request");
      console.log("🔹 Request Body:", req.body);
      console.log("🔹 Uploaded File:", req.file);

      const { title, itinerary, ...updateData } = req.body;

      if (!title) {
          return res.status(400).json({ message: 'Package title is required for update' });
      }

      // ✅ Handle itinerary parsing safely (Only parse if it's a string)
      if (itinerary && typeof itinerary === "string") {
          try {
              updateData.itinerary = JSON.parse(itinerary);
          } catch (error) {
              console.error("❌ Error parsing itinerary JSON:", error);
              return res.status(400).json({ message: "Invalid itinerary format." });
          }
      }

      // ✅ If an image is uploaded, update the `imageUrl`
      if (req.file) {
          updateData.imageUrl = req.file.path; // Cloudinary URL
      } else {
          // If no new image is uploaded, retain the existing image URL
          const existingPackage = await Package.findOne({ title: { $regex: new RegExp(title, 'i') } });
          if (existingPackage) {
              updateData.imageUrl = existingPackage.imageUrl; // Preserve old image
          }
      }

      console.log("📝 Final Update Data:", updateData);

      const updatedPackage = await Package.findOneAndUpdate(
          { title: { $regex: new RegExp(title, 'i') } },
          { $set: updateData },
          { new: true }
      );

      if (!updatedPackage) {
          return res.status(404).json({ message: 'Package not found' });
      }

      console.log("✅ Successfully Updated Package:", updatedPackage);
      res.json(updatedPackage);
  } catch (error) {
      console.error('❌ Error updating package:', error);
      res.status(500).json({ message: 'Internal Server Error', error });
  }
});





export default router;
