import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// True when a token exists and its `exp` claim is still in the future. This only avoids showing
// the dashboard to signed-out visitors; the API still verifies every request on the server.
const hasValidSession = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!hasValidSession()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/" replace state={{ from: location.pathname, authRequired: true }} />;
  }

  return children;
}
