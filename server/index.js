import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';

import signupRouter from './routes/Signups.js';
import loginRouters from './routes/Login.js';
import ForgotPassRouters from './routes/ForgotPass.js';
import PassResetRouter from './routes/ResetPass.js';
import adminMediaRouter from './routes/Image&Video.js';
import adminSearchAttractionRouter from './routes/SearchAttractions.js';
import adminPackageRouter from './routes/Packages.js';
import adminAddTripRouter from './routes/PlanTrips.js';
import adminBookingApproveRouter from './routes/TripApproval.js'
import adminUpdateProfileRouter from './routes/ProfileManages.js'
import adminEmergencyRouter from './routes/Emergencys.js'
import DeleteAccountRouter from './routes/DeleteAccount.js';
import ChangePasswordRouter from './routes/ChangePassword.js';
import currencyRoutes from './routes/currencyRoutes.js';
import LanguageRouter from './routes/Languages.js';
import AdminDasboardRouter from './routes/AdminDashboard.js';
import AdmineventRoutes from './routes/eventRoutes.js';
import khaltiRoutes from './routes/Khalti.js';
import esewaRoutes from './routes/Esewa.js';
import paymentRoutes from './routes/Payment.js';
import notificationsRouter from './routes/Notifications.js';
import preferenceRoutes from './routes/PreferenceRoutes.js';
import contactRoutes from './routes/ContactRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// Import user-specific routes
import userHistoryRouter from './routes/userHistory.js';
import userFavoritesRouter from './routes/userFavorites.js';
import userEmergencyContactsRouter from './routes/userEmergencyContacts.js';

// Admin routes
import adminFavoritesRouter from './routes/adminFavorites.js';
import adminHistoryRouter from './routes/adminHistory.js';
import guideApprovalRouter from './routes/GuideApproval.js';

// Import the new guides router
import guidesRouter from './routes/Guides.js';

import Package from './models/Package.js';

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
app.use(express.urlencoded({ extended: true }));

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
