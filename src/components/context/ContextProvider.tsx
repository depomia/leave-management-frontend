// src/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import newRequest from "@/utils/newRequest";

// Define user type
interface User {
  name: string;
  role: string;
  _id: string;
  department: string;
}

// Define the context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create the context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  clearError: () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // Load user from localStorage on initial mount - only runs once at component mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const authenticated = localStorage.getItem("authenticated") === "true";
        
        if (authenticated) {
          const name = localStorage.getItem("user");
          const role = localStorage.getItem("role");
          const _id = localStorage.getItem("_id");
          const department = localStorage.getItem("department");
          
          if (name && role && _id && department) {
            setUser({
              name: JSON.parse(name),
              role,
              _id,
              department
            });
            setIsAuthenticated(true);
          } else {
            // If some data is missing, clear everything
            localStorage.removeItem("authenticated");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
            localStorage.removeItem("_id");
            localStorage.removeItem("department");
            setIsAuthenticated(false);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading user from storage:", error);
        localStorage.removeItem("authenticated");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("_id");
        localStorage.removeItem("department");
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    // Run only once on component mount
    loadUserFromStorage();
    
    // Setup storage event listener
    const handleStorageChange = () => {
      loadUserFromStorage();
    };
    
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newRequest.post("/auth/login", { email, password });
      const { name, role, _id, department } = response.data.user;
      
      // Store the user data in localStorage
      localStorage.setItem("user", JSON.stringify(name));
      localStorage.setItem("department", department);
      localStorage.setItem("role", role);
      localStorage.setItem("_id", _id);
      localStorage.setItem("authenticated", "true");
      
      // Update state
      setUser({ name, role, _id, department });
      setIsAuthenticated(true);
      
      // Trigger storage event for other components
      window.dispatchEvent(new Event("storage"));
      
      // Artificial delay to show login progress
      // But don't navigate here - let the components handle navigation based on auth state
      setTimeout(() => {
        setLoading(false);
      }, 1500);
      
    } catch (error: any) {
      setIsAuthenticated(false);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Failed to login. Please try again.");
      }
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("department");
    localStorage.removeItem("role");
    localStorage.removeItem("_id");
    localStorage.removeItem("authenticated");
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
    
    // Trigger storage event for other components
    window.dispatchEvent(new Event("storage"));
    
    // Redirect to home page
    navigate("/");
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Value object to be provided to consumers
  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};