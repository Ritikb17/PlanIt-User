import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

// Function to check if token is valid
const isTokenValid = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
    return payload.exp * 1000 > Date.now(); // Check if token is expired
  } catch (error) {
    return false; // If token is malformed, return false
  }
};

const PrivateRoute = () => {
  const [authenticated, setAuthenticated] = useState(isTokenValid());

  useEffect(() => {
    const handleStorageChange = () => {
      setAuthenticated(isTokenValid());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
