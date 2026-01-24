import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LinkPreview from './LinkPreview';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem("token");

  if (!isAuthenticated) {
    // Pass the current path in the state
    return <LinkPreview currentPath={location.pathname} />;
  }

  return children;
};

export default ProtectedRoute;
