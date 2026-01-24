import mongoose from 'mongoose';

const attractionSchema = new mongoose.Schema({
  name: String,
  image: String,
  rating: Number,
  address: String,
  numberOfReviews: Number,
  description: String,
  category: String,
  subcategories: [String], 
  subtype: [String],
  phone: String,
  email: String,
  website: String,
  latitude: Number,
  longitude: Number,
  photos: [String], 
  rankingString: String,
});

const Attraction = mongoose.model('Attraction', attractionSchema);

export default Attraction;
