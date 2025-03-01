// src/components/ProtectedRoute.tsx

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/ContextProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  
  // Always call useMemo regardless of loading state (Rule of Hooks)
  const content = React.useMemo(() => {
    // Still loading, show loading indicator
    if (loading) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto animate-spin"></div>
            <p className="mt-4 text-gray-600">Verifying authentication...</p>
          </div>
        </div>
      );
    }
    
    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
      return <Navigate to="/" state={{ from: location }} replace />;
    }

    // If user doesn't have required role, redirect to error page
    if (!user || !roles.includes(user.role)) {
      return <Navigate to="/error" replace />;
    }

    // If authenticated and has required role, render the children
    return <>{children}</>;
  }, [isAuthenticated, user, roles, location, children, loading]);

  return content;
};

export default ProtectedRoute;