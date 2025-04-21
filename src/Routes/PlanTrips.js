import express from 'express';
import Trip from "../Models/PlanTrip.js";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      tripName,
      startDate,
      endDate,
      tripType,
      duration,
      destinations,
      locationDetails,
      adventureActivities,
      culturalExperiences,
      relaxation,
      foodCulinary,
      nightlifeEntertainment,
      customActivities,
      travelStyle,
      accommodationType,
      mealsPreferences,
      dietaryPreferences,
      customDietaryPreference,
      transportationType,
      itinerary,
      personalizedExperiences,
      travelInsurance,
      includeEvents,
      totalBudget,
      transportCost,
      accommodationCost,
      mealsCost,
      activitiesCost,
      userId,
      userName,
      userEmail,
      userAddress,
      userPhone,
      groupSize
    } = req.body;

    // Validate required fields
    if (!tripName || !userId || !userName || !userEmail || !userAddress) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate group size for Family and Groups travel styles
    if ((travelStyle === 'Family' || travelStyle === 'Groups') && 
        (!groupSize || groupSize < 1)) {
      return res.status(400).json({ message: "Group size is required for Family and Groups travel styles" });
    }

    // Check if trip name already exists for this user
    const existingTrip = await Trip.findOne({ tripName, userId });
    if (existingTrip) {
      return res.status(400).json({ message: "A trip with this name already exists" });
    }

    // Create new trip
    const newTrip = new Trip({
      tripName,
      startDate,
      endDate,
      tripType,
      duration,
      destinations,
      locationDetails,
      adventureActivities: Array.isArray(adventureActivities) ? adventureActivities : [],
      culturalExperiences: Array.isArray(culturalExperiences) ? culturalExperiences : [],
      relaxation: Array.isArray(relaxation) ? relaxation : [],
      foodCulinary: Array.isArray(foodCulinary) ? foodCulinary : [],
      nightlifeEntertainment: Array.isArray(nightlifeEntertainment) ? nightlifeEntertainment : [],
      customActivities,
      travelStyle,
      accommodationType,
      mealsPreferences,
      dietaryPreferences: Array.isArray(dietaryPreferences) ? dietaryPreferences[0] || "None" : dietaryPreferences || "None",
      customDietaryPreference,
      transportationType,
      itinerary: typeof itinerary === 'string' ? JSON.parse(itinerary) : itinerary,
      personalizedExperiences,
      travelInsurance: Boolean(travelInsurance),
      includeEvents: Boolean(includeEvents),
      totalBudget,
      transportCost,
      accommodationCost,
      mealsCost,
      activitiesCost,
      userId,
      userName,
      userEmail,
      userAddress,
      userPhone,
      groupSize: groupSize ? parseInt(groupSize) : undefined,
      status: "pending"
    });

    await newTrip.save();
    res.status(201).json({ message: "Trip added successfully!", trip: newTrip });
  } catch (error) {
    console.error("Error saving trip:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});



// ✅ Fetch trips for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const trips = await Trip.find({ userId }); 
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Fetch all trips (admin only)
router.get('/all', async (req, res) => {
  try {
    const trips = await Trip.find(); 
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Search trips by name or destination (user-specific)
router.get('/', async (req, res) => {
  try {
    const { query, userId } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Please provide a search query' });
    }

    const trips = await Trip.find({
      userId,
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

// ✅ Delete trip by name (user-specific)
router.delete('/deleteByTripName', async (req, res) => {
  try {
    const { tripName, userId } = req.query;
    if (!tripName || !userId) {
      return res.status(400).json({ error: 'Please provide the trip name and user ID to delete.' });
    }

    const deletedTrip = await Trip.findOneAndDelete({ tripName, userId });

    if (!deletedTrip) {
      return res.status(404).json({ message: `No trip found with the name "${tripName}" for this user.` });
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
    const { _id, userId, ...updateData } = req.body;

    if (!_id || !userId) {
      return res.status(400).json({ message: 'Trip ID and user ID are required for update' });
    }

    // Find the trip by _id and userId
    const existingTrip = await Trip.findOne({ _id, userId });
    
    if (!existingTrip) {
      return res.status(404).json({ message: 'Trip not found or you do not have permission to update this trip' });
    }

    // Validate group size for Family and Groups travel styles
    if ((updateData.travelStyle === 'Family' || updateData.travelStyle === 'Groups') && 
        (!updateData.groupSize || updateData.groupSize < 1)) {
      return res.status(400).json({ message: "Group size is required for Family and Groups travel styles" });
    }

    // Convert groupSize to number if present
    if (updateData.groupSize) {
      updateData.groupSize = parseInt(updateData.groupSize);
    }

    // Handle array fields
    const arrayFields = [
      'adventureActivities',
      'culturalExperiences',
      'relaxation',
      'foodCulinary',
      'nightlifeEntertainment'
    ];

    arrayFields.forEach(field => {
      if (updateData[field]) {
        updateData[field] = Array.isArray(updateData[field]) ? updateData[field] : [updateData[field]];
      }
    });

    // Handle single value fields that should not be arrays
    const singleValueFields = [
      'travelStyle',
      'accommodationType',
      'mealsPreferences',
      'dietaryPreferences',
      'transportationType'
    ];

    singleValueFields.forEach(field => {
      if (Array.isArray(updateData[field])) {
        updateData[field] = updateData[field][0];
      }
    });

    // Ensure itinerary is properly formatted
    if (updateData.itinerary) {
      if (typeof updateData.itinerary === 'string') {
        try {
          updateData.itinerary = JSON.parse(updateData.itinerary);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid itinerary format' });
        }
      }
      if (!Array.isArray(updateData.itinerary)) {
        updateData.itinerary = [updateData.itinerary];
      }
    }

    // Handle boolean fields
    if (updateData.travelInsurance !== undefined) {
      updateData.travelInsurance = Boolean(updateData.travelInsurance);
    }
    if (updateData.includeEvents !== undefined) {
      updateData.includeEvents = Boolean(updateData.includeEvents);
    }

    // Update the trip
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id, userId },
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    if (!updatedTrip) {
      return res.status(404).json({ message: 'Failed to update trip' });
    }

    res.status(200).json({ 
      message: 'Trip updated successfully', 
      trip: updatedTrip 
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid data type', 
        details: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
});

// Get a single trip by ID
router.get('/trip/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Trip ID is required." });
    }

    const tripData = await Trip.findById(id);

    if (!tripData) {
      return res.status(404).json({ message: `No trip found with ID "${id}".` });
    }

    res.json(tripData);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
});



export default router;
