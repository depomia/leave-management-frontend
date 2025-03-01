// src/components/user-components/Auth/Logout.tsx

import { useEffect } from "react";
import { useAuth } from "../../context/ContextProvider";
import { useNavigate } from "react-router-dom";

const Logout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Execute logout
    logout();
    
    // Navigate to home
    navigate("/");
  }, [logout, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto animate-spin"></div>
        <p className="mt-4 text-gray-600">Logging out...</p>
      </div>
    </div>
  );
};

export default Logout;