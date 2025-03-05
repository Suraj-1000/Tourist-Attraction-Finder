import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { CurrencyProvider } from './config/CurrencyContext';

import LandingPage from './View/Admin/Home/LandingPage';
import Login from './View/User_Authentication/Login';
import Signup from './View/User_Authentication/Signup';
import ForgotPass from './View/User_Authentication/ForgotPass';
import PassReset from './View/User_Authentication/PassReset';
import PassConfirm from './View/User_Authentication/PassConfirm'
import AdminHomepage from './View/Admin/Home/AdminHomepage';
import AdminSearchPage from './View/Admin/Search_Page/AdminSearchPage';
import AdminAddIVPage from './View/Admin/Search_Page/AdminAddIVPage';
import AdminEditIVPage from './View/Admin/Search_Page/AdminEditIVPage';
import AdminAddIVSuccessPage from './View/Admin/Search_Page/AdminAddIVSuccessPage';
import AdminEditIVSuccessPage from './View/Admin/Search_Page/AdminEditIVSuccessPage';
import AdminSearchAttractionPage from './View/Admin/Search_Page/AdminSearchAttractionPage';
import AdminAddAttractionDetailsPage from './View/Admin/Search_Page/AdminAddAttractionDetails';
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



    // Admin Page Routing
    // Admin Attraction
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
      path: '/AdmineditIV/:id',
      element: <AdminEditIVPage />
    },
    {
      path: '/AdminaddIVSucess',
      element: <AdminAddIVSuccessPage />
    },
    {
      path: '/AdmineditIVSucess',
      element: <AdminEditIVSuccessPage />
    },
    {
      path: '/AdminSearchAttraction',
      element: <AdminSearchAttractionPage />
    },
    {
      path: '/AdminAddAttractionDetails',
      element: <AdminAddAttractionDetailsPage />
    },
    {
      path: '/AdminEditAttractionDetails/:attractionName',
      element: <AdminEditAttractionDetailsPage />
    },
    {
      path: '/AdminAttractionView/:attractionName',
      element: <AdminAttractionViewPage />
    },

    //Admin Package 
    {
      path: '/ItineraryPackage',
      element: <ItineraryPackagePage />
    },

    {
      path: '/ItineraryPackageView/:packageName',
      element: <ItineraryPackageViewPage />
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
      element: <ViewTripDetailsPage />
    },




    // Booking Page Routes
    {
      path: '/AdminBookingAD',
      element: <AdminBookingADPage />
    },




    // Management and Others Routes

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
    }

    





  ]);
  return (
    <>
     <CurrencyProvider>
     <RouterProvider router={router}/>
     </CurrencyProvider>
    </>
  )
}

