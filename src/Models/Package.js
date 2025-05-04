import mongoose from 'mongoose';

const itinerarySchema = new mongoose.Schema({
  day: String,
  mode: String,
  highlights: String,
  stay: String,
  meals: String,
  costBreakdown: String,
});

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signup' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  bookingId: String,
  bookingDetails: {
    category: String,
    duration: String,
    amount: Number,
    status: String
  }
});

const packageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: String,
  highlight: String,
  address: String,
  locationDetails: {
    latitude: Number,
    longitude: Number,
    formattedAddress: String
  },
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
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
  guideIncluded: { type: Boolean, default: false },
  guideId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signup',
    required: function() {
      return this.guideIncluded === true;
    }
  },
  guideCost: { 
    type: Number,
    default: 0
  },
}, { timestamps: true });

// Middleware to update averageRating and totalReviews when a review is added
packageSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
  }
  next();
});

// Static method to fix packages with invalid reviews field
packageSchema.statics.fixInvalidReviews = async function() {
  try {
    // Find all packages where reviews is a string or not an array
    const packages = await this.find({
      $or: [
        { reviews: { $type: "string" } },
        { reviews: { $exists: true, $not: { $type: "array" } } }
      ]
    });

    if (packages.length > 0) {
      console.log(`Fixing ${packages.length} package reviews...`);
    }

    for (const pkg of packages) {
      // Update using findByIdAndUpdate to avoid version key issues
      await this.findByIdAndUpdate(
        pkg._id,
        {
          $set: {
            reviews: [],
            averageRating: 0,
            totalReviews: 0,
            __v: 0
          }
        },
        { new: true, upsert: false }
      );
    }

    return { success: true, fixed: packages.length };
  } catch (error) {
    console.error('Error fixing package reviews:', error);
    throw error;
  }
};

const Package = mongoose.model('Package', packageSchema);
export default Package;
