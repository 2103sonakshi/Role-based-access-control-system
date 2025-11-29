import React from "react";
import { Outlet, Navigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

// --- MOCK LOGOUT ACTION ---
// This is defined locally to resolve the "Could not resolve" error for "../../Redux/AuthSlice".
// It dispatches a standard action type that your Redux reducer should handle.
const Logout = () => ({ type: "auth/logout" });

// --- Helper Components (Simplified for single-file context) ---

const Navbar = ({ userRole, onLogout, user }) => (
  <nav className="bg-blue-800 text-white p-4 flex justify-between items-center shadow-lg">
    <span className="text-xl font-bold capitalize">User Portal</span>
    <div className="flex items-center space-x-4">
      <span className="text-sm text-blue-200 capitalize">
        Welcome, {user?.name || user?.email} (Role: {userRole})
      </span>
      <button
        onClick={onLogout}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-lg transition duration-200"
      >
        Logout
      </button>
    </div>
  </nav>
);

const Sidebar = ({ userRole }) => (
  <div className="w-64 bg-gray-800 p-4 flex flex-col space-y-2 border-r border-gray-700 text-gray-300">
    <Link
      to={`/user/dashboard`}
      className="hover:text-white transition duration-150"
    >
      Dashboard
    </Link>
    <Link
      to="/user/schedule"
      className="hover:text-white transition duration-150"
    >
      My Schedule
    </Link>
    <Link
      to="/user/profile"
      className="hover:text-white transition duration-150"
    >
      Profile Settings
    </Link>
  </div>
);

// --- Main Layout Component ---

export default function UserLayout() {
  const dispatch = useDispatch();
  // Get all necessary authentication state variables
  const { user, isAuthenticated, loading } = useSelector((state) => state.Auth);
  const userRole = user?.role;

  const handleLogout = () => {
    // Dispatch the locally defined Logout action
    dispatch(Logout());
    // The application's root component should handle navigation away from protected routes on logout.
  };

  // 1. Check Loading State: Wait while the authentication status is being determined.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p className="text-xl animate-pulse">Loading User Portal...</p>
      </div>
    );
  }

  // 2. Check Authentication: If not logged in, redirect to login page.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Check Authorization (Role): If logged in but the role is NOT 'user'.
  if (userRole === "HOD") {
    // Redirect HODs (Admin) to their specific admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If the role is neither 'user' (the expected role) nor 'HOD', assume unauthorized
  if (userRole !== "user") {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Authorized: Render the User Layout structure
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Navbar userRole={userRole} onLogout={handleLogout} user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar userRole={userRole} />
        <main className="flex-1 p-6 overflow-y-auto">
          {/* This renders the child route content (e.g., Dashboard, Schedule) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
