import express from "express";
import Language from "../Models/Language.js";

const router = express.Router();

// Get all languages
router.get("/", async (req, res) => {
  try {
    const languages = await Language.find();
    res.json(languages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new language
router.post("/", async (req, res) => {
  try {
    const { name, code, flag } = req.body;
    const newLanguage = new Language({ name, code, flag });
    await newLanguage.save();
    res.status(201).json(newLanguage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ✅ Update an existing language by `id`
router.put("/:id", async (req, res) => {
  try {
    const updatedLanguage = await Language.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedLanguage) {
      return res.status(404).json({ message: "Language not found" });
    }
    res.json(updatedLanguage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Delete a language
router.delete("/:id", async (req, res) => {
    try {
      const deletedLanguage = await Language.findByIdAndDelete(req.params.id);
  
      if (!deletedLanguage) {
        return res.status(404).json({ message: "Language not found" });
      }
      res.json({ message: "Language deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  

export default router;
