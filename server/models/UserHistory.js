import mongoose from 'mongoose';

const userHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signup',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'viewed details',
      'shared',
      'copied link of',
      'booked',
      'added to favorites',
      'removed from favorites',
      'searched',
      'filtered category'
    ]
  },
  itemType: {
    type: String,
    required: true,
    enum: ['attraction', 'package', 'event', 'trip']
  },
  itemId: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for efficient querying
userHistorySchema.index({ userId: 1, timestamp: -1 });

// Add TTL index to automatically delete old records after 30 days
userHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const UserHistory = mongoose.model('UserHistory', userHistorySchema);
export default UserHistory; 
