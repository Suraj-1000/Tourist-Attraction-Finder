import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig.js';
import AdminAddIV from '../models/Image&Video.js'; 

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'images_videos', 
    allowed_formats: ['jpg', 'png', 'mp4'], 
    resource_type: 'auto',
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { filename, mimetype, size } = req.file;
    const url = req.file.path;
    const tags = req.body.tags ? req.body.tags.split(",") : [];

    const newMedia = new AdminAddIV({
      url,
      filename,
      mimetype,
      size,
      tags,
    });

    await newMedia.save();
    res.status(201).json({ message: "File uploaded successfully", file: url });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload file", error });
  }
});

router.get("/files", async (req, res) => {
  try {
    const files = await AdminAddIV.find();
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve files", error });
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

    // If a new file is uploaded, process the new file
    if (req.file) {
      const oldUrl = file.url;
      const oldPublicIdMatch = oldUrl.match(/\/upload\/v\d+\/(.+)\.\w+$/);
      if (!oldPublicIdMatch) {
        return res.status(500).json({ message: "Failed to extract Cloudinary public ID" });
      }
      const oldPublicId = oldPublicIdMatch[1]; 

      await cloudinary.uploader.destroy(oldPublicId);

      const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
        folder: 'images_videos',
        resource_type: req.file.mimetype.startsWith('video') ? 'video' : 'image',
      });

      file.url = uploadResponse.secure_url;
      file.filename = uploadResponse.public_id;
      file.mimetype = req.file.mimetype;
      file.size = req.file.size;
    }

    file.tags = req.body.tags ? req.body.tags.split(",") : file.tags;
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
