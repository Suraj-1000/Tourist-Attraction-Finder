import { initializeKhaltiPayment, verifyKhaltiPayment } from "../config/khalti.js";
import Payment from "../Models/paymentModel.js";
import PurchasedItem from "../Models/purchasedItemModel.js";
import Signup from "../Models/Signup.js";
import express from "express";
import mongoose from "mongoose";
const router = express.Router();

// Route to initialize Khalti payment
router.post("/initialize-khalti", async (req, res) => {
  try {
    const { 
      itemId, 
      totalPrice, 
      website_url, 
      packageDetails, 
      firstName, 
      lastName, 
      email, 
      phone, 
      address,
      userId
    } = req.body;

    console.log('Received Khalti initialization request:', { 
      itemId, 
      totalPrice, 
      website_url, 
      packageDetails,
      firstName,
      lastName,
      email,
      phone,
      address,
      userId
    });

    // For detailed debugging, log ALL package details fields
    console.log('Package details received (all fields):', {
      title: packageDetails?.title,
      duration: packageDetails?.duration,
      category: packageDetails?.category,
      price: totalPrice,
      startDate: packageDetails?.startDate,
      endDate: packageDetails?.endDate,
      address: packageDetails?.address,
      destinations: packageDetails?.destinations
    });

    // Validate input
    if (!itemId || !totalPrice || !userId) {
      console.error('Missing required fields:', { itemId, totalPrice, userId });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: itemId, totalPrice, and userId are required"
      });
    }

    // Convert price to number and validate
    const priceInNPR = Number(totalPrice);
    if (isNaN(priceInNPR) || priceInNPR <= 0) {
      console.error('Invalid price:', { priceInNPR, originalPrice: totalPrice });
      return res.status(400).json({
        success: false,
        message: "Invalid price amount"
      });
    }

    // Convert NPR to paisa for Khalti
    const priceInPaisa = priceInNPR * 100;

    // Format packageDetails for storage
    const formattedPackageDetails = {
      _id: packageDetails._id ? new mongoose.Types.ObjectId(packageDetails._id) : new mongoose.Types.ObjectId(),
      title: packageDetails?.title,
      duration: packageDetails?.duration,
      category: packageDetails?.category,
      price: priceInNPR,
      startTime: packageDetails?.startTime,
      endTime: packageDetails?.endTime,
      location: packageDetails?.location,
      startDate: packageDetails?.startDate,
      endDate: packageDetails?.endDate,
      address: packageDetails?.address,
      destinations: packageDetails?.destinations
    };
    
    console.log("Formatted package details for storage:", formattedPackageDetails);

    // Create a purchase record with original NPR amount
    const purchasedItemData = await PurchasedItem.create({
      userId,
      item: itemId,
      type: packageDetails.isEvent ? 'event' : 'package',
      packageId: packageDetails.isEvent ? null : new mongoose.Types.ObjectId(packageDetails._id),
      eventId: packageDetails.isEvent ? new mongoose.Types.ObjectId(packageDetails._id) : null,
      paymentMethod: "khalti",
      totalPrice: priceInNPR,
      packageDetails: formattedPackageDetails,
      userDetails: {
        firstName,
        lastName,
        email,
        phone,
        address
      },
      ticketDetails: packageDetails?.ticketDetails || {
        vipTickets: {
          quantity: 0,
          pricePerTicket: 0,
          totalPrice: 0
        },
        generalTickets: {
          quantity: 0,
          pricePerTicket: 0,
          totalPrice: 0
        },
        totalTickets: 0,
        totalTicketPrice: 0
      }
    });

    console.log("Purchase record created:", purchasedItemData);

    // Check if the destinations field was properly saved
    if (formattedPackageDetails.destinations && !purchasedItemData.packageDetails.destinations) {
      console.warn("WARNING: 'destinations' field was not properly saved to the database!");
      console.log("Expected destinations:", formattedPackageDetails.destinations);
      console.log("Actual saved packageDetails:", purchasedItemData.packageDetails);
    }

    try {
      // Initialize payment with Khalti using paisa
      const paymentDetails = {
        amount: priceInPaisa,
        purchase_order_id: purchasedItemData._id.toString(),
        purchase_order_name: packageDetails?.title || "Package Booking",
        return_url: `${process.env.BACKEND_URI}/khalti/complete-khalti-payment`,
        website_url: website_url || process.env.FRONTEND_URI || "http://localhost:3000",
        customer_info: {
          name: `${firstName} ${lastName}`,
          email: email,
          phone: phone
        }
      };

      console.log("Initializing Khalti payment with details:", paymentDetails);

      const paymentInitiate = await initializeKhaltiPayment(paymentDetails);

      if (!paymentInitiate || !paymentInitiate.payment_url) {
        throw new Error('Failed to get payment URL from Khalti');
      }

      res.json({
        success: true,
        purchasedItemData,
        payment: paymentInitiate,
      });
    } catch (error) {
      console.error('Khalti payment initialization error:', error);
      // Delete the purchase record if payment initialization fails
      await PurchasedItem.findByIdAndDelete(purchasedItemData._id);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to initialize payment",
        error: error.message
      });
    }
  } catch (error) {
    console.error('Khalti initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize payment",
      error: error.message
    });
  }
});

