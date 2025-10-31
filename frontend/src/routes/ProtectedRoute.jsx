import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthed } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthed()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
