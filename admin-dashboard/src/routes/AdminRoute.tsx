import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const storedUser = localStorage.getItem("chatflow_user");

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(storedUser);

  const isAdmin =
    user.roles &&
    Array.isArray(user.roles) &&
    user.roles.includes("Admin");

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;