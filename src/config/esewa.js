import axios from "axios";
import crypto from "crypto";

async function getEsewaPaymentHash({ amount, transaction_uuid }) {
  try {
    const data = `total_amount=${amount},transaction_uuid=${transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE}`;

    const secretKey = process.env.ESEWA_SECRET_KEY;
    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(data)
      .digest("base64");

    console.log("Generated eSewa hash for:", { amount, transaction_uuid, hash });

    return {
      total_amount: amount,
      transaction_uuid: transaction_uuid,
      product_code: process.env.ESEWA_PRODUCT_CODE,
      signature: hash,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };
  } catch (error) {
    console.error("Error generating eSewa payment hash:", error);
    throw error;
  }
}

async function verifyEsewaPayment(encodedData) {
  try {
    // Decode base64 data received from eSewa
    let decodedData = atob(encodedData);
    decodedData = await JSON.parse(decodedData);
    
    console.log("Decoded eSewa response:", decodedData);

    // Verify the signature
    const data = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${process.env.ESEWA_PRODUCT_CODE},signed_field_names=${decodedData.signed_field_names}`;

    const secretKey = process.env.ESEWA_SECRET_KEY;
    const hash = crypto
      .createHmac("sha256", secretKey)
      .update(data)
      .digest("base64");

    console.log("Generated verification hash:", hash);
    console.log("Received signature:", decodedData.signature);

    // Verify transaction status
    let reqOptions = {
      url: `${process.env.ESEWA_GATEWAY_URL}/api/epay/transaction/status/?product_code=${process.env.ESEWA_PRODUCT_CODE}&total_amount=${decodedData.total_amount}&transaction_uuid=${decodedData.transaction_uuid}`,
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    if (hash !== decodedData.signature) {
      throw new Error("Invalid signature");
    }

    let response = await axios.request(reqOptions);
    console.log("eSewa status check response:", response.data);

    if (
      response.data.status !== "COMPLETE" ||
      response.data.transaction_uuid !== decodedData.transaction_uuid ||
      Number(response.data.total_amount) !== Number(decodedData.total_amount)
    ) {
      throw new Error("Transaction verification failed");
    }

    return { response: response.data, decodedData };
  } catch (error) {
    console.error("Error verifying eSewa payment:", error);
    throw error;
  }
}

export { getEsewaPaymentHash, verifyEsewaPayment };