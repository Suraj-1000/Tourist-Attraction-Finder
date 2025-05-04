import express from "express";
import Payment from "../Models/paymentModel.js";
import PurchasedItem from "../Models/purchasedItemModel.js";
import Signup from "../Models/Signup.js";
import Package from "../Models/Package.js";
import PlanTrip from "../Models/PlanTrip.js";

const router = express.Router();

// Get user-specific bookings
router.get("/user-bookings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await Signup.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Find all purchased items for this user using userId
    const purchasedItems = await PurchasedItem.find({
      userId: userId  // Only filter by userId to ensure strict matching
    }).sort({ purchaseDate: -1 });

    // Get payment details for each purchased item
    const bookings = await Promise.all(
      purchasedItems.map(async (item) => {
        const payment = await Payment.findOne({ productId: item._id });
        
        // Format user's full name
        const fullName = `${item.userDetails.firstName} ${item.userDetails.lastName}`;
        
        // Capitalize the first letter of status
        const formattedStatus = item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase();
        
        // Fetch guide info from Package or Trip
        let guideId = null;
        let guideIncluded = false;
        let tripGuideDetails = null;
        let locationDetails = null;
        
        // Try to fetch the package data to get location details
        if (item.packageDetails) {
          try {
            if (item.packageDetails.packageId) {
              const packageData = await Package.findById(item.packageDetails.packageId);
              if (packageData && packageData.locationDetails) {
                locationDetails = packageData.locationDetails;
                // Also use this as a source for guide data if we don't have it yet
                if (!guideId && locationDetails.guideId) {
                  guideId = locationDetails.guideId;
                  guideIncluded = locationDetails.guideIncluded || false;
                  console.log(`[USER BOOKINGS] Found guide in locationDetails: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                }
              }
            } else if (item.packageDetails._id) {
              const packageData = await Package.findById(item.packageDetails._id);
              if (packageData && packageData.locationDetails) {
                locationDetails = packageData.locationDetails;
                // Also use this as a source for guide data if we don't have it yet
                if (!guideId && locationDetails.guideId) {
                  guideId = locationDetails.guideId;
                  guideIncluded = locationDetails.guideIncluded || false;
                  console.log(`[USER BOOKINGS] Found guide in locationDetails: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                }
              }
            }
          } catch (err) {
            console.log(`[USER BOOKINGS] Error getting location details: ${err.message}`);
          }
        }
        
        // Check if we have packageId or tripId in the booking packageDetails
        if (item.packageDetails) {
          const packageDetails = item.packageDetails;
          console.log(`[USER BOOKINGS] Processing booking ${item._id} for ${packageDetails.title}`);
          
          // Check if this is a trip (based on category)
          const category = (packageDetails.category || '').toLowerCase();
          const isTrip = category.includes('short trip') || category.includes('long trip');
          
          if (isTrip) {
            console.log(`[USER BOOKINGS] 🔍 TRIP BOOKING DETECTED: ${packageDetails.title}`);
            
            // For trips, search in the following order:
            // 1. Direct tripId in packageDetails
            if (packageDetails.tripId) {
              try {
                console.log(`[USER BOOKINGS] Looking up trip guide data for tripId: ${packageDetails.tripId}`);
                const tripData = await PlanTrip.findById(packageDetails.tripId);
                if (tripData) {
                  guideId = tripData.guideId;
                  guideIncluded = tripData.guideIncluded;
                  tripGuideDetails = {
                    guideName: tripData.guideName,
                    guideEmail: tripData.guideEmail
                  };
                  console.log(`[USER BOOKINGS] Found trip guide data: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                } else {
                  console.log(`[USER BOOKINGS] Trip not found for ID: ${packageDetails.tripId}`);
                }
              } catch (err) {
                console.log(`[USER BOOKINGS] Error fetching trip guide data: ${err.message}`);
              }
            } 
            // 2. Check if _id is a trip ID
            else if (packageDetails._id) {
              try {
                console.log(`[USER BOOKINGS] Attempting to use _id as tripId: ${packageDetails._id}`);
                const tripData = await PlanTrip.findById(packageDetails._id);
                if (tripData) {
                  guideId = tripData.guideId;
                  guideIncluded = tripData.guideIncluded;
                  tripGuideDetails = {
                    guideName: tripData.guideName,
                    guideEmail: tripData.guideEmail
                  };
                  console.log(`[USER BOOKINGS] Found trip guide data from _id: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                }
              } catch (err) {
                console.log(`[USER BOOKINGS] Error using _id as tripId: ${err.message}`);
              }
            }
            // 3. Check 'item' field
            if (!guideId && item.item) {
              try {
                console.log(`[USER BOOKINGS] Attempting to use 'item' field as tripId: ${item.item}`);
                const tripData = await PlanTrip.findById(item.item);
                if (tripData) {
                  guideId = tripData.guideId;
                  guideIncluded = tripData.guideIncluded;
                  tripGuideDetails = {
                    guideName: tripData.guideName,
                    guideEmail: tripData.guideEmail
                  };
                  console.log(`[USER BOOKINGS] Found trip guide data from item field: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                }
              } catch (err) {
                console.log(`[USER BOOKINGS] Error using 'item' field for trip lookup: ${err.message}`);
              }
            }
            
            // 4. Last resort: if we have a trip title, try to find it by name
            if (!guideId && packageDetails.title) {
              try {
                console.log(`[USER BOOKINGS] Attempting to find trip by title: ${packageDetails.title}`);
                const tripData = await PlanTrip.findOne({ tripName: packageDetails.title });
                if (tripData) {
                  guideId = tripData.guideId;
                  guideIncluded = tripData.guideIncluded;
                  tripGuideDetails = {
                    guideName: tripData.guideName,
                    guideEmail: tripData.guideEmail
                  };
                  console.log(`[USER BOOKINGS] Found trip by title match: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                }
              } catch (err) {
                console.log(`[USER BOOKINGS] Error finding trip by title: ${err.message}`);
              }
            }
          } 
          // If not a trip, check for package
          else if (packageDetails.packageId) {
            try {
              console.log(`[USER BOOKINGS] Looking up package guide data for packageId: ${packageDetails.packageId}`);
              const packageData = await Package.findById(packageDetails.packageId);
              if (packageData) {
                guideId = packageData.guideId;
                guideIncluded = packageData.guideIncluded;
                console.log(`[USER BOOKINGS] Found package guide data: guideId=${guideId}, guideIncluded=${guideIncluded}`);
              } else {
                console.log(`[USER BOOKINGS] Package not found for ID: ${packageDetails.packageId}`);
              }
            } catch (err) {
              console.log(`[USER BOOKINGS] Error fetching package guide data: ${err.message}`);
            }
          } 
          // Final fallback for item field if not checked above
          else if (!guideId && item.item) {
            try {
              console.log(`[USER BOOKINGS] Attempting to use 'item' field as packageId: ${item.item}`);
              // Try as a package
              const packageData = await Package.findById(item.item);
              if (packageData) {
                guideId = packageData.guideId;
                guideIncluded = packageData.guideIncluded;
                console.log(`[USER BOOKINGS] Found package guide data from item field: guideId=${guideId}, guideIncluded=${guideIncluded}`);
              }
            } catch (err) {
              console.log(`[USER BOOKINGS] Error using 'item' field for package lookup: ${err.message}`);
            }
          }
        }
        
        console.log(`[USER BOOKINGS] Final guide data for booking ${item._id}: guideId=${guideId}, guideIncluded=${guideIncluded}`);
        
        // Create the package details with location information
        const enhancedPackageDetails = {
          title: item.packageDetails.title,
          duration: item.packageDetails.duration,
          category: item.packageDetails.category,
          price: item.packageDetails.price,
          startTime: item.packageDetails.startTime,
          endTime: item.packageDetails.endTime,
          location: item.packageDetails.location,
          startDate: item.packageDetails.startDate,
          endDate: item.packageDetails.endDate,
          destinations: item.packageDetails.destinations
        };
        
        // Add locationDetails if available
        if (locationDetails) {
          enhancedPackageDetails.locationDetails = locationDetails;
        }
        
        const bookingData = {
          bookingId: item._id,
          packageName: item.packageDetails.title,
          bookingDate: item.purchaseDate,
          status: formattedStatus,
          amount: item.totalPrice,
          guideId: guideId,  // Add guide ID to the booking
          guideIncluded: guideIncluded,  // Add guide included flag
          tripGuideDetails: tripGuideDetails, // Add trip-specific guide details
          userDetails: {
            ...item.userDetails,
            userId: userId,  // Include userId in user details
            name: fullName
          },
          ticketDetails: item.ticketDetails,
          paymentDetails: payment ? {
            status: payment.status,
            paymentDate: payment.paymentDate,
            paymentGateway: item.paymentMethod,
            userDetails: {
              name: fullName,
              email: user.email,  // Use logged-in user's email
              phone: user.phone,  // Use logged-in user's phone
              address: user.address || user.userAddress || "N/A"  // Use logged-in user's address
            },
            packageDetails: enhancedPackageDetails
          } : null
        };
        
        console.log(`[USER BOOKINGS] Final booking data for ${item._id}:`, {
          guideId: bookingData.guideId,
          guideIncluded: bookingData.guideIncluded,
          hasGuideReview: bookingData.hasGuideReview,
          status: bookingData.status,
          paymentStatus: bookingData.paymentDetails?.status,
          hasLocationDetails: bookingData.paymentDetails?.packageDetails?.locationDetails ? true : false
        });
        
        return bookingData;
      })
    );

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user bookings",
      error: error.message
    });
  }
});

