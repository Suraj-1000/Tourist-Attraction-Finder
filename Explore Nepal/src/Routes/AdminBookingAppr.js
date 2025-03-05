import express from "express";
import PlanTrip from "../Models/AdminPlanTrip.js"; // ✅ Correct model import
import nodemailer from "nodemailer";

const router = express.Router();

// ✅ Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "explorenepal.it@gmail.com", // Your email
    pass: "ihsl rjso rpkd wrfn", // Your app password (DO NOT SHARE PUBLICLY)
  },
});

// ✅ Function to send an email notification
const sendEmailNotification = async (email, status, tripName) => {
  const subject = status === "approved"
    ? "🎉 Your Trip Plan is Approved!"
    : "❌ Your Trip Plan was Rejected";

  const message = status === "approved"
    ? `Congratulations! Your trip "${tripName}" has been approved. You can now proceed with the next steps of your journey.`
    : `Unfortunately, your trip "${tripName}" was rejected. Please review and modify your plan before resubmitting.`;

  const mailOptions = {
    from: "explorenepal.it@gmail.com",
    to: email,
    subject: subject,
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email notification sent successfully");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

// 🟡 Fetch all pending trips
router.get("/pending", async (req, res) => {
  try {
    const pendingTrips = await PlanTrip.find({ status: "pending" });
    res.json(pendingTrips);
  } catch (error) {
    res.status(500).json({ error: "Error fetching pending trips" });
  }
});

// 🔵 Fetch all trips (approved, pending, declined)
router.get("/trips", async (req, res) => {
    try {
      const allTrips = await PlanTrip.find();  // ✅ Ensure correct model
  
      if (!allTrips || allTrips.length === 0) {
        return res.status(404).json({ message: "No trips found" }); 
      }
  
      // ✅ Format dates before sending response
      const formattedTrips = allTrips.map(trip => ({
        ...trip._doc,
        startDate: trip.startDate ? trip.startDate.toISOString().split("T")[0] : null,
        endDate: trip.endDate ? trip.endDate.toISOString().split("T")[0] : null,
      }));
  
      res.json(formattedTrips);
    } catch (error) {
      console.error("❌ Error fetching trips:", error.stack);  // ✅ Log full error
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });
  
  
  
  router.put("/trips/:tripName", async (req, res) => {
    try {
      const { status } = req.body;  // Get the status from the request body
      const tripName = req.params.tripName;
  
      if (!status) {
        return res.status(400).json({ error: 'Status is required to update the trip' });
      }
  
      const trip = await PlanTrip.findOne({ tripName: tripName });
      if (!trip) {
        return res.status(404).json({ error: `Trip "${tripName}" not found` });
      }
  
      trip.status = status;
      await trip.save();
  
      res.json({ message: `Trip "${trip.tripName}" successfully updated!`, trip });
    } catch (error) {
      console.error("❌ Error updating trip status:", error);
      res.status(500).json({ error: "Error updating trip status", details: error.message });
    }
  });
  

  

export default router;
