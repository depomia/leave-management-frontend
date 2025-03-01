import LeaveView from "@/components/user-components/Leaves/LeaveView"
import { useEffect } from "react";


const User = () => {
    useEffect(() => {
      if (!sessionStorage.getItem("reloaded")) {
        window.location.reload();
        sessionStorage.setItem("reloaded", "true");
      }
    }, []);
  return (
    <div>
      <LeaveView />
      
    </div>
  )
}

export default User
