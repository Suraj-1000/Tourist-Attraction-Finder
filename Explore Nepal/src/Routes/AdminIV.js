import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import AdminAddIV from '../Models/AdminAddIV.js'; 

const router = express.Router();

// Cloudinary storage setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'images_videos', 
    allowed_formats: ['jpg', 'png', 'mp4'], // Allowed file types
    resource_type: 'auto', // Allows both images and videos
  },
});

const upload = multer({ storage: storage });

// Route to upload images/videos
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Uploaded file:', req.file);

    const { filename, mimetype, size } = req.file;
    const url = req.file.path; // Cloudinary URL

    // Save to MongoDB
    const newMedia = new AdminAddIV({
      url,
      filename,
      mimetype,
      size,
    });

    await newMedia.save();
    res.status(201).json({ message: 'File uploaded successfully', file: url });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file', error });
  }
});

router.get('/files', async (req, res) => {
  try {
    const files = await AdminAddIV.find(); 
    res.status(200).json(files);
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ message: 'Failed to retrieve files', error });
  }
});

router.get('/files/:id', async (req, res) => {
  try {
    const file = await AdminAddIV.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.status(200).json(file);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ message: 'Failed to fetch file', error });
  }
});


router.put('/update/:id', upload.single('file'), async (req, res) => {
  try {
    const file = await AdminAddIV.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Extract Cloudinary Public ID correctly (removes file extension)
    const oldUrl = file.url;
    const oldPublicIdMatch = oldUrl.match(/\/upload\/v\d+\/(.+)\.\w+$/);
    if (!oldPublicIdMatch) {
      return res.status(500).json({ message: "Failed to extract Cloudinary public ID" });
    }
    const oldPublicId = oldPublicIdMatch[1]; // This should now correctly extract "images_videos/ogpzigtbltrcl6dffwrh"

    // Determine resource type for deletion
    let oldResourceType = file.mimetype.startsWith('video') ? 'video' : 'image';

    // Delete old file from Cloudinary
    await cloudinary.uploader.destroy(oldPublicId, { resource_type: oldResourceType });

    // Determine new file type
    let newResourceType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

    // Upload new file to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: 'images_videos',
      resource_type: newResourceType,
    });

    // Update MongoDB
    file.url = uploadResponse.secure_url;
    file.filename = uploadResponse.public_id;
    file.mimetype = req.file.mimetype;
    file.size = req.file.size;
    await file.save();

    res.status(200).json({ message: "File updated successfully", file });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ message: "Failed to update file", error });
  }
});


router.delete('/deleteByFilename', async (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ message: 'Filename is required' });
  }

  try {
    // Find the file in MongoDB
    const file = await AdminAddIV.findOneAndDelete({ filename });

    if (!file) {
      return res.status(404).json({ message: `File not found for filename: ${filename}` });
    }

    // Extract Cloudinary Public ID
    const publicIdMatch = file.url.match(/\/upload\/v\d+\/(.+)\.\w+$/);
    if (!publicIdMatch) {
      return res.status(500).json({ message: 'Failed to extract Cloudinary public ID' });
    }

    const publicId = publicIdMatch[1]; // Extract correct publicId from Cloudinary URL
    const resourceType = file.mimetype.startsWith('video') ? 'video' : 'image';

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({ message: 'Internal Server Error', error });
  }
});



export default router;
