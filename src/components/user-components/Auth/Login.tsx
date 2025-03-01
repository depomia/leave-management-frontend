// src/components/LoginForm.tsx

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "../../context/ContextProvider";
import { Navigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  // Use the auth context
  const { login, error, loading, isAuthenticated, user, clearError } = useAuth();

  // Handle progress bar animation when loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (loading && loadingProgress < 100) {
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = prev + 5; // Adjust speed as needed
          if (newProgress >= 100) {
            return 100;
          }
          return newProgress;
        });
      }, 100);
    }
    
    // Clear interval after component unmounts
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, loadingProgress]);

  // Handle input changes
  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    // Clear any previous errors when user starts typing
    if (error) clearError();
    
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  }

  // Handle form submission
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoadingProgress(0);
    await login(email, password);
  }

  // Use useEffect for navigation to prevent render-time redirects
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      const timer = setTimeout(() => {
        if (user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/user";
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, loading]);

  // Loading screen that shows during authentication
  if (loading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full max-w-md"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-green-600">Preparing Your Dashboard</h2>
          <div className="w-full sm:w-80 md:w-96 h-2 sm:h-3 bg-gray-200 rounded-full mb-4 overflow-hidden mx-auto">
            <motion.div 
              className="h-full bg-green-600 rounded-full"
              style={{ width: `${loadingProgress}%` }}
              initial={{ width: "0%" }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Loading your data... {Math.round(loadingProgress)}%
          </p>
          <div className="mt-6 sm:mt-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 sm:w-12 sm:h-12 border-3 sm:border-4 border-green-600 border-t-transparent rounded-full mx-auto"
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8">
            Please wait while we prepare your experience
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-start items-center min-h-full mt-16 md:mt-0 md:flex-row md:justify-center md:items-center">
      <motion.div
        className="w-full max-w-sm md:max-w-md lg:max-w-lg p-8 h-auto bg-white bg-opacity-80 pt-10 md:pt-20 rounded-lg shadow-lg flex flex-col gap-5"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-black mb-8 md:mb-12" style={{ textShadow: "0 0 10px white", lineHeight: "1.5" }}>
          LEAVE MANAGEMENT SYSTEM
        </h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <motion.input
            type="email"
            name="email"
            value={email}
            onChange={handleInputChange}
            placeholder="Email Address"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none mb-5"
            whileFocus={{ scale: 1.01 }}
          />
          <motion.input
            type="password"
            name="password"
            value={password}
            onChange={handleInputChange}
            placeholder="Password"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none mb-5"
            whileFocus={{ scale: 1.02 }}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg shadow-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">© 2025</p>
      </motion.div>
    </div>
  );
};

export default LoginForm;