import mongoose from 'mongoose';

const userFavoritesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signup',
    required: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['attraction', 'package', 'event', 'trip']
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  itemDetails: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient querying
userFavoritesSchema.index({ userId: 1, itemType: 1 });

const UserFavorites = mongoose.model('UserFavorites', userFavoritesSchema);
export default UserFavorites; 
