import express from 'express';
import Package from '../Models/Package.js';
import Event from '../Models/Event.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all reviews or filter by itemType
router.get('/all', async (req, res) => {
  try {
    const { itemType } = req.query;
    let reviews = [];

    // Function to extract reviews from items
    const extractReviews = (items, modelType) => {
      return items.reduce((acc, item) => {
        if (item.reviews && item.reviews.length > 0) {
          const validReviews = item.reviews
            .filter(review => 
              // Only include reviews that have both rating and userId
              review.rating && 
              review.userId && 
              review.userId.firstName && 
              review.userId.lastName
            )
            .map(review => ({
              ...review.toObject(),
              itemType: modelType,
              itemName: item.title || item.name,
              itemId: item._id
            }));
          return [...acc, ...validReviews];
        }
        return acc;
      }, []);
    };

    if (!itemType || itemType === 'all') {
      // Fetch reviews from both packages and events
      const [packages, events] = await Promise.all([
        Package.find().populate('reviews.userId', 'firstName lastName email'),
        Event.find().populate('reviews.userId', 'firstName lastName email')
      ]);

      const packageReviews = extractReviews(packages, 'package');
      const eventReviews = extractReviews(events, 'event');
      reviews = [...packageReviews, ...eventReviews];
    } else if (itemType === 'package') {
      const packages = await Package.find().populate('reviews.userId', 'firstName lastName email');
      reviews = extractReviews(packages, 'package');
    } else if (itemType === 'event') {
      const events = await Event.find().populate('reviews.userId', 'firstName lastName email');
      reviews = extractReviews(events, 'event');
    }

    // Sort reviews by date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      reviews: reviews.map(review => ({
        _id: review._id,
        userId: review.userId._id,
        userName: `${review.userId.firstName} ${review.userId.lastName}`,
        userEmail: review.userId.email,
        rating: review.rating,
        review: review.review,
        itemType: review.itemType,
        itemName: review.itemName,
        itemId: review.itemId,
        bookingId: review.bookingId,
        bookingDetails: review.bookingDetails,
        createdAt: review.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// Get reviews for a specific item
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { itemType } = req.query;

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID'
      });
    }

    let item;
    if (itemType === 'package') {
      item = await Package.findById(itemId)
        .populate({
          path: 'reviews.userId',
          select: 'firstName lastName email'
        });
    } else if (itemType === 'event') {
      item = await Event.findById(itemId)
        .populate({
          path: 'reviews.userId',
          select: 'firstName lastName email'
        });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type'
      });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Filter out anonymous reviews and calculate statistics
    const validReviews = item.reviews.filter(review => 
      review.rating && 
      review.userId && 
      review.userId.firstName && 
      review.userId.lastName
    );

    const totalReviews = validReviews.length;
    const averageRating = totalReviews > 0
      ? validReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Transform reviews to include full user information
    const transformedReviews = validReviews.map(review => {
      const reviewObj = review.toObject();
      return {
        ...reviewObj,
        userFullName: reviewObj.userId ? `${reviewObj.userId.firstName} ${reviewObj.userId.lastName}` : 'Anonymous',
        userEmail: reviewObj.userId ? reviewObj.userId.email : null
      };
    });

    res.json({
      success: true,
      stats: {
        totalReviews,
        averageRating
      },
      reviews: transformedReviews
    });
  } catch (error) {
    console.error('Error fetching item reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching item reviews',
      error: error.message
    });
  }
});

// Submit a review for a package or event
router.post('/submit', async (req, res) => {
  try {
    console.log('Received review submission:', req.body);
    const { itemType, itemName, userId, rating, review, bookingId, bookingDetails } = req.body;

    // Detailed validation
    const validationErrors = [];
    
    if (!itemType) validationErrors.push('Item type is required');
    if (!itemName) validationErrors.push('Item name is required');
    if (!userId) validationErrors.push('User ID is required');
    if (!rating) validationErrors.push('Rating is required');
    if (!review) validationErrors.push('Review text is required');

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Additional validation
    if (!['package', 'event'].includes(itemType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type. Must be either "package" or "event"'
      });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 5'
      });
    }

    if (typeof review !== 'string' || review.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Review text cannot be empty'
      });
    }

    const reviewData = {
      userId,
      rating: Number(rating),
      review: review.trim(),
      createdAt: new Date(),
      bookingId,
      bookingDetails: {
        category: bookingDetails?.category || '',
        duration: bookingDetails?.duration || '',
        amount: bookingDetails?.amount || 0,
        status: bookingDetails?.status || ''
      }
    };

    let result;
    let Model = itemType === 'package' ? Package : Event;
    let searchField = itemType === 'package' ? 'title' : 'name';

    // Log the search criteria
    console.log('Searching for:', {
      type: itemType,
      searchField,
      itemName,
      searchPattern: new RegExp('^' + itemName + '$', 'i')
    });

    // Find and update the item
    result = await Model.findOneAndUpdate(
      { [searchField]: { $regex: new RegExp('^' + itemName + '$', 'i') } },
      { 
        $push: { reviews: reviewData },
        $inc: { totalReviews: 1 }
      },
      { new: true }
    );

    if (!result) {
      console.log(`${itemType} not found with name:`, itemName);
      return res.status(404).json({ 
        success: false, 
        message: `${itemType} not found with name: ${itemName}` 
      });
    }

    // Calculate and update average rating
    const totalRating = result.reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = totalRating / result.reviews.length;
    await Model.findByIdAndUpdate(result._id, { averageRating });

    console.log('Review submitted successfully for:', itemName);
    res.json({ 
      success: true, 
      message: 'Review submitted successfully',
      review: {
        ...reviewData,
        itemType,
        itemName,
        averageRating
      }
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error submitting review',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add delete review route
router.delete('/:reviewId', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { itemType, itemId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID'
      });
    }

    let Model = itemType === 'package' ? Package : Event;
    let item;

    if (itemType === 'package') {
      item = await Package.findOne({ 'reviews._id': reviewId });
    } else if (itemType === 'event') {
      item = await Event.findOne({ 'reviews._id': reviewId });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type'
      });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Remove the review from the reviews array
    item.reviews = item.reviews.filter(review => review._id.toString() !== reviewId);

    // Recalculate average rating
    if (item.reviews.length > 0) {
      const totalRating = item.reviews.reduce((sum, review) => sum + review.rating, 0);
      item.averageRating = totalRating / item.reviews.length;
    } else {
      item.averageRating = 0;
    }

    item.totalReviews = item.reviews.length;

    // Save the updated item
    await item.save();

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

export default router; 