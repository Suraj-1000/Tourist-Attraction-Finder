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
    enum: ['admin', 'user'],
    default: 'user',
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
});

const Signup = mongoose.model('Signup', signupSchema);

export default Signup;
