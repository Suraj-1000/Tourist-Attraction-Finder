import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import signupRouter from './Routes/Signups.js';
import loginRouters from './Routes/Login.js';
import ForgotPassRouters from './Routes/ForgotPass.js'; 
import PassResetRouter from './Routes/ResetPass.js';
import adminMediaRouter from './Routes/AdminIV.js';
import adminSearchRoutes from './Routes/AdminIV.js';
import adminSearchAttractionRouter from './Routes/AdminSearchAttraction.js'; 
import adminAddPackageRouter from './Routes/AdminPackages.js';
import adminPackageRouter from './Routes/AdminPackages.js';
import adminAddTripRouter from './Routes/AdminPlanTrip.js';
import adminTripRouter from './Routes/AdminPlanTrip.js';
import adminBookingApproveRouter from './Routes/AdminBookingAppr.js'
import adminUpdateProfileRouter from './Routes/Signups.js'
import adminEmergencyRouter from './Routes/AdminEmergencys.js'
import DeleteAccountRouter from './Routes/DeleteAccount.js';
import ChangePasswordRouter from './Routes/ChangePassword.js';
import currencyRoutes from './Routes/currencyRoutes.js';
import LanguageRouter from './Routes/Languages.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());


// Database connection
console.log('MongoDB URI:', process.env.MONGO_URI); 
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Error connecting to MongoDB:', error));

// Routes
app.use('/signups', signupRouter);
app.use('/login', loginRouters);
app.use('/forgot', ForgotPassRouters);
app.use('/pass_reset', PassResetRouter) 
app.use('/adminMedia', adminMediaRouter)
app.use('/adminImg', adminSearchRoutes);
app.use('/adminSearch', adminSearchAttractionRouter);
app.use('/adminAddPackage', adminAddPackageRouter);
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
