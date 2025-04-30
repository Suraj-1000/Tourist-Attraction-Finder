import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import Package from '../Models/Package.js';
import Signup from '../Models/Signup.js';
import nodemailer from 'nodemailer';

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

// Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send email notification about new package
const sendNewPackageEmail = async (userEmail, packageDetails) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "🎉 New Travel Package Added!",
    html: `
      <h2>New Package Alert: ${packageDetails.title}</h2>
      <p>We're excited to announce a new travel package that might interest you!</p>
      <h3>Package Details:</h3>
      <ul>
        <li><strong>Title:</strong> ${packageDetails.title}</li>
        <li><strong>Category:</strong> ${packageDetails.category}</li>
        <li><strong>Duration:</strong> ${packageDetails.duration}</li>
        <li><strong>Price:</strong> ${packageDetails.price}</li>
      </ul>
      <p>Visit our website to learn more about this exciting new package!</p>
      <p>Best regards,<br>Explore Nepal Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email notification sent to ${userEmail}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${userEmail}:`, error);
  }
};

// Add validation helper function
const validateLocationDetails = (locationDetails) => {
  const defaultLocation = {
    latitude: 27.7172,
    longitude: 85.3240,
    formattedAddress: "Kathmandu, Nepal"
  };

  if (!locationDetails) return defaultLocation;

  try {
    const location = typeof locationDetails === 'string' ? JSON.parse(locationDetails) : locationDetails;
    
    const latitude = parseFloat(location.latitude);
    const longitude = parseFloat(location.longitude);

    if (isNaN(latitude) || isNaN(longitude) || !isFinite(latitude) || !isFinite(longitude)) {
      return defaultLocation;
    }

    return {
      latitude,
      longitude,
      formattedAddress: location.formattedAddress || defaultLocation.formattedAddress
    };
  } catch (error) {
    console.error("Error parsing locationDetails:", error);
    return defaultLocation;
  }
};

// Add itinerary validation helper
const validateItinerary = (itinerary) => {
  if (!itinerary) return [];
  
  try {
    // If itinerary is already an array, return it
    if (Array.isArray(itinerary)) {
      return itinerary;
    }
    
    // If itinerary is a string, try to parse it
    if (typeof itinerary === 'string') {
      return JSON.parse(itinerary);
    }
    
    // If itinerary is an object, wrap it in an array
    if (typeof itinerary === 'object') {
      return [itinerary];
    }
    
    return [];
  } catch (error) {
    console.error("Error parsing itinerary:", error);
    return [];
  }
};

// Route to Add a New Itinerary Package
router.post("/Add-Package", upload.single("image"), async (req, res) => {
  try {
    const packageData = {
      ...req.body,
      imageUrl: req.file ? req.file.path : null,
    };

    // Validate and parse locationDetails
    packageData.locationDetails = validateLocationDetails(packageData.locationDetails);

    // Validate and parse itinerary
    packageData.itinerary = validateItinerary(packageData.itinerary);

    const newPackage = new Package(packageData);
    await newPackage.save();

    // Send notification through socket
    const notificationHub = req.app.get('notificationHub');
    if (notificationHub) {
      notificationHub.sendPackageAddedNotification({
        title: packageData.title,
        category: packageData.category,
        price: packageData.price,
        duration: packageData.duration
      });
    }

    // Get all users and send email notifications
    const users = await Signup.find({}, 'email');
    for (const user of users) {
      await sendNewPackageEmail(user.email, packageData);
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

    const packageData = await Package.findOne({ title: { $regex: new RegExp(title, 'i') } })
      .populate({
        path: 'reviews.userId',
        select: 'firstName lastName email'
      });

    if (!packageData) {
      console.log(`❌ Package not found: ${title}`);
      return res.status(404).json({ message: `No package found with the title "${title}".` });
    }

    // Transform reviews to include user information
    if (packageData.reviews) {
      packageData.reviews = packageData.reviews.map(review => {
        const reviewObj = review.toObject();
        return {
          ...reviewObj,
          userFullName: reviewObj.userId ? `${reviewObj.userId.firstName} ${reviewObj.userId.lastName}` : null
        };
      });
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

    const { title, itinerary, locationDetails, ...updateData } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Package title is required for update' });
    }

    // Validate and parse locationDetails
    updateData.locationDetails = validateLocationDetails(locationDetails);

    // Validate and parse itinerary
    updateData.itinerary = validateItinerary(itinerary);

    // If an image is uploaded, update the imageUrl
    if (req.file) {
      updateData.imageUrl = req.file.path;
    } else {
      // If no new image is uploaded, retain the existing image URL
      const existingPackage = await Package.findOne({ title: { $regex: new RegExp(title, 'i') } });
      if (existingPackage) {
        updateData.imageUrl = existingPackage.imageUrl;
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
