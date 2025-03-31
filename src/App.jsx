import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CurrencyProvider } from './config/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './config/ProtectedRoute';
import LinkPreview from './config/LinkPreview';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from './View/Landing Page/LandingPage';
import Login from './View/User_Authentication/Login';
import Signup from './View/User_Authentication/Signup';
import ForgotPass from './View/User_Authentication/ForgotPass';
import PassReset from './View/User_Authentication/PassReset';
import PassConfirm from './View/User_Authentication/PassConfirm'

import AdminHomepage from './View/Admin/Home/AdminHomePage';
import AdminSearchPage from './View/Admin/Search_Page/AdminSearchPage';
import AdminAddIVPage from './View/Admin/Search_Page/AdminAddIVPage';
import AdminSearchAttractionPage from './View/Admin/Search_Page/AdminSearchAttractionPage';
import AdminEditAttractionDetailsPage from './View/Admin/Search_Page/AdminEditAttractionDetails';
import AdminAttractionViewPage from './View/Admin/Search_Page/AdminAttractionViewPage';
import ItineraryPackagePage from './View/Admin/Itinerary Planning/Package';
import ItineraryPackageViewPage from './View/Admin/Itinerary Planning/PackageView';
import AddItineraryPackagePage from './View/Admin/Itinerary Planning/addPackage';
import EditItineraryPackagePage from './View/Admin/Itinerary Planning/editPackage';
import PlanYourTripPage from './View/Admin/Itinerary Planning/PlanYourTrip';
import ViewTripPage from './View/Admin/Itinerary Planning/ViewTrip';
import PlanTripEditPage from './View/Admin/Itinerary Planning/PlanTripEdit';
import ViewTripDetailsPage from './View/Admin/Itinerary Planning/ViewTripDetails';
import AdminBookingADPage from './View/Admin/Booking/AdminBookingAD';
import AdminProfileManagePage from './View/Admin/Management/AdminProfileManage';
import AdminChangePassPage from './View/Admin/Management/AdminChangePass';
import AdminHistoryPage from './View/Admin/Management/AdminHistory';
import AdminFavoritesPage from './View/Admin/Management/AdminFavorites';
import AdminNotificationPage from './View/Admin/Management/AdminNotification';
import AdminEmergencyPage from './View/Admin/Management/AdminEmergency';
import AdminCurrenciesPage from './View/Admin/Management/AdminCurrency';
import AdminLanguagePage from './View/Admin/Management/AdminLanguage';
import AdminBookingHistory from './View/Admin/Management/AdminBookingHistory';
import AdminMapPage from './View/Admin/Explore Map/Map';
import AdminEventPage from './View/Admin/Recommendation/AdminEvent';
import AdminLocationPage from './View/Admin/Recommendation/AdminLocation';
import EventView from './View/Admin/Recommendation/EventView';

import UserHomepage from './View/User/Home Page/UserHomepage';

import PaymentRedirect from './View/Payment/PaymentRedirect';


export default function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <LandingPage />
    },
    {
      path: '/signup',
      element: <Signup />
    },
    {
      path: '/login',
      element: <Login />
    },
    {
      path: '/forgot',
      element: <ForgotPass />
    },
    {
      path: '/passReset',
      element: <PassReset />
    },
    {
      path: '/passConfirm',
      element: <PassConfirm />
    },
    {
      path: '/AdminHome',
      element: <AdminHomepage />
    },
    {
      path: '/AdminSearch',
      element: <AdminSearchPage />
    },
    {
      path: '/AdminaddIV',
      element: <AdminAddIVPage />
    },
    {
      path: '/AdminaddIV/:id',
      element: <AdminAddIVPage />
    },
    {
      path: '/AdminSearchAttraction',
      element: <AdminSearchAttractionPage />
    },
    {
      path: '/AdminEditAttractionDetails/:attractionName',
      element: <AdminEditAttractionDetailsPage />
    },
    {
      path: '/AdminAttractionView/:attractionName',
      element: (
        <ProtectedRoute>
          <AdminAttractionViewPage />
        </ProtectedRoute>
      )
    },
    {
      path: '/ItineraryPackage',
      element: <ItineraryPackagePage />
    },
    {
      path: '/ItineraryPackageView/:packageName',
      element: <ProtectedRoute><ItineraryPackageViewPage /></ProtectedRoute>
    },
    {
      path: '/AddItineraryPackage',
      element: <AddItineraryPackagePage />
    },
    {
      path: '/EditItineraryPackage/:packageName',
      element: <EditItineraryPackagePage />
    },
    {
      path: '/PlanYourTrip',
      element: <PlanYourTripPage />
    },
    {
      path: '/ViewTrip',
      element: <ViewTripPage />
    },
    {
      path: '/PlanTripEdit/:tripName',
      element: <PlanTripEditPage />
    },
    {
      path: '/ViewTripDetails/:tripName',
      element: <ProtectedRoute><ViewTripDetailsPage /></ProtectedRoute>
    },
    {
      path: '/AdminBookingAD',
      element: <AdminBookingADPage />
    },
    {
      path: '/AdminProfileManage',
      element: <AdminProfileManagePage />
    },
    {
      path: '/AdminChangePass',
      element: <AdminChangePassPage />
    },
    {
      path: '/AdminHistory',
      element: <AdminHistoryPage />
    },
    {
      path: '/AdminFavorites',
      element: <AdminFavoritesPage />
    },
    {
      path: '/AdminBookingHistory',
      element: <AdminBookingHistory />
    },
    {
      path: '/AdminNotification',
      element: <AdminNotificationPage />
    },
    {
      path: '/AdminEmergency',
      element: <AdminEmergencyPage />
    },
    {
      path: '/AdminCurrencies',
      element: <AdminCurrenciesPage />
    },
    {
      path: '/AdminLanguage',
      element: <AdminLanguagePage />
    },
    {
      path: '/AdminMap',
      element: <AdminMapPage />
    },
    {
      path: '/AdminEvent',
      element: <AdminEventPage />
    },
    {
      path: '/AdminLocation',
      element: <AdminLocationPage />
    },
    {
      path: '/AdminEventView/:id',
      element: (
        <ProtectedRoute>
          <EventView />
        </ProtectedRoute>
      )
    },
    {
      path: '/Homepage',
      element: <UserHomepage />
    },
    {
      path: '/payment-success',
      element: <PaymentRedirect />
    },
    {
      path: '/payment-failure',
      element: <PaymentRedirect />
    },
    {
      path: '/payment-cancelled',
      element: <PaymentRedirect />
    }
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
