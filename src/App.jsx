import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CurrencyProvider } from './config/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './config/ProtectedRoute';
import LinkPreview from './config/LinkPreview';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//Landing Page
import LandingPage from './View/Landing Page/LandingPage';

//User Side Authentication
import Login from './View/User_Authentication/Login';
import Signup from './View/User_Authentication/Signup';

//User Side Forgot Password
import ForgotPass from './View/User_Authentication/ForgotPass';
import PassReset from './View/User_Authentication/PassReset';
import PassConfirm from './View/User_Authentication/PassConfirm'

//Admin Side
//Admin Home Page 
import AdminHomepage from './View/Admin/Home/AdminHomePage';

//Admin Search Page
import AdminSearchPage from './View/Admin/Search_Page/AdminSearchPage';
import AdminAddIVPage from './View/Admin/Search_Page/AdminAddIVPage';
import AdminSearchAttractionPage from './View/Admin/Search_Page/AdminSearchAttractionPage';
import AdminEditAttractionDetailsPage from './View/Admin/Search_Page/AdminEditAttractionDetails';
import AdminAttractionViewPage from './View/Admin/Search_Page/AdminAttractionViewPage';

//Admin Itinerary Planning
import ItineraryPackagePage from './View/Admin/Itinerary Planning/Package';
import ItineraryPackageViewPage from './View/Admin/Itinerary Planning/PackageView';
import AddItineraryPackagePage from './View/Admin/Itinerary Planning/addPackage';
import EditItineraryPackagePage from './View/Admin/Itinerary Planning/editPackage';

//Admin Booking Approval
import AdminBookingADPage from './View/Admin/Booking/AdminBookingAD';

//Admin Management
import AdminProfileManagePage from './View/Admin/Management/AdminProfileManage';
import AdminChangePassPage from './View/Admin/Management/AdminChangePass';
import AdminHistoryPage from './View/Admin/Management/AdminHistory';
import AdminFavoritesPage from './View/Admin/Management/AdminFavorites';
import AdminNotificationPage from './View/Admin/Management/AdminNotification';
import AdminEmergencyPage from './View/Admin/Management/AdminEmergency';
import AdminCurrenciesPage from './View/Admin/Management/AdminCurrency';
import AdminLanguagePage from './View/Admin/Management/AdminLanguage';

//Admin Booking History
import AdminBookingHistory from './View/Admin/Management/AdminBookingHistory';

//Admin Explore Map
import AdminMapPage from './View/Admin/Explore Map/Map';

//Recommendation
import AdminEventPage from './View/Admin/Recommendation/AdminEvent';
import AdminLocationPage from './View/Admin/Recommendation/AdminLocation';
import EventView from './View/Admin/Recommendation/EventView';

//Payment
import PaymentRedirect from './View/Payment/PaymentRedirect';

//User Side
//Home Page
import Homepage from './View/User/Home Page/UserHomepage';

//Search Page
import ImageVideoPage from './View/User/Search/SearchPage';
import AttractionPage from './View/User/Search/AttractionPage';
import AttractionViewPage from './View/User/Search/AttractionViewPage';

//Itinerary Planner
import PackagePage from './View/User/Itinerary/Package';
import PackageViewPage from './View/User/Itinerary/PackageView';

//Plan Your Trip
import PlanYourTripPage from './View/User/Itinerary/PlanYourTrip';
import ViewTripPage from './View/User/Itinerary/ViewTrip';
import PlanTripEditPage from './View/User/Itinerary/PlanTripEdit';
import ViewTripDetailsPage from './View/User/Itinerary/ViewTripDetails';

//Recommendation
import EventPage from './View/User/Recommendation/Event';
import EventDetails from './View/User/Recommendation/EventDetails';
import LocationPage from './View/User/Recommendation/Location';

import Map from './View/User/Maps/E-Map';

//User Panel
import CurrencyPage from './View/User/Panel/Currency';
import NotificationPage from './View/User/Panel/Notification';
import LanguagePage from './View/User/Panel/Language';

//User Settings
import ProfilePage from './View/User/Settings/Profile';
import HistoryPage from './View/User/Settings/History';
import FavoritesPage from './View/User/Settings/Favorites';
import BookingHistory from './View/User/Settings/Booking-History';
import ChangePass from './View/User/Settings/ChangePass';
import EmergencyPage from './View/User/Settings/Emergency';




export default function App() {
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
      path: '/AdminBookingAD', element: <AdminBookingADPage />
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

   
  ]);

  return (
    <CurrencyProvider>
      <Router>
        <Routes>
          {router.routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
        <Toaster position="top-right" />
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </CurrencyProvider>
  );
}
