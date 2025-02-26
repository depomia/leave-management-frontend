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
      localStorage.setItem("user", JSON.stringify(name));
      localStorage.setItem("department", department);
      localStorage.setItem("role", role);
      localStorage.setItem("_id", _id);
      localStorage.setItem("authenticated", "true");
      console.log("Login successful");
      
      // Instead of navigating to a separate page, we'll set the redirect state
      setCurrentUser(role);
      setRedirect(true);
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || "Invalid credentials");
        console.error(error.response?.data);
      } else {
        setError("Something went wrong. Please try again.");
        console.error("Unknown error");
      }
    } finally {
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