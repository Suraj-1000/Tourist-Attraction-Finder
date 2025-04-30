import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signup' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Cultural', 'Festival', 'Sports', 'Music', 'Food', 'Religious']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  locationDetails: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    formattedAddress: {
      type: String,
      required: true
    }
  },
  image: {
    type: String,
    default: '/images/default-event.png'
  },
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  ticketPrice: {
    vip: {
      type: Number,
      required: true,
      min: [0, 'VIP ticket price cannot be negative'],
      set: v => Math.round(v * 100) / 100 // Round to 2 decimal places
    },
    general: {
      type: Number,
      required: true,
      min: [0, 'General ticket price cannot be negative'],
      set: v => Math.round(v * 100) / 100 // Round to 2 decimal places
    }
  },
  capacity: {
    vip: {
      type: Number,
      required: true,
      min: [0, 'VIP capacity cannot be negative'],
      set: v => Math.floor(v) // Ensure whole numbers for capacity
    },
    general: {
      type: Number,
      required: true,
      min: [0, 'General capacity cannot be negative'],
      set: v => Math.floor(v) // Ensure whole numbers for capacity
    }
  },
  organizer: {
    type: String,
    required: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredStars: [{
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    }
  }],
  highlights: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  schedule: [{
    day: {
      type: String,
      required: true,
      default: "Day 1"
    },
    time: {
      type: String,
      required: true
    },
    activity: {
      type: String,
      required: true
    }
  }],
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'past'],
    default: 'upcoming'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the status based on dates
eventSchema.pre('save', function(next) {
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'ongoing';
  } else {
    this.status = 'past';
  }
  this.updatedAt = now;
  next();
});

// Middleware to update averageRating and totalReviews when a review is added
eventSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }
  next();
});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

export default Event;