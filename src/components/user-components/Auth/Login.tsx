import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { motion } from "framer-motion";
import newRequest from "@/utils/newRequest";
import { AxiosError } from "axios";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [redirect, setRedirect] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const navigate = useNavigate();

  // Check if user is already authenticated on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("authenticated");
    if (isAuthenticated === "true") {
      const userRole = localStorage.getItem("role");
      setCurrentUser(userRole);
      setRedirect(true);
    }
  }, []);

  // Handle loading progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (loadingData) {
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = prev + (100 / 15); // Increase by ~6.67% per second
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 1000);
      
      // Set timeout for redirect after 15 seconds
      const redirectTimeout = setTimeout(() => {
        setLoadingData(false);
        setRedirect(true);
      }, 15000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(redirectTimeout);
      };
    }
    
    return () => clearInterval(interval);
  }, [loadingData]);

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await newRequest.post("/auth/login", { email, password });
      const { name, role, _id, department } = success.data.user;
      
      // Store the user data in localStorage
      localStorage.setItem("user", JSON.stringify(name));
      localStorage.setItem("department", department);
      localStorage.setItem("role", role);
      localStorage.setItem("_id", _id);
      localStorage.setItem("authenticated", "true");
      console.log("Login successful");
      
      // Set current user and start loading screen instead of redirecting immediately
      setCurrentUser(role);
      setLoading(false);
      setLoadingData(true);
      setLoadingProgress(0);
      
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || "Invalid credentials");
        console.error(error.response?.data);
      } else {
        setError("Something went wrong. Please try again.");
        console.error("Unknown error");
      }
      setLoading(false);
    }
  }

  // Handle redirect based on user role
  if (redirect) {
    switch (currentUser) {
      case "admin":
        return <Navigate to="/admin" replace />;
      case "hod":
      case "principal":
      case "non-teaching-staff":
      case "teaching-staff":
        return <Navigate to="/user" replace />;
      default:
        // If we somehow get here with invalid credentials, reset redirect state
        localStorage.removeItem("authenticated");
        setRedirect(false);
    }
  }

  // Loading screen that shows for 15 seconds after successful login
  if (loadingData) {
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
        <h1 className="text-2xl font-semibold text-center text-black mb-5 md:mb-10">
          Login to Your Account
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