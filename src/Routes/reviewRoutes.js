import express from 'express';
import Package from '../Models/Package.js';
import Event from '../Models/Event.js';
import mongoose from 'mongoose';
import Signup from '../Models/Signup.js';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../config/auth.js';

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

// Add guide review
router.post('/guide', async (req, res) => {
  try {
    const { itemId, guideName, userId, rating, review, bookingId, bookingDetails } = req.body;
    
    // Validate required fields
    if (!itemId || !userId || !rating || !review) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if the guide exists
    const guide = await Signup.findById(itemId);
    if (!guide || guide.role !== 'guide') {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }
    
    // Check if user exists
    const user = await Signup.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if the user has already reviewed this guide
    const hasReviewed = guide.guideProfile.reviews.some(
      existingReview => String(existingReview.touristId) === String(userId)
    );
    
    if (hasReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this guide'
      });
    }
    
    // Create the review data with proper field mapping
    // Note: frontend sends 'review' but model expects 'comment'
    const reviewData = {
      touristId: userId,
      rating: Number(rating),
      comment: review.trim(), // Map 'review' to 'comment'
      date: new Date(),
      reply: null
    };
    
    // Calculate the new average rating
    const currentReviews = guide.guideProfile.reviews || [];
    const currentTotalRating = guide.guideProfile.ratings.average * currentReviews.length;
    const newTotalRating = currentTotalRating + rating;
    const newAverage = newTotalRating / (currentReviews.length + 1);
    
    // Update the guide's profile with the new review
    await Signup.findByIdAndUpdate(
      itemId,
      {
        $push: { 'guideProfile.reviews': reviewData },
        $set: {
          'guideProfile.ratings.average': newAverage,
          'guideProfile.ratings.total': currentReviews.length + 1
        }
      },
      { new: true }
    );
    
    // If bookingId is provided, mark the booking as having a guide review
    if (bookingId) {
      try {
        // Import the PurchasedItem model dynamically
        const PurchasedItem = (await import('../Models/purchasedItemModel.js')).default;
        
        // Update the booking to set hasGuideReview flag
        await PurchasedItem.findByIdAndUpdate(
          bookingId,
          { 
            $set: { 
              hasGuideReview: true,
              guideReview: {
                rating: Number(rating),
                review: review.trim(),
                createdAt: new Date()
              }
            } 
          }
        );
        
        console.log(`Updated booking ${bookingId} with guide review`);
      } catch (updateError) {
        // Log the error but don't fail the request
        console.error('Error updating booking with guide review:', updateError);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Guide review submitted successfully',
      review: reviewData
    });
    
  } catch (error) {
    console.error('Error submitting guide review:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit guide review',
      error: error.message
    });
  }
});

// Guide reply to a review
router.post('/guide/reply/:reviewId', verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    
    console.log('User from middleware:', req.user ? req.user._id : 'No user');
    console.log('UserId from middleware:', req.userId);
    
    // VerifyToken middleware already authenticated the user
    // Use either req.userId (set by our modified middleware) or req.user._id
    const guideId = req.userId || (req.user ? req.user._id : null);
    
    if (!guideId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token'
      });
    }
    
    if (!reply || typeof reply !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Reply text is required' 
      });
    }

    // Find the guide
    const guide = await Signup.findOne({
      _id: guideId,
      role: 'guide'
    });

    if (!guide) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only guides can reply to reviews' 
      });
    }

    // Find the review in the guide's profile
    const reviewIndex = guide.guideProfile.reviews.findIndex(
      review => review._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }

    // Update the review with the reply
    guide.guideProfile.reviews[reviewIndex].reply = reply;
    await guide.save();

    res.status(200).json({
      success: true,
      message: 'Reply added successfully',
      review: guide.guideProfile.reviews[reviewIndex]
    });
  } catch (error) {
    console.error('Error adding reply to review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router; 