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
  travelStyle: { 
    type: String, 
    enum: ['Solo', 'Couples', 'Groups', 'Family'],
    required: false
  },
  accommodationType: { 
    type: String, 
    enum: ['None', 'Guesthouses', 'Hostels', 'Mid-Range', '3-Star Hotels', 'Homestays', 'Luxury', '5-Star Hotels', 'Resorts'],
    required: false 
  },
  mealsPreferences: { 
    type: String, 
    enum: ['None', 'All-Inclusive', 'Self-Catering'],
    required: false 
  },
  dietaryPreferences: { 
    type: String, 
    enum: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free'],
    required: false 
  },
  customDietaryPreference: String,
  transportationType: { 
    type: String, 
    enum: ['None', 'Flights', 'Private Car/Van', 'Buses'],
    required: false 
  },
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
  declineMessage: { type: String },
  // User-related fields
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signup',
    required: true
  },
  userName: { 
    type: String, 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userAddress: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster queries
PlanTripSchema.index({ userId: 1 });
PlanTripSchema.index({ tripName: 1, userId: 1 }, { unique: true });

const PlanTrip = mongoose.model('PlanTrip', PlanTripSchema);
export default PlanTrip;
