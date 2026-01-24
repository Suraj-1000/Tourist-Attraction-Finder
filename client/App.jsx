import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LinkPreview from './components/LinkPreview';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import DashboardLayout from './pages/Guide/components/DashboardLayout';

//Static Pages
import AboutUs from './components/Pages/AboutUs';
import ContactUs from './components/Pages/ContactUs';
import FAQ from './components/Pages/FAQ';
import TermsAndConditions from './components/Pages/TermsAndConditions';

//Landing Page
import LandingPage from './pages/Landing Page/LandingPage';

//User Side Authentication
import Login from './pages/User_Authentication/Login';
import Signup from './pages/User_Authentication/Signup';

//User Side Forgot Password
import ForgotPass from './pages/User_Authentication/ForgotPass';
import PassReset from './pages/User_Authentication/PassReset';
import PassConfirm from './pages/User_Authentication/PassConfirm'

//Admin Side
//Admin Home Page 
import AdminHomepage from './pages/Admin/Home/AdminHomePage';

//Admin Search Page
import AdminSearchPage from './pages/Admin/Search_Page/AdminSearchPage';
import AdminAddIVPage from './pages/Admin/Search_Page/AdminAddIVPage';
import AdminSearchAttractionPage from './pages/Admin/Search_Page/AdminSearchAttractionPage';
import AdminEditAttractionDetailsPage from './pages/Admin/Search_Page/AdminEditAttractionDetails';
import AdminAttractionViewPage from './pages/Admin/Search_Page/AdminAttractionViewPage';

//Admin Itinerary Planning
import ItineraryPackagePage from './pages/Admin/Itinerary Planning/Package';
import ItineraryPackageViewPage from './pages/Admin/Itinerary Planning/PackageView';
import AddItineraryPackagePage from './pages/Admin/Itinerary Planning/addPackage';
import EditItineraryPackagePage from './pages/Admin/Itinerary Planning/editPackage';


//Admin Management
import AdminProfileManagePage from './pages/Admin/Management/AdminProfileManage';
import AdminChangePassPage from './pages/Admin/Management/AdminChangePass';
import AdminHistoryPage from './pages/Admin/Management/AdminHistory';
import AdminFavoritesPage from './pages/Admin/Management/AdminFavorites';
import AdminNotificationPage from './pages/Admin/Management/AdminNotification';
import AdminEmergencyPage from './pages/Admin/Management/AdminEmergency';
import AdminCurrenciesPage from './pages/Admin/Management/AdminCurrency';
import AdminLanguagePage from './pages/Admin/Management/AdminLanguage';
import ContactManagement from './pages/Admin/Management/ContactManagement';
import GuideApproval from './pages/Admin/Management/GuideApproval';

//Admin Booking History
import AdminBookingHistory from './pages/Admin/Management/AdminBookingHistory';

//Admin Explore Map
import AdminMapPage from './pages/Admin/Explore Map/Map';

//Recommendation
import AdminEventPage from './pages/Admin/Recommendation/AdminEvent';
import AdminLocationPage from './pages/Admin/Recommendation/AdminLocation';
import EventView from './pages/Admin/Recommendation/EventView';

//Payment
import PaymentRedirect from './pages/Payment/PaymentRedirect';

//User Side
//Home Page
import Homepage from './pages/User/Home Page/UserHomepage';

//Search Page
import ImageVideoPage from './pages/User/Search/SearchPage';
import AttractionPage from './pages/User/Search/AttractionPage';
import AttractionViewPage from './pages/User/Search/AttractionViewPage';

//Itinerary Planner
import PackagePage from './pages/User/Itinerary/Package';
import PackageViewPage from './pages/User/Itinerary/PackageView';

//Plan Your Trip
import PlanYourTripPage from './pages/User/Itinerary/PlanYourTrip';
import ViewTripPage from './pages/User/Itinerary/ViewTrip';
import PlanTripEditPage from './pages/User/Itinerary/PlanTripEdit';
import ViewTripDetailsPage from './pages/User/Itinerary/ViewTripDetails';

