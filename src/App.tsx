// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/context/ProtectedRoute";
import User from "./pages/User";
import HomePage from "./pages/HomePage";
import Layout from "./pages/Layout";
import GetUserById from "./components/user-components/Users/GetUserById";
import Error from "./components/user-components/Misc-Pages/Error";
import NavigatePage from "./components/user-components/Auth/NavigatePage";
import UserView from "./components/user-components/Users/UserView";
import DepartmentView from "./components/user-components/Departments/DepartmentView";
import Logout from "./components/user-components/Auth/Logout";
import { AuthProvider } from "./components/context/ContextProvider";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route path="/logout" element={<Logout />} />
      <Route path="/navigate" element={<NavigatePage />} />
      <Route index element={<HomePage />} />

      {/* Protected Routes for Admin Page  */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Admin children={<UserView />} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/department"
        element={
          <ProtectedRoute roles={["admin"]}>
            <Admin children={<DepartmentView />} />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes for User Page  */}
      <Route
        path="/user"
        element={
          <ProtectedRoute roles={["non-teaching-staff", "teaching-staff", "hod", "principal", "director"]}>
            <Admin children={<User />} />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes for Higher Authority - HOD, DIRECTOR, PRINCIPAL  */}
    </Route>
    <Route path="*" element={<Error />} />
  </Routes>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;