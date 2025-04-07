import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

// Function to check if token is valid (same as before)
const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    return false;
  }
};

const ReverseAuthRoutes = () => {
  const [hasValidToken, setHasValidToken] = useState(isTokenValid());

  useEffect(() => {
    const handleStorageChange = () => {
      setHasValidToken(isTokenValid());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // REVERSED LOGIC: Only show routes if NO valid token exists
  return !hasValidToken ? <Outlet /> : <Navigate to="/" replace />;
};

export default ReverseAuthRoutes;