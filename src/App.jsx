import React, { useEffect, useMemo } from "react";
import { Navigate, Route, Routes, useLocation, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

// --- MOCK Definitions for compilation. REPLACE these with your actual imports. ---
// You must ensure these components/pages exist in your project structure.
// NOTE: Login/Signup now return minimal/null for a cleaner look.
const Sidebar = () => (
  <div className="p-4 bg-gray-700 w-40 flex-shrink-0">Sidebar MOCK</div>
);
const DashBoard = () => (
  <h1 className="text-2xl font-bold text-white">Dashboard Page MOCK</h1>
);
const Schedule = () => (
  <h1 className="text-2xl font-bold text-white">Schedule Page MOCK</h1>
);
const UsersPage = () => (
  <h1 className="text-2xl font-bold text-white">Users Page MOCK (Admin)</h1>
);
const Teachers = () => (
  <h1 className="text-2xl font-bold text-white">Teachers Page MOCK (Admin)</h1>
);
const Students = () => (
  <h1 className="text-2xl font-bold text-white">Students Page MOCK (Admin)</h1>
);
const SettingsPage = () => (
  <h1 className="text-2xl font-bold text-white">Settings Page MOCK</h1>
);
// Updated Mocks for Login/Signup: They now return null or a minimal div.
const Login = () => (
  <div className="text-white">
    Login component placeholder (requires implementation)
  </div>
);
const Signup = () => (
  <div className="text-white">
    Signup component placeholder (requires implementation)
  </div>
);
const NotFound = () => (
  <h1 className="text-3xl font-bold text-red-500">404 Not Found MOCK</h1>
);

// Mock the Layouts (These should be imported from their respective files in a real project)
const AdminLayout = () => {
  const { user } = useSelector((state) => state.Auth);
  // Role enforcement inside the layout
  if (user?.role !== "HOD") return <Navigate to="/unauthorized" replace />;
  return (
    <div className="flex flex-col h-full w-full">
      <h2 className="text-xl p-4 bg-purple-900">Admin/HOD Header</h2>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
};
const UserLayout = () => {
  const { user } = useSelector((state) => state.Auth);
  // Role enforcement inside the layout
  if (user?.role === "HOD") return <Navigate to="/admin/dashboard" replace />;
  return (
    <div className="flex flex-col h-full w-full">
      <h2 className="text-xl p-4 bg-blue-900">User Header</h2>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
};

// PublicLayout retains centering to correctly display the Login/Signup forms when implemented
const PublicLayout = () => {
  const { isAuthenticated, loading, user } = useSelector((state) => state.Auth);
  // Redirect authenticated users to their dashboard
  const path = user?.role === "HOD" ? "/admin/dashboard" : "/user/dashboard";
  if (!loading && isAuthenticated) return <Navigate to={path} replace />;

  // Renders child routes (Login/Signup) in a centered container
  return (
    <div className="flex items-center justify-center min-h-screen z-10 relative p-4">
      <Outlet />
    </div>
  );
};

// Mock Redux actions to resolve dependency errors
const updateUser = () => ({ type: "auth/updateUser" });
const setLoadingComplete = () => ({ type: "auth/setLoadingComplete" });
// -----------------------------------------------------------------------------

// --- Simple Loading Indicator ---
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen w-screen bg-gray-900 absolute inset-0 z-50">
    <svg
      className="animate-spin -ml-1 mr-3 h-10 w-10 text-indigo-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    <span className="text-gray-300 text-lg">Loading Application...</span>
  </div>
);

// --- 🎯 Auth Initializer Component (Token Checker) ---
const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  // Get token only if it exists in local storage initially, and use the Redux state
  const { loading } = useSelector((state) => state.Auth);
  const initialToken = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    // Dispatch updateUser if a token is present (to fetch user data/validate)
    if (initialToken) {
      dispatch(updateUser());
    } else {
      // If no token, we are immediately ready to render the public routes
      dispatch(setLoadingComplete());
    }
    // initialToken is stable, dispatch is stable, runs once on mount/token change
  }, [dispatch, initialToken]);

  // If the Redux 'loading' state is true, show the spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  // Once loading is false, render the main application content
  return children;
};

// --- Protected Route Wrapper (Handles Authentication & Initial Redirection) ---
const ProtectedWrapper = () => {
  const {
    isAuthenticated,
    user,
    loading: isLoadingRedux,
  } = useSelector((state) => state.Auth);
  const location = useLocation();

  // 1. Redirection if NOT authenticated (Priority 1)
  if (!isAuthenticated && !isLoadingRedux) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Loading Check (Priority 2)
  // Wait here until we have the user object
  if (isLoadingRedux || !user) {
    return <LoadingSpinner />;
  }

  // 3. Authorized and Loaded: Render the nested routes (which use the specific Layouts)
  return (
    <div className="flex justify-center h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <Outlet />
    </div>
  );
};

// --- Role-Based Dashboard Redirector ---
const DashboardRedirector = () => {
  const { user } = useSelector((state) => state.Auth);
  // Determine the path based on the validated user role
  const path = user?.role === "HOD" ? "/admin/dashboard" : "/user/dashboard";
  return <Navigate to={path} replace />;
};
// ------------------------------------------------

function App() {
  return (
    // Wrap the entire routing system in the AuthInitializer
    <AuthInitializer>
      {/* Background setup for persistent styling */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-80" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      {/* Single, Clean <Routes> block for ALL paths */}
      <Routes>
        {/* 1. PUBLIC ROUTES (Login, Signup, Handled by PublicLayout's redirect logic) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* 2. PROTECTED ROUTES - Wrapped by ProtectedWrapper for initial auth check */}
        <Route element={<ProtectedWrapper />}>
          {/* Index/Generic Dashboard Path Redirects to Role-Specific Dashboard */}
          <Route index element={<DashboardRedirector />} />
          <Route path="/dashboard" element={<DashboardRedirector />} />

          {/* A. HOD/Admin Routes - Use AdminLayout for role enforcement and structure */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<DashBoard />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="students" element={<Students />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* B. Standard User Routes - Use UserLayout for role enforcement and structure */}
          <Route path="/user" element={<UserLayout />}>
            <Route path="dashboard" element={<DashBoard />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Unauthorized Page Route */}
          <Route
            path="/unauthorized"
            element={
              <h1 className="text-3xl text-red-500">
                403 - Unauthorized Access
              </h1>
            }
          />
        </Route>

        {/* 3. FALLBACK FOR UNMATCHED ROUTES */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthInitializer>
  );
}

export default App;
