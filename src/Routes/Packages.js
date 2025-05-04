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

// Helper functions for validation
function validateLocationDetails(locationDetails) {
  if (!locationDetails) return undefined;
  
  try {
    // If it's already an object, return it
    if (typeof locationDetails === 'object') return locationDetails;
    
    // If it's a string, try to parse it
    return JSON.parse(locationDetails);
  } catch (error) {
    console.error('Error parsing locationDetails:', error);
    return undefined;
  }
}

function validateItinerary(itinerary) {
  if (!itinerary) return [];
  
  try {
    // If it's already an array, return it
    if (Array.isArray(itinerary)) return itinerary;
    
    // If it's a string, try to parse it
    return JSON.parse(itinerary);
  } catch (error) {
    console.error('Error parsing itinerary:', error);
    return [];
  }
}

// Route to Add a New Itinerary Package
router.post("/Add-Package", upload.single("image"), async (req, res) => {
  try {
    const { guideIncluded, guideId, guideCost, price, ...packageData } = req.body;
    
    // Set image URL from the uploaded file
    packageData.imageUrl = req.file ? req.file.path : null;

    // Convert and add guide information with proper types
    packageData.guideIncluded = guideIncluded === 'true';
    
    if (packageData.guideIncluded && guideId) {
      packageData.guideId = guideId;
      packageData.guideCost = Number(guideCost) || 0;
    }
    
    // Ensure price is a number, not a string with formatting
    if (price) {
      // Handle the case where price might come with 'NPR' prefix or formatting
      try {
        // Strip out any non-numeric characters except decimal point
        const numericPrice = price.toString().replace(/[^0-9.]/g, '');
        packageData.price = numericPrice;
        console.log("💲 Parsed Price:", numericPrice);
      } catch (err) {
        console.error("❌ Error parsing price:", err);
        packageData.price = price; // Fallback to original value
      }
    }
    
    // Log guide information for debugging
    console.log("📝 Guide Information:", {
      guideIncluded: packageData.guideIncluded,
      guideId: packageData.guideId,
      guideCost: packageData.guideCost
    });

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
      })
      .populate({
        path: 'guideId',
        select: 'firstName lastName email guideProfile image'
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

    const { title, itinerary, locationDetails, reviews, guideIncluded, guideId, guideCost, __v, duration, price, ...updateData } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Package title is required for update' });
    }

    // Validate and parse locationDetails
    updateData.locationDetails = validateLocationDetails(locationDetails);

    // Validate and parse itinerary
    updateData.itinerary = validateItinerary(itinerary);

    // Ensure duration is a string
    if (duration) {
      updateData.duration = Array.isArray(duration) ? duration[0] : duration;
    }

    // Ensure price is a number, not a string with formatting
    if (price) {
      // Handle the case where price might come with 'NPR' prefix or formatting
      try {
        // Strip out any non-numeric characters except decimal point
        const numericPrice = price.toString().replace(/[^0-9.]/g, '');
        updateData.price = numericPrice;
        console.log("💲 Parsed Price:", numericPrice);
      } catch (err) {
        console.error("❌ Error parsing price:", err);
        updateData.price = price; // Fallback to original value
      }
    }

    // Don't update reviews field from form submission to avoid type errors
    // Reviews should be managed separately through a dedicated API

    // Handle guide information with proper type conversion
    updateData.guideIncluded = guideIncluded === 'true';
    
    if (updateData.guideIncluded && guideId) {
      // Only include guideId if guideIncluded is true
      updateData.guideId = guideId;
    } else if (!updateData.guideIncluded) {
      // If guide is not included, remove guideId and set guideCost to 0
      updateData.guideId = null;
      updateData.guideCost = 0;
    }
    
    // Convert guideCost to number if present
    if (updateData.guideIncluded && guideCost) {
      updateData.guideCost = Number(guideCost) || 0;
    }

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
    console.log("📝 Guide Information:", {
      guideIncluded: updateData.guideIncluded,
      guideId: updateData.guideId,
      guideCost: updateData.guideCost
    });

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
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});





export default router;