// Get all bookings with payment details
router.get("/all-bookings", async (req, res) => {
  try {
    // Find all purchased items
    const bookings = await PurchasedItem.find()
      .sort({ purchaseDate: -1 }); // Sort by purchase date in descending order

    if (!bookings) {
      return res.status(404).json({
        success: false,
        message: "No bookings found"
      });
    }

    // Get payment details for each booking
    const bookingsWithPayments = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await Payment.findOne({ productId: booking._id });
        
        // Format user's full name
        const fullName = `${booking.userDetails.firstName} ${booking.userDetails.lastName}`;
        
        // Capitalize the first letter of status
        const formattedStatus = booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase();
        
        // Fetch guide info from Package or Trip
        let guideId = null;
        let guideIncluded = false;
        let tripGuideDetails = null;
        
        // Check if we have packageId or tripId in the booking packageDetails
        if (booking.packageDetails) {
          const packageDetails = booking.packageDetails;
          console.log(`Processing booking ${booking._id} for ${packageDetails.title}`);
          
          // Check if this is a trip (based on category)
          const category = (packageDetails.category || '').toLowerCase();
          const isTrip = category.includes('short trip') || category.includes('long trip');
          
          if (isTrip) {
            console.log(`🔍 TRIP BOOKING DETECTED: ${packageDetails.title}`);
            
            // For trips, search in the following order:
            // 1. Direct tripId in packageDetails
            if (packageDetails.tripId) {
              try {
                console.log(`Looking up trip guide data for tripId: ${packageDetails.tripId}`);
                const tripData = await PlanTrip.findById(packageDetails.tripId);
                if (tripData) {
                  guideId = tripData.guideId;
                  guideIncluded = tripData.guideIncluded;
                  tripGuideDetails = {
                    guideName: tripData.guideName,
                    guideEmail: tripData.guideEmail
                  };
                  console.log(`Found trip guide data: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                } else {
                  console.log(`Trip not found for ID: ${packageDetails.tripId}`);
                }
              } catch (err) {
                console.log(`Error fetching trip guide data: ${err.message}`);
              }
            } 
            // 2. Check if _id is a trip ID
            else if (packageDetails._id) {
              try {
                console.log(`Attempting to use _id as tripId: ${packageDetails._id}`);
                const tripData = await PlanTrip.findById(packageDetails._id);
                if (tripData) {
                  guideId = tripData.guideId;
                  guideIncluded = tripData.guideIncluded;
                  tripGuideDetails = {
                    guideName: tripData.guideName,
                    guideEmail: tripData.guideEmail
                  };
                  console.log(`Found trip guide data from _id: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                }
              } catch (err) {
                console.log(`Error using _id as tripId: ${err.message}`);
              }
            }
            // 3. Check 'item' field
            if (!guideId && booking.item) {
              try {
                console.log(`Attempting to use 'item' field as tripId: ${booking.item}`);
                const tripData = await PlanTrip.findById(booking.item);
                if (tripData) {
                  guideId = tripData.guideId;
                  guideIncluded = tripData.guideIncluded;
                  tripGuideDetails = {
                    guideName: tripData.guideName,
                    guideEmail: tripData.guideEmail
                  };
                  console.log(`Found trip guide data from item field: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                }
              } catch (err) {
                console.log(`Error using 'item' field for trip lookup: ${err.message}`);
              }
            }
            
            // 4. Last resort: if we have a trip title, try to find it by name
            if (!guideId && packageDetails.title) {
              try {
                console.log(`Attempting to find trip by title: ${packageDetails.title}`);
                const tripData = await PlanTrip.findOne({ tripName: packageDetails.title });
                if (tripData) {
                  guideId = tripData.guideId;
                  guideIncluded = tripData.guideIncluded;
                  tripGuideDetails = {
                    guideName: tripData.guideName,
                    guideEmail: tripData.guideEmail
                  };
                  console.log(`Found trip by title match: guideId=${guideId}, guideIncluded=${guideIncluded}`);
                }
              } catch (err) {
                console.log(`Error finding trip by title: ${err.message}`);
              }
            }
            
            if (!guideId) {
              console.log(`⚠️ Failed to find guide information for trip: ${packageDetails.title}`);
            }
          } 
          // If not a trip, check for package
          else if (packageDetails.packageId) {
            try {
              console.log(`Looking up package guide data for packageId: ${packageDetails.packageId}`);
              const packageData = await Package.findById(packageDetails.packageId);
              if (packageData) {
                guideId = packageData.guideId;
                guideIncluded = packageData.guideIncluded;
                console.log(`Found package guide data: guideId=${guideId}, guideIncluded=${guideIncluded}`);
              } else {
                console.log(`Package not found for ID: ${packageDetails.packageId}`);
              }
            } catch (err) {
              console.log(`Error fetching package guide data: ${err.message}`);
            }
          } 
          // Final fallback for item field if not checked above
          else if (!guideId && booking.item) {
            try {
              console.log(`Attempting to use 'item' field as packageId: ${booking.item}`);
              // Try as a package
              const packageData = await Package.findById(booking.item);
              if (packageData) {
                guideId = packageData.guideId;
                guideIncluded = packageData.guideIncluded;
                console.log(`Found package guide data from item field: guideId=${guideId}, guideIncluded=${guideIncluded}`);
              }
            } catch (err) {
              console.log(`Error using 'item' field for package lookup: ${err.message}`);
            }
          }
        }
        
        // Log the final guide data
        console.log(`Final guide data for booking ${booking._id}: guideId=${guideId}, guideIncluded=${guideIncluded}`);
        
        // Log the item field for debugging
        if (booking.item) {
          console.log(`Item field for booking ${booking._id}: ${booking.item}`);
        } else {
          console.log(`No item field for booking ${booking._id}`);
        }
        
        return {
          bookingId: booking._id,
          packageName: booking.packageDetails.title,
          bookingDate: booking.purchaseDate,
          status: formattedStatus,
          amount: booking.totalPrice,
          guideId: guideId,  // Add guide ID to the booking
          guideIncluded: guideIncluded,  // Add guide included flag
          tripGuideDetails: tripGuideDetails, // Add trip-specific guide details
          userDetails: booking.userDetails, // Include direct user details
          ticketDetails: booking.ticketDetails, // Include ticket details
          paymentDetails: {
            status: payment ? payment.status : booking.status,
            paymentDate: payment ? payment.paymentDate : booking.purchaseDate,
            paymentGateway: booking.paymentMethod,
            userDetails: {
              name: fullName,
              email: booking.userDetails.email,
              phone: booking.userDetails.phone,
              address: booking.userDetails.address || "N/A"
            },
            packageDetails: {
              title: booking.packageDetails.title,
              duration: booking.packageDetails.duration,
              category: booking.packageDetails.category,
              price: booking.packageDetails.price,
              startTime: booking.packageDetails.startTime,
              endTime: booking.packageDetails.endTime,
              location: booking.packageDetails.location,
              startDate: booking.packageDetails.startDate,
              endDate: booking.packageDetails.endDate,
              destinations: booking.packageDetails.destinations
            }
          }
        };
      })
    );

    return res.status(200).json({
      success: true,
      bookings: bookingsWithPayments
    });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message
    });
  }
});

// Delete a booking
router.delete("/delete-booking/:id", async (req, res) => {
  try {
    const booking = await PurchasedItem.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Also delete associated payment if exists
    await Payment.findOneAndDelete({ productId: req.params.id });

    return res.status(200).json({
      success: true,
      message: "Booking deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting booking",
      error: error.message
    });
  }
});

// Update booking status
router.put("/update-status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    
    // Update PurchasedItem status
    const booking = await PurchasedItem.findByIdAndUpdate(
      req.params.id,
      { status: status.toLowerCase() },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Map booking status to payment status
    let paymentStatus;
    switch(status.toLowerCase()) {
      case 'completed':
        paymentStatus = 'success';
        break;
      case 'cancelled':
        paymentStatus = 'failed';
        break;
      case 'pending':
        paymentStatus = 'pending';
        break;
      default:
        paymentStatus = 'pending';
    }

    // Check for existing payment
    const existingPayment = await Payment.findOne({ productId: req.params.id });
    
    if (existingPayment) {
      // If payment exists, just update the status
      existingPayment.status = paymentStatus;
      await existingPayment.save();
    } else if (status.toLowerCase() === 'completed') {
      // Create new payment record for completed status if none exists
      const newPayment = new Payment({
        transactionId: `MANUAL-${Date.now()}`,
        pidx: `MANUAL-${Date.now()}`,
        productId: booking._id,
        amount: booking.totalPrice,
        dataFromVerificationReq: {
          pidx: `MANUAL-${Date.now()}`,
          total_amount: booking.totalPrice * 100, // Convert to paisa
          status: "Completed",
          transaction_id: `MANUAL-${Date.now()}`,
          fee: 0,
          refunded: false,
          amountInNPR: booking.totalPrice
        },
        apiQueryFromUser: {
          status: "Completed",
          t: "txn",
          idx: `MANUAL-${Date.now()}`,
          token: `MANUAL-${Date.now()}`,
          bank_reference: "None",
          amount: (booking.totalPrice * 100).toString(), // Convert to paisa
          mobile: booking.userDetails?.phone || "N/A",
          transaction_id: `MANUAL-${Date.now()}`,
          tidx: `MANUAL-${Date.now()}`,
          total_amount: (booking.totalPrice * 100).toString(),
          purchase_order_id: booking._id.toString(),
          purchase_order_name: booking.packageDetails?.title || "Package Booking",
          pidx: `MANUAL-${Date.now()}`,
          amountInNPR: booking.totalPrice,
          paymentGateway: booking.paymentMethod || "manual",
          status: "success"
        },
        paymentGateway: booking.paymentMethod || "manual",
        status: "success",
        paymentDate: new Date()
      });

      await newPayment.save();
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      booking
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message
    });
  }
});

// Create payment record for admin status updates (only for cancelled status)
router.post("/create-payment", async (req, res) => {
  try {
    const { productId, amount, paymentGateway, status, paymentDate } = req.body;

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ productId });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment record already exists"
      });
    }

    // Create new payment record only for failed status
    if (status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: "New payment records can only be created for failed status"
      });
    }

    // Create new payment record
    const payment = new Payment({
      productId,
      amount,
      paymentGateway,
      status,
      paymentDate,
      transactionId: `MANUAL-${Date.now()}`,
      pidx: `MANUAL-${Date.now()}`,
      dataFromVerificationReq: {},
      apiQueryFromUser: {}
    });

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment record created successfully",
      payment
    });
  } catch (error) {
    console.error("Error creating payment record:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payment record",
      error: error.message
    });
  }
});

export default router;