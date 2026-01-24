import express from "express";
import bcrypt from "bcryptjs";
import Signup from "../models/Signup.js";

const router = express.Router();

// POST route to change password
router.post("/", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user by email
    const user = await Signup.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare current password with stored hashed password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
