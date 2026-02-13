import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

export default function RequireAdmin({ children, roles = ["ADMIN_TRAIN", "SUPER_ADMIN"] }) {
  const { user, booting } = useAuth();

  if (booting) return <div style={{ padding: 16 }}>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // If your backend role is "admin" or "train_admin", change roles array above
  if (roles?.length && !roles.includes(user.role)) {
    return (
      <div style={{ padding: 16 }}>
        <h3>Forbidden</h3>
        <p>Your account role is: <b>{user.role || "unknown"}</b></p>
        <p>Required: {roles.join(", ")}</p>
      </div>
    );
  }

  return children;
}