//Recommendation
import EventPage from './pages/User/Recommendation/Event';
import EventDetails from './pages/User/Recommendation/EventDetails';
import LocationPage from './pages/User/Recommendation/Location';

import Map from './pages/User/Maps/E-Map';

//User Panel
import CurrencyPage from './pages/User/Panel/Currency';
import NotificationPage from './pages/User/Panel/Notification';
import LanguagePage from './pages/User/Panel/Language';

//User Settings
import ProfilePage from './pages/User/Settings/Profile';
import HistoryPage from './pages/User/Settings/History';
import FavoritesPage from './pages/User/Settings/Favorites';
import BookingHistory from './pages/User/Settings/Booking-History';
import ChangePass from './pages/User/Settings/ChangePass';
import EmergencyPage from './pages/User/Settings/Emergency';
import GuidePage from './pages/User/Others/Guide';

//Review Management
import ReviewPage from './pages/Others/ReviewPage';


// Guide Dashboard Pages
import Dashboard from './pages/Guide/Pages/Dashboard';
import Profile from './pages/Guide/Pages/Profile';
import TripApproval from './pages/Guide/Pages/My Tours/TripApproval';
import CalenderView from './pages/Guide/Pages/My Tours/CalenderView';
import Bookings from './pages/Guide/Pages/Bookings/Bookings';
import Password from './pages/Guide/Pages/Settings/Password';
import DeleteAcc from './pages/Guide/Pages/Settings/DeleteAcc';

