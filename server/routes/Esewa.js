import express from "express";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../config/esewa.js";
import Payment from "../models/paymentModel.js";
import PurchasedItem from "../models/purchasedItemModel.js";
import Signup from "../models/Signup.js";
import mongoose from "mongoose";
const router = express.Router();

router.post("/initialize-esewa", async (req, res) => {
  try {
    const { 
      itemId, 
      totalPrice, 
      packageDetails,
      firstName,
      lastName,
      email,
      phone,
      address,
      userId
    } = req.body;

    console.log('Received eSewa initialization request:', { 
      itemId, 
      totalPrice, 
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
    const price = Number(totalPrice);
    if (isNaN(price) || price <= 0) {
      console.error('Invalid price:', { price, originalPrice: totalPrice });
      return res.status(400).json({
        success: false,
        message: "Invalid price amount"
      });
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !address) {
      console.error('Missing user details:', { firstName, lastName, email, phone, address });
      return res.status(400).json({
        success: false,
        message: "All user details are required"
      });
    }

    if (!packageDetails?.title || !packageDetails?.duration || !packageDetails?.category) {
      console.error('Missing package details:', packageDetails);
      return res.status(400).json({
        success: false,
        message: "All package details are required"
      });
    }

    console.log("Creating purchase record with:", { 
      itemId, 
      price, 
      userId,
      packageDetails: {
        title: packageDetails.title,
        destinations: packageDetails.destinations,
        address: packageDetails.address,
        startDate: packageDetails.startDate,
        endDate: packageDetails.endDate
      } 
    });
    
    // Format packageDetails for storage
    const formattedPackageDetails = {
      _id: packageDetails._id ? new mongoose.Types.ObjectId(packageDetails._id) : new mongoose.Types.ObjectId(),
      packageId: packageDetails.category === 'trip' ? null : packageDetails._id ? new mongoose.Types.ObjectId(packageDetails._id) : null,
      tripId: packageDetails.category === 'trip' ? packageDetails._id ? new mongoose.Types.ObjectId(packageDetails._id) : null : null,
      title: packageDetails.title,
      duration: packageDetails.duration,
      category: packageDetails.category,
      price: price,
      startTime: packageDetails?.startTime,
      endTime: packageDetails?.endTime,
      location: packageDetails?.location,
      startDate: packageDetails?.startDate,
      endDate: packageDetails?.endDate,
      address: packageDetails?.address,
      destinations: packageDetails?.destinations
    };
    
    console.log("Formatted package details for storage:", formattedPackageDetails);
    
    // Create a purchase record
    const purchasedItemData = await PurchasedItem.create({
      userId,
      item: itemId,
      type: packageDetails.isEvent ? 'event' : 'package',
      packageId: packageDetails.isEvent ? null : new mongoose.Types.ObjectId(packageDetails._id),
      eventId: packageDetails.isEvent ? new mongoose.Types.ObjectId(packageDetails._id) : null,
      paymentMethod: "esewa",
      totalPrice: price,
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

    // Generate payment hash
    const paymentHash = await getEsewaPaymentHash({
      amount: price,
      transaction_uuid: purchasedItemData._id.toString()
    });

    console.log("Generated payment hash:", paymentHash);

    // Create payment data for eSewa
    const paymentData = {
      ...paymentHash,
      amount: price.toString(),
      tax_amount: "0",
      total_amount: price.toString(),
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${process.env.BACKEND_URI}/esewa/complete-payment`,
      failure_url: `${process.env.FRONTEND_URI}/payment-failure`
    };

    // For sandbox environment, return the form data
    res.json({
      success: true,
      purchasedItemData,
      payment: paymentData,
      formAction: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      formData: {
        amount: paymentData.amount,
        tax_amount: paymentData.tax_amount,
        total_amount: paymentData.total_amount,
        transaction_uuid: paymentData.transaction_uuid,
        product_code: paymentData.product_code,
        product_service_charge: paymentData.product_service_charge,
        product_delivery_charge: paymentData.product_delivery_charge,
        success_url: paymentData.success_url,
        failure_url: paymentData.failure_url,
        signed_field_names: paymentData.signed_field_names,
        signature: paymentData.signature
      }
    });
  } catch (error) {
    console.error('eSewa initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to initialize payment",
      error: error.message
    });
  }
});

router.get("/complete-payment", async (req, res) => {
  const { data } = req.query; // Data received from eSewa's redirect

  try {
    console.log("Received eSewa payment completion callback:", req.query);

    // Verify payment with eSewa
    const paymentInfo = await verifyEsewaPayment(data);
    console.log("eSewa payment verification response:", paymentInfo);

    // Find the purchased item using the transaction UUID
    const purchasedItemData = await PurchasedItem.findById(
      paymentInfo.response.transaction_uuid
    );

    if (!purchasedItemData) {
      console.error("Purchase record not found:", paymentInfo.response.transaction_uuid);
      return res.redirect(`${process.env.FRONTEND_URI}/payment-failure?error=Purchase record not found`);
    }

    // Update purchase record status
    await PurchasedItem.findByIdAndUpdate(
      paymentInfo.response.transaction_uuid,
      { $set: { status: "completed" } }
    );

    // Create a new payment record
    const paymentData = await Payment.create({
      pidx: paymentInfo.decodedData.transaction_code,
      transactionId: paymentInfo.decodedData.transaction_code,
      productId: paymentInfo.response.transaction_uuid,
      amount: purchasedItemData.totalPrice,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: "esewa",
      status: "success",
    });

    console.log("Payment record created:", paymentData);

    // Redirect to success page with transaction details
    res.redirect(`${process.env.FRONTEND_URI}/payment-success?transaction_id=${paymentInfo.decodedData.transaction_code}&amount=${purchasedItemData.totalPrice}`);
  } catch (error) {
    console.error("Error processing eSewa payment completion:", error);
    res.redirect(`${process.env.FRONTEND_URI}/payment-failure?error=${encodeURIComponent(error.message)}`);
  }
});

export default router;
