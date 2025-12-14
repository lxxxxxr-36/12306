import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../services/auth';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const location = useLocation();
  if (!isLoggedIn()) {
    const from = location.pathname + (location.search || '');
    return <Navigate to="/login" state={{ from }} replace />;
  }
  return children;
};

export default ProtectedRoute;
