import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['trip-approval', 'trip-declined', 'package-added', 'package-updated', 'system']
  },
  message: {
    type: String,
    required: true
  },
  details: {
    // Common fields
    tripName: String,
    status: String,
    declineMessage: String,
    userEmail: String,
    subject: String,
    adminMessage: String,

    // Package specific fields
    title: String,
    category: String,
    duration: String,
    price: String,
    image: String,
    address: String,
    tripType: String,
    startDate: Date,
    endDate: Date,
    groupSize: String,
    difficulty: String,
    overview: String,
    highlight: String,
    included: String,
    additionalInfo: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signup',
    required: false
  },
  userEmail: {
    type: String,
    required: false
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['user', 'admin']
  }
}, {
  timestamps: true
});

// Index for faster queries
notificationSchema.index({ userEmail: 1 });
notificationSchema.index({ userId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ timestamp: -1 });
notificationSchema.index({ 'details.title': 1 }); // Index for package title searches
notificationSchema.index({ 'details.category': 1 }); // Index for package category searches
notificationSchema.index({ 'details.subject': 1 }); // Index for contact subject searches

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 