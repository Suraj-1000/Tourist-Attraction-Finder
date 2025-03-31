import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  day: String,
  mode: String,
  highlights: String,
  stay: String,
  meals: String,
  costBreakdown: String,
});

const packageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: String,
  highlight: String,
  address: String,
  reviews: String,
  tripType: String,
  startDate: Date,
  endDate: Date,
  duration: String,
  category: String,
  price: String,
  groupSize: String,
  difficulty: String,
  overview: String,
  itinerary: [itinerarySchema],
  included: String,
  additionalInfo: String, 
  operator: String,
  ageRestriction: String,
  pickupDetails: String,
  accessibility: String,
  cancellationPolicy: String,
}, { timestamps: true });

const Package = mongoose.model('Package', packageSchema);
export default Package;
