import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import NotificationHub from './notificationHub.js';
import NotificationService from './services/notificationService.js';

import signupRouter from './routes/Signups.js';
import loginRouters from './routes/Login.js';
import ForgotPassRouters from './routes/ForgotPass.js'; 
import PassResetRouter from './routes/ResetPass.js';
import adminMediaRouter from './Routes/Image&Video.js';
import adminSearchRoutes from './Routes/Image&Video.js';
import adminSearchAttractionRouter from './Routes/SearchAttractions.js'; 
import adminPackageRouter from './Routes/Packages.js';
import adminAddTripRouter from './Routes/PlanTrips.js';
import adminTripRouter from './Routes/PlanTrips.js';
import adminBookingApproveRouter from './Routes/BookingApproval.js'
import adminUpdateProfileRouter from './Routes/ProfileManages.js'
import adminEmergencyRouter from './Routes/Emergencys.js'
import DeleteAccountRouter from './routes/DeleteAccount.js';
import ChangePasswordRouter from './routes/ChangePassword.js';
import currencyRoutes from './routes/currencyRoutes.js';
import LanguageRouter from './routes/Languages.js';
import AdminDasboardRouter from './routes/AdminDashboard.js';
import AdmineventRoutes from './routes/eventRoutes.js';
import khaltiRoutes from './Routes/Khalti.js';
import esewaRoutes from './Routes/Esewa.js';
import paymentRoutes from './Routes/Payment.js';

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server
const server = createServer(app);

// Initialize NotificationHub
const notificationHub = new NotificationHub(server);

// Initialize NotificationService
const notificationService = new NotificationService(notificationHub);

// Make services available to routes
app.set('notificationHub', notificationHub);
app.set('notificationService', notificationService);

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
console.log('MongoDB URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

// Routes
app.use('/signups', signupRouter);
app.use('/login', loginRouters);
app.use('/forgot', ForgotPassRouters);
app.use('/pass_reset', PassResetRouter) 
app.use('/adminMedia', adminMediaRouter)
app.use('/adminImg', adminSearchRoutes);
app.use('/adminSearch', adminSearchAttractionRouter);
app.use('/adminPackage', adminPackageRouter);
app.use('/adminAddTrip', adminAddTripRouter);
app.use('/adminTrip', adminTripRouter);
app.use('/adminBookingApprove', adminBookingApproveRouter)
app.use('/adminUpdateProfile', adminUpdateProfileRouter)
app.use('/adminEmergency', adminEmergencyRouter)
app.use('/deleteAccount', DeleteAccountRouter)
app.use('/changePassword', ChangePasswordRouter)
app.use('/currency', currencyRoutes)
app.use('/language', LanguageRouter)
app.use('/adminEvents', AdmineventRoutes)
app.use('/adminDashboard', AdminDasboardRouter)
app.use('/khalti', khaltiRoutes)
app.use('/esewa', esewaRoutes)
app.use('/payments', paymentRoutes)

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
