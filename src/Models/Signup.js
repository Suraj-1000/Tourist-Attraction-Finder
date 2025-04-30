import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    match: /^(98|97)\d{8}$/,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Others"],
    default: null,
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  image: {
    type: String, 
    default: null,  
  },

  address: {
    type: String,
    trim: true,
    default: '',
  },

  termsAccepted: {
    type: Boolean,
    default: false,
  },
  
  role: {
    type: String,
    enum: ['admin', 'user', 'guide'],
    default: 'user',
  },
  
  // Guide specific fields
  guideProfile: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verificationDate: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Signup',
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    languages: [{
      type: String,
      trim: true
    }],
    licenseNumber: {
      type: String,
      default: null
    },
    licenseDocument: {
      type: {
        preview: String,
        name: String,
        url: String
      },
      default: null
    },
    educationCertificates: [{
      type: {
        preview: String,
        name: String,
        url: String
      }
    }],
    regionsOfExpertise: [{
      type: String,
      trim: true
    }],
    serviceTypes: [{
      type: String,
      enum: ['Trekking', 'Cultural Tour', 'City Tour', 'Wildlife Safari']
    }],
    availability: [{
      date: Date,
      slots: [{
        startTime: String,
        endTime: String,
        isBooked: {
          type: Boolean,
          default: false
        }
      }]
    }],
    pricing: {
      perDay: {
        type: Number,
        default: 0
      },
      packages: [{
        name: String,
        duration: String,
        price: Number,
        description: String
      }]
    },
    ratings: {
      average: {
        type: Number,
        default: 0
      },
      total: {
        type: Number,
        default: 0
      }
    },
    reviews: [{
      touristId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Signup'
      },
      rating: Number,
      comment: String,
      date: {
        type: Date,
        default: Date.now
      },
      reply: {
        type: String,
        default: null
      }
    }]
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },  
  resetCode: {
    type: String,
    default: null,
  },
  resetCodeExpires: {
    type: Date,
    default: null,
  },
  logoutTime: {
    type: Date,
    default: null,
  },
  eventPreferences: {
    type: [String],
    default: ['None'],
    enum: ['None', 'Cultural', 'Festival', 'Sports', 'Music', 'Food', 'Religious']
  }
});

const Signup = mongoose.model('Signup', signupSchema);

export default Signup;