function App() {
  const router = createBrowserRouter([

    //Landing Page
    {
      path: '/', element: <LandingPage />
    },

    //User Side Authentication
    {
      path: '/signup', element: <Signup />
    },
    {
      path: '/login', element: <Login />
    },

    //User Side Forgot Password
    {
      path: '/forgot', element: <ForgotPass />
    },
    {
      path: '/passReset', element: <PassReset />
    },
    {
      path: '/passConfirm', element: <PassConfirm />
    },

    //Admin Side
    {
      path: '/AdminHome', element: <AdminHomepage />
    },
    {
      path: '/AdminSearch', element: <AdminSearchPage />
    },
    {
      path: '/AdminAddIV', element: <AdminAddIVPage />
    },
    {
      path: '/AdminAddIV/:id', element: <AdminAddIVPage />
    },
    {
      path: '/AdminSearchAttraction', element: <AdminSearchAttractionPage />
    },
    {
      path: '/AdminEditAttractionDetails/:attractionName', element: <AdminEditAttractionDetailsPage />
    },
    {
      path: '/AdminAttractionView/:attractionName', element: <ProtectedRoute><AdminAttractionViewPage /></ProtectedRoute>
    },
    {
      path: '/ItineraryPackage', element: <ItineraryPackagePage />
    },
    {
      path: '/ItineraryPackageView/:packageName', element: <ProtectedRoute><ItineraryPackageViewPage /></ProtectedRoute>
    },
    {
      path: '/AddItineraryPackage', element: <AddItineraryPackagePage />
    },
    {
      path: '/EditItineraryPackage/:packageName', element: <EditItineraryPackagePage />
    },
    {
      path: '/AdminProfileManage', element: <AdminProfileManagePage />
    },
    {
      path: '/AdminChangePass', element: <AdminChangePassPage />
    },
    {
      path: '/AdminHistory', element: <AdminHistoryPage />
    },
    {
      path: '/AdminFavorites', element: <AdminFavoritesPage />
    },
    {
      path: '/AdminBookingHistory', element: <AdminBookingHistory />
    },
    {
      path: '/AdminNotification', element: <AdminNotificationPage />
    },
    {
      path: '/AdminEmergency', element: <AdminEmergencyPage />
    },
    {
      path: '/AdminCurrencies', element: <AdminCurrenciesPage />
    },
    {
      path: '/AdminLanguage', element: <AdminLanguagePage />
    },
    {
      path: '/AdminMap', element: <AdminMapPage />
    },
    {
      path: '/AdminEvent', element: <AdminEventPage />
    },
    {
      path: '/AdminLocation', element: <AdminLocationPage />
    },
    {
      path: '/AdminEventView/:id', element: <ProtectedRoute><EventView /></ProtectedRoute>
    },
    {
      path: '/AdminContactManagement', element: <ContactManagement />
    },
    {
      path: '/AdminReview', element: <ProtectedRoute><ReviewPage /></ProtectedRoute>
    },
    {
      path: '/AdminGuideApproval', element: <GuideApproval />
    },

    //Payment
    {
      path: '/payment-success', element: <PaymentRedirect />
    },
    {
      path: '/payment-failure', element: <PaymentRedirect />
    },
    {
      path: '/payment-cancelled', element: <PaymentRedirect />
    },



    //User Side Homepage
    {
      path: '/Home', element: <Homepage />
    },

    //User Side Search Page
    {
      path: '/Upload-Images', element: <ImageVideoPage />
    },
    {
      path: '/Search-Attraction', element: <AttractionPage />
    },
    {
      path: '/Attraction-View/:attractionName', element: <ProtectedRoute><AttractionViewPage /></ProtectedRoute>
    },

    // Itinerary Planner  
    {
      path: '/Itinerary-Package', element: <PackagePage />
    },
    {
      path: '/Itinerary-Package-View/:packageName', element: <ProtectedRoute><PackageViewPage /></ProtectedRoute>
    },
    {
      path: '/Plan-Your-Trip', element: <PlanYourTripPage />
    },
    {
      path: '/View-Trip', element: <ViewTripPage />
    },
    {
      path: '/Plan-Trip-Edit/:id', element: <PlanTripEditPage />
    },
    {
      path: '/View-Trip-Details/:tripName', element: <ProtectedRoute><ViewTripDetailsPage /></ProtectedRoute>
    },

    //User Side Recommendation
    {
      path: '/Event-Based', element: <EventPage />
    },
    {
      path: '/Event-Details/:id', element: <ProtectedRoute><EventDetails /></ProtectedRoute>
    },
    {
      path: '/Location-Based', element: <LocationPage />
    },

    //Map
    {
      path: '/Explore-Map', element: <Map />
    },

    //User Panel
    {
      path: '/Currencies', element: <CurrencyPage />
    },
    {
      path: '/Notification', element: <NotificationPage />
    },
    {
      path: '/Language', element: <LanguagePage />
    },

    //User Settings
    {
      path: '/Profile', element: <ProfilePage />
    },
    {
      path: '/History', element: <HistoryPage />
    },
    {
      path: '/Favorites', element: <FavoritesPage />
    },
    {
      path: '/Booking-History', element: <BookingHistory />
    },
    {
      path: '/Change-Password', element: <ChangePass />
    },
    {
      path: '/Emergency', element: <EmergencyPage />
    },

    // Static Pages
    {
      path: '/about-us', element: <AboutUs />
    },
    {
      path: '/contact-us', element: <ContactUs />
    },
    {
      path: '/faq', element: <FAQ />
    },
    {
      path: '/terms-and-conditions', element: <TermsAndConditions />
    },

    // Review Routes (shared between admin and user)
    {
      path: '/Review', element: <ProtectedRoute><ReviewPage /></ProtectedRoute>
    },
    {
      path: '/Guide', element: <GuidePage />
    },





    // Guide Dashboard Routes
    {
      path: '/guide',
      element: <DashboardLayout />,
      children: [
        {
          path: 'dashboard',
          element: <Dashboard />
        },
        {
          path: 'profile',
          element: <Profile />
        },
        {
          path: 'my-tours',
          element: <TripApproval />
        },
        {
          path: 'calendar',
          element: <CalenderView />
        },
        {
          path: 'bookings',
          element: <Bookings />
        },
        {
          path: 'settings/password',
          element: <Password />
        },
        {
          path: 'settings/delete',
          element: <DeleteAcc />
        }
      ]
    },

  ]);

  return (
    <CurrencyProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
      <ToastContainer />
    </CurrencyProvider>
  );
}

export default App;

