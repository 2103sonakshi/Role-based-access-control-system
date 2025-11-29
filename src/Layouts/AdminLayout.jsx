import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AdminLayout() {
  // Use useSelector to get the necessary authentication state
  // Assuming the Redux state structure is { Auth: { user: { role: 'HOD' }, isAuthenticated: true, loading: false } }
  const { user, isAuthenticated, loading } = useSelector((state) => state.Auth);

  // 1. Check Loading State: If the app is verifying the token (e.g., initial load), wait.
  // This prevents flickering redirects before we know the true auth state.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  // 2. Check Authentication: If the user is not authenticated or the user object is missing,
  // redirect them immediately to the login page.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Check Authorization (Role): If logged in but the role is not the required 'HOD',
  // redirect them to an unauthorized page.
  if (user.role !== "HOD") {
    // Optionally, you might redirect them to their specific dashboard if they have one (e.g., /user/dashboard)
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Authorized: The user is authenticated and has the correct 'HOD' role.
  // Render the content for the Admin Layout, which typically wraps the Outlet
  // with a Sidebar and Header. If your main layout components are defined outside
  // this file, you need to ensure they are available in your build.
  return (
    // Placeholder for your actual layout structure (e.g., Sidebar, Header)
    <div className="flex h-screen bg-gray-900">
      {/* <Sidebar role={user.role} /> */}
      <div className="flex-1 overflow-auto">
        {/* <Header user={user} /> */}
        <Outlet />
      </div>
    </div>
  );
}
