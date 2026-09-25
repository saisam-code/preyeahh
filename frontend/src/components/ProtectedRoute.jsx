import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guards a route (or nested routes via <Outlet/>) by auth + role.
 *
 * Usage:
 *   <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
 *     <Route path="/admin" element={<Admin />} />
 *   </Route>
 *
 * @param {string[]} [allowedRoles] - if omitted, any authenticated user passes.
 * @param {string}   [redirectTo]   - where to send unauthenticated users.
 */
export default function ProtectedRoute({ allowedRoles, redirectTo = "/" }) {
  const { user, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="empty" style={{ padding: "4rem 0" }}>
        <div className="icon">
          <i className="fa fa-spinner fa-spin" />
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
