import mongoose from 'mongoose';

const userEmergencyContactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signup',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  relationship: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  address: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    required: false
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

// Create index for efficient querying
userEmergencyContactSchema.index({ userId: 1 });

const UserEmergencyContact = mongoose.model('UserEmergencyContact', userEmergencyContactSchema);
export default UserEmergencyContact; 