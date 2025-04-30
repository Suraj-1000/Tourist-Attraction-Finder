import mongoose from "mongoose";

const purchasedItemSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signup',
    required: true
  },
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
    price: { type: Number, required: true },
    startTime: { type: String },  // Optional for events
    endTime: { type: String },    // Optional for events
    location: { type: String },   // Optional for events
    startDate: { type: String },  // or Date if you want strict date type
    endDate: { type: String },
    destinations: { type: String } // Added plural version for trip destinations
  },
  userDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  ticketDetails: {
    vipTickets: {
      quantity: { type: Number, default: 0 },
      pricePerTicket: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 }
    },
    generalTickets: {
      quantity: { type: Number, default: 0 },
      pricePerTicket: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 }
    },
    totalTickets: { type: Number, default: 0 },
    totalTicketPrice: { type: Number, default: 0 }
  }
}, { timestamps: true });

const PurchasedItem = mongoose.model("PurchasedItem", purchasedItemSchema);
export default PurchasedItem;