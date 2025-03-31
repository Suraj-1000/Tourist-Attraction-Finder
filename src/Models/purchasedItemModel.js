import mongoose from "mongoose";

const purchasedItemSchema = new mongoose.Schema({
  item: { 
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string
    required: true 
  },
  totalPrice: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ["khalti", "esewa"], required: true },
  status: { type: String, enum: ["pending", "completed", "refunded"], default: "pending" },
  packageDetails: {
    title: { type: String, required: true },
    duration: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true }
  },
  userDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  }
}, { timestamps: true });

const PurchasedItem = mongoose.model("PurchasedItem", purchasedItemSchema);
export default PurchasedItem;