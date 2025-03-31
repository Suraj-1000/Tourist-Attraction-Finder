import express from 'express';
import Trip from "../Models/PlanTrip.js";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("Received Data:", req.body);
  
  try {
    const newTrip = new Trip({
      ...req.body,
      itinerary: JSON.parse(req.body.itinerary), 
      price: req.body.price ? req.body.price.toString() : "", 
      groupSize: req.body.groupSize ? req.body.groupSize.toString() : "", 
      accommodationType: Array.isArray(req.body.accommodationType) ? req.body.accommodationType.join(", ") : req.body.accommodationType, // Convert array to string
      mealsPreferences: Array.isArray(req.body.mealsPreferences) ? req.body.mealsPreferences.join(", ") : req.body.mealsPreferences, // Convert array to string
      dietaryPreferences: Array.isArray(req.body.dietaryPreferences) ? req.body.dietaryPreferences.join(", ") : req.body.dietaryPreferences, // Convert array to string
      status: "pending"
  });
  

      await newTrip.save();
      res.status(201).json({ message: "Trip added successfully!", trip: newTrip });
  } catch (error) {
      console.error("Error saving trip:", error);
      res.status(500).json({ message: "Server Error", error });
  }
});



// ✅ Fetch all trips
router.get('/all', async (req, res) => {
  try {
    const trips = await Trip.find(); 
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Search trips by name or destination
router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Please provide a search query' });
    }

    const trips = await Trip.find({
      $or: [
        { tripName: { $regex: query, $options: 'i' } },
        { destinations: { $regex: query, $options: 'i' } },
      ],
    });

    if (trips.length === 0) {
      return res.status(404).json({ message: 'No trips found' });
    }

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete trip by name
router.delete('/deleteByTripName', async (req, res) => {
  try {
    const { tripName } = req.query;
    if (!tripName) {
      return res.status(400).json({ error: 'Please provide the trip name to delete.' });
    }

    const deletedTrip = await Trip.findOneAndDelete({ tripName });

    if (!deletedTrip) {
      return res.status(404).json({ message: `No trip found with the name "${tripName}".` });
    }

    res.status(200).json({ message: `Trip "${tripName}" has been deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fetch a single trip
router.get('/trip', async (req, res) => {
  try {
    const { tripName } = req.query;
    if (!tripName) {
      return res.status(400).json({ message: "Trip name is required." });
    }

    const tripData = await Trip.findOne({ tripName: { $regex: new RegExp(tripName, "i") } });

    if (!tripData) {
      return res.status(404).json({ message: `No trip found with the name "${tripName}".` });
    }

    res.json(tripData);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});



router.put('/updateTrip', async (req, res) => {
  try {
    const { tripName, ...updateData } = req.body;

    if (!tripName) {
      return res.status(400).json({ message: 'Trip name is required for update' });
    }

    const updatedTrip = await Trip.findOneAndUpdate(
      { tripName: { $regex: new RegExp(tripName, 'i') } },
      { $set: updateData },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.json(updatedTrip);
  } catch (error) {
    console.error('🔥 Error updating trip:', error); // Log the error
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});




export default router;
