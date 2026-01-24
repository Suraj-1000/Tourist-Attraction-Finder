import express from "express";
import PlanTrip from "../models/PlanTrip.js"; // ✅ Correct model import
import nodemailer from "nodemailer";
import Notification from "../models/Notification.js";

const router = express.Router();

// ✅ Setup Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Function to send an email notification
const sendEmailNotification = async (email, status, tripName, declineMessage) => {
  const subject = status === "approved"
    ? "🎉 Your Trip Plan is Approved!"
    : "❌ Your Trip Plan was Rejected";

  const message = status === "approved"
    ? `Congratulations! Your trip "${tripName}" has been approved. You can now proceed with the next steps of your journey.`
    : `Unfortunately, your trip "${tripName}" was rejected.\n\nReason: ${declineMessage || 'No reason provided'}\n\nPlease review and modify your plan before resubmitting.`;

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

// Function to create and save notification
const createNotification = async (tripData, status, declineMessage = "") => {
  const notificationId = `trip-${tripData.tripName}-${Date.now()}`;
  
  const notification = new Notification({
    id: notificationId,
    type: status === 'approved' ? 'trip-approval' : 'trip-declined',
    message: status === 'approved' 
      ? `Your trip "${tripData.tripName}" has been approved!` 
      : `Your trip "${tripData.tripName}" has been declined. ${declineMessage ? `Reason: ${declineMessage}` : ''}`,
    details: {
      tripName: tripData.tripName,
      status,
      declineMessage: declineMessage || null
    },
    timestamp: new Date(),
    read: false,
    userId: tripData.userId,
    userEmail: tripData.userEmail,
    recipientType: 'user'
  });

  try {
    await notification.save();
    console.log('✅ Notification saved to database:', notificationId);
    return notification;
  } catch (error) {
    console.error('❌ Error saving notification:', error);
    throw error;
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

// Update trip status
router.put('/trips/:tripName', async (req, res) => {
    try {
        const { tripName } = req.params;
        const { status, declineMessage, userEmail } = req.body;

        const trip = await PlanTrip.findOne({ tripName });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Update trip fields
        trip.status = status;
        if (status === 'declined' && declineMessage) {
            trip.declineMessage = declineMessage;
        }
        
        await trip.save();

        // Send email notification
        await sendEmailNotification(userEmail, status, tripName, declineMessage);

        // Create and save notification in database
        const notification = await createNotification(trip, status, declineMessage);

        res.json({ message: 'Trip status updated successfully', trip });
    } catch (error) {
        console.error('Error updating trip status:', error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
