import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import bodyParser from 'body-parser';

import signupRouter from './Routes/Signups.js';
import loginRouters from './Routes/Login.js';
import ForgotPassRouters from './Routes/ForgotPass.js'; 
import PassResetRouter from './Routes/ResetPass.js';
import adminMediaRouter from './Routes/Image&Video.js';
import adminSearchRoutes from './Routes/Image&Video.js';
import adminSearchAttractionRouter from './Routes/SearchAttractions.js'; 
import adminPackageRouter from './Routes/Packages.js';
import adminAddTripRouter from './Routes/PlanTrips.js';
import adminTripRouter from './Routes/PlanTrips.js';
import adminBookingApproveRouter from './Routes/TripApproval.js'
import adminUpdateProfileRouter from './Routes/ProfileManages.js'
import adminEmergencyRouter from './Routes/Emergencys.js'
import DeleteAccountRouter from './Routes/DeleteAccount.js';
import ChangePasswordRouter from './Routes/ChangePassword.js';
import currencyRoutes from './Routes/currencyRoutes.js';
import LanguageRouter from './Routes/Languages.js';
import AdminDasboardRouter from './Routes/AdminDashboard.js';
import AdmineventRoutes from './Routes/eventRoutes.js';
import khaltiRoutes from './Routes/Khalti.js';
import esewaRoutes from './Routes/Esewa.js';
import paymentRoutes from './Routes/Payment.js';
import notificationsRouter from './Routes/Notifications.js';
import preferenceRoutes from './Routes/PreferenceRoutes.js';
import contactRoutes from './Routes/ContactRoutes.js';
import reviewRoutes from './Routes/reviewRoutes.js';

// Import user-specific routes
import userHistoryRouter from './Routes/userHistory.js';
import userFavoritesRouter from './Routes/userFavorites.js';
import userEmergencyContactsRouter from './Routes/userEmergencyContacts.js';

// Admin routes
import adminFavoritesRouter from './Routes/adminFavorites.js';
import adminHistoryRouter from './Routes/adminHistory.js';
import guideApprovalRouter from './Routes/GuideApproval.js';

// Import the new guides router
import guidesRouter from './Routes/Guides.js';

import Package from './Models/Package.js';

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
console.log('MongoDB URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      await Package.fixInvalidReviews();
    } catch (error) {
      console.error('Database maintenance error:', error);
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
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
app.use('/notifications', notificationsRouter)
app.use('/preferences', preferenceRoutes)
app.use('/contact', contactRoutes);

// User-specific routes with hyphenated paths
app.use('/user-history', userHistoryRouter);
app.use('/user-favorites', userFavoritesRouter);
app.use('/user-emergency-contacts', userEmergencyContactsRouter);

// Admin routes
app.use('/admin/favorites', adminFavoritesRouter);
app.use('/admin/history', adminHistoryRouter);
app.use('/guides', guideApprovalRouter);
app.use('/api/guides', guidesRouter);

// Add review routes
app.use('/reviews', reviewRoutes);

// Routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
