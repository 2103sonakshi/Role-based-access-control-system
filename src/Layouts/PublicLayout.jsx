import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PublicLayout() {
  // Access the authentication state, including the loading status and user details
  const { user, isAuthenticated, loading } = useSelector((state) => state.Auth);
  const userRole = user?.role;

  // 1. Check Loading State: Wait while the authentication status is being determined.
  // This is crucial to prevent authenticated users from seeing a brief flash of the login page.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl animate-pulse">Checking Session...</p>
      </div>
    );
  }

  // 2. Check Authentication: If the user is logged in (isAuthenticated is true) AND we have a role.
  if (isAuthenticated && userRole) {
    // Determine the correct dashboard path based on the user's role ('HOD' is admin).
    const landingPath =
      userRole === "HOD" ? "/admin/dashboard" : "/user/dashboard";

    // Immediately redirect the authenticated user away from the public pages (Login/Signup).
    return <Navigate to={landingPath} replace />;
  }

  // 3. Not Authenticated: If the user is not authenticated or the loading is complete
  // and no user/token was found, render the child route (Login or Signup).
  return <Outlet />;
}
