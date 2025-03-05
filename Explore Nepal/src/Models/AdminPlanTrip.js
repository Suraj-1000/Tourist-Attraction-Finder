import mongoose from 'mongoose';

const PlanItinerarySchema = new mongoose.Schema({
  day: String,
  mode: String,
  highlights: String,
  stay: String,
  meals: String,
  costBreakdown: String,
});

const PlanTripSchema = new mongoose.Schema({
  tripName: { type: String, required: true },
  startDate: Date,
  endDate: Date,
  tripType: { type: String, enum: ['Short Trip', 'Long Trip'] },
  duration: String,
  destinations: String,  // Stored as a string instead of an array
  adventureActivities: [String], // Change from String to Array of Strings
  culturalExperiences: [String],
  relaxation: [String],
  foodCulinary: [String],
  nightlifeEntertainment: [String],
  customActivities: String,
  travelStyle: { type: String, enum: ['Solo', 'Couples', 'Groups', 'Family'] },
  accommodationType: { type: String, enum: ['Guesthouses', 'Hostels', 'Mid-Range', '3-Star Hotels', 'Homestays', 'Luxury', '5-Star Hotels', 'Resorts'] },
  mealsPreferences: { type: String, enum: ['All-Inclusive', 'Self-Catering'] },
  dietaryPreferences: { type: String, enum: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free'] },
  customDietaryPreference: String,
  transportationType: { type: String, enum: ['Flights', 'Private Car/Van', 'Buses', 'None'] },
  itinerary: [PlanItinerarySchema],  // Only field stored as an array
  personalizedExperiences: String,
  travelInsurance: { type: Boolean, default: false },
  includeEvents: { type: Boolean, default: false },
  totalBudget: String,
  transportCost: String,
  accommodationCost: String,
  mealsCost: String,
  activitiesCost: String,
  status: { type: String, default: "pending" },
}, { timestamps: true });

const PlanTrip = mongoose.model('PlanTrip', PlanTripSchema);
export default PlanTrip;
