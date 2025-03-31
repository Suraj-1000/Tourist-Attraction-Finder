import { initializeKhaltiPayment, verifyKhaltiPayment } from "../config/khalti.js";
import Payment from "../Models/paymentModel.js";
import PurchasedItem from "../Models/purchasedItemModel.js";
import express from "express";
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
      address 
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
      address
    });

    // Validate input
    if (!itemId || !totalPrice) {
      console.error('Missing required fields:', { itemId, totalPrice });
      return res.status(400).json({
        success: false,
        message: "Missing required fields: itemId and totalPrice are required"
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

    // Create a purchase record with original NPR amount
    const purchasedItemData = await PurchasedItem.create({
      item: itemId,
      paymentMethod: "khalti",
      totalPrice: priceInNPR, // Store original price in NPR
      packageDetails: {
        title: packageDetails?.title,
        duration: packageDetails?.duration,
        category: packageDetails?.category,
        price: priceInNPR
      },
      userDetails: {
        firstName,
        lastName,
        email,
        phone,
        address
      }
    });

    console.log("Purchase record created:", purchasedItemData);

    // Initialize payment with Khalti using paisa
    const paymentDetails = {
      amount: priceInPaisa, // Send amount in paisa to Khalti
      purchase_order_id: purchasedItemData._id,
      purchase_order_name: packageDetails?.title || "Package Booking",
      return_url: `${process.env.BACKEND_URI}/khalti/complete-khalti-payment`,
      website_url: website_url || process.env.FRONTEND_URI || "http://localhost:3000",
      customer_info: {
        name: `${firstName} ${lastName}`,
        email: email,
        phone: phone
      }
    };

    console.log("Initializing Khalti payment with details:", {
      ...paymentDetails,
      amountInNPR: priceInNPR,
      amountInPaisa: priceInPaisa
    });

    const paymentInitiate = await initializeKhaltiPayment(paymentDetails);

    res.json({
      success: true,
      purchasedItemData,
      payment: paymentInitiate,
    });
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

export default router;