import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import NotificationHub from './notificationHub.js';
import NotificationService from './services/notificationService.js';

import signupRouter from './Routes/Signups.js';
import loginRouters from './Routes/Login.js';
import ForgotPassRouters from './Routes/ForgotPass.js'; 
import PassResetRouter from './Routes/ResetPass.js';
import adminMediaRouter from './Routes/AdminIV.js';
import adminSearchRoutes from './Routes/AdminIV.js';
import adminSearchAttractionRouter from './Routes/AdminSearchAttraction.js'; 
import adminPackageRouter from './Routes/AdminPackages.js';
import adminAddTripRouter from './Routes/AdminPlanTrip.js';
import adminTripRouter from './Routes/AdminPlanTrip.js';
import adminBookingApproveRouter from './Routes/AdminBookingAppr.js'
import adminUpdateProfileRouter from './Routes/AdminProfileManage.js'
import adminEmergencyRouter from './Routes/AdminEmergencys.js'
import DeleteAccountRouter from './Routes/DeleteAccount.js';
import ChangePasswordRouter from './Routes/ChangePassword.js';
import currencyRoutes from './Routes/currencyRoutes.js';
import LanguageRouter from './Routes/Languages.js';
import AdminDasboardRouter from './Routes/AdminDashboard.js';

dotenv.config();

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
app.use('/adminDashboard', AdminDasboardRouter)

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
