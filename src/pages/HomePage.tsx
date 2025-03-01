import { Button } from "@/components/ui/button";
import * as motion from "motion/react-client";
import { motion as m } from "framer-motion";
import { useNavigate } from "react-router-dom";
import employee from "../assets/employee.jpg";
import LoginForm from "@/components/user-components/Auth/Login";
import Loading from "@/components/user-components/Misc-Pages/Loading";

const HomePage = () => {
  const navigate = useNavigate();

  function handleClick() {
    navigate("/login");
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <img
        src={employee}
        alt="Employee"
        className="absolute inset-0 w-full h-full object-cover brightness-75 -z-20"
      />
      <div className="container md:min-h-[700px] md:my-32 flex-col justify-center md:mx-44 overflow-hidden">
        {/* Text section has been completely removed */}
        
        {/* Login form centered on the page */}
        <div className="min-h-[700px] min-w-[500px] mx-auto flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default HomePage;