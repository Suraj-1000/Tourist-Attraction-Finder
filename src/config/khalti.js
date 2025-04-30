import axios from "axios";

// Function to verify Khalti Payment
async function verifyKhaltiPayment(pidx) {
  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const bodyContent = JSON.stringify({ pidx });

  const reqOptions = {
    url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/lookup/`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  try {
    const response = await axios.request(reqOptions);
    
    // Log the response for debugging
    console.log("Khalti verification response:", response.data);
    
    // Check payment status
    if (response.data.status !== "Completed") {
      throw new Error(`Payment status: ${response.data.status}`);
    }
    
    return response.data;
  } catch (error) {
    console.error("Error verifying Khalti payment:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to verify payment");
  }
}

// Function to initialize Khalti Payment
async function initializeKhaltiPayment(details) {
  // Validate required fields
  if (!details.amount || !details.purchase_order_id || !details.return_url) {
    throw new Error("Missing required fields for Khalti payment");
  }

  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  // Ensure amount is a number and in paisa
  const paymentDetails = {
    ...details,
    amount: Number(details.amount),
  };

  console.log("Initializing Khalti payment with details:", paymentDetails);

  const reqOptions = {
    url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/initiate/`,
    method: "POST",
    headers: headersList,
    data: paymentDetails,
  };

  try {
    const response = await axios.request(reqOptions);
    console.log("Khalti payment initialization response:", response.data);
    
    if (!response.data.pidx || !response.data.payment_url) {
      throw new Error("Invalid response from Khalti");
    }
    
    return response.data;
  } catch (error) {
    console.error("Error initializing Khalti payment:", error.response?.data || error.message);
    
    // Special handling for service unavailability
    if (error.response?.status === 503 || (error.message && error.message.includes("503"))) {
      throw new Error("Khalti payment service is temporarily unavailable. Please try again later or use a different payment method.");
    }
    
    throw new Error(error.response?.data?.message || "Failed to initialize payment. Please try another payment method.");
  }
}

export { verifyKhaltiPayment, initializeKhaltiPayment };