// Route to handle payment completion
router.get("/complete-khalti-payment", async (req, res) => {
  const {
    pidx,
    txnId,
    amount,
    mobile,
    purchase_order_id,
    purchase_order_name,
    transaction_id,
    status
  } = req.query;

  try {
    console.log("Received Khalti payment completion callback:", req.query);

    // Verify payment with Khalti
    const paymentInfo = await verifyKhaltiPayment(pidx);

    // Convert amount from paisa to NPR for comparison
    const amountInNPR = Number(amount) / 100;

    // Check if payment is completed and details match
    if (
      paymentInfo?.status !== "Completed" ||
      paymentInfo.transaction_id !== transaction_id ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      console.error("Payment verification failed:", {
        paymentInfo,
        amountInNPR,
        originalAmount: amount
      });
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
        paymentInfo,
      });
    }

    // Find the purchased item
    const purchasedItemData = await PurchasedItem.findById(purchase_order_id);
    if (!purchasedItemData) {
      console.error("Purchase record not found:", purchase_order_id);
      return res.status(400).json({
        success: false,
        message: "Purchase record not found",
      });
    }

    // Update purchase record status
    await PurchasedItem.findByIdAndUpdate(
      purchase_order_id,
      { $set: { status: "completed" } }
    );

    // Create payment record with NPR amount
    const paymentData = await Payment.create({
      pidx,
      transactionId: transaction_id,
      productId: purchase_order_id,
      amount: amountInNPR, // Store amount in NPR
      dataFromVerificationReq: {
        ...paymentInfo,
        amountInNPR: Number(paymentInfo.total_amount) / 100 // Add NPR amount for reference
      },
      apiQueryFromUser: {
        ...req.query,
        amountInNPR // Add NPR amount for reference
      },
      paymentGateway: "khalti",
      status: "success",
    });

    console.log("Payment record created:", paymentData);

    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_URI}/payment-success?transaction_id=${transaction_id}`);
  } catch (error) {
    console.error("Error processing Khalti payment completion:", error);
    res.redirect(`${process.env.FRONTEND_URI}/payment-failure?error=${encodeURIComponent(error.message)}`);
  }
});

// Route to get user-specific bookings
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

    // Find all purchased items for this user using both userId and email
    const purchasedItems = await PurchasedItem.find({
      $or: [
        { 'userDetails.email': user.email },
        { userId: userId }
      ]
    }).sort({ purchaseDate: -1 });

    // Get payment details for each purchased item
    const bookings = await Promise.all(
      purchasedItems.map(async (item) => {
        const payment = await Payment.findOne({ productId: item._id });
        return {
          ...item.toObject(),
          paymentDetails: payment ? payment.toObject() : null,
          userDetails: {
            ...item.userDetails,
            userId: userId // Include userId in the response
          }
        };
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

export default router;