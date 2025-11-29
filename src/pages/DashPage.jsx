import React, { useState, useEffect, useCallback } from "react";
// External imports are commented out to prevent compilation errors in a single-file environment
import {
  School,
  Users,
  BookOpenText,
  UserCheck,
  LayoutDashboard,
  CalendarDays,
  UserPlus,
  X,
  Loader2,
  Save,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
// 🛑 FIX 1: Import the authenticated 'get' and 'put' functions
import { get, put } from "../services/ApiEndpoint";
import axios from "axios"; // Keep axios import for now, but we will remove hardcoded use

// =========================================================
// MOCKING EXTERNAL DEPENDENCIES AND COMPONENTS (Keep these)
// =========================================================

const useSelector = (selectorFn) => {
  return selectorFn({
    Auth: {
      user: {
        role: "HOD", // Mock user is HOD to view admin features
        name: "Mock HOD",
        _id: "60c72b1f9c1d440000a6f44d", // Mock ID
      },
    },
  });
};

const Header = ({ title }) => (
  <header className="bg-gray-800 shadow-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white flex items-center">
        <LayoutDashboard className="w-6 h-6 mr-3 text-blue-400" />
        {title}
      </h1>
    </div>
  </header>
);

const StatCard = ({ name, icon: Icon, value, color, linkTo }) => (
  <Link
    to={linkTo}
    className="block bg-gray-800 p-5 rounded-xl shadow-xl hover:shadow-blue-500/30 transition duration-300 transform hover:scale-[1.02] border-t-4 border-l-2"
    style={{ borderColor: color, borderLeftColor: color }}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-sm font-medium text-gray-400 mt-1">{name}</p>
      </div>
      <Icon className="w-8 h-8 opacity-70" style={{ color: color }} />
    </div>
  </Link>
);

const UserActivityList = ({ recentActivity }) => (
  <div className="bg-gray-800 p-6 rounded-xl shadow-xl mb-10 border border-gray-700">
    <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-3">
      Recent User Activity
    </h3>
    <p className="text-gray-400">
      This section displays a list of recent logins or actions.
    </p>
    <ul className="mt-3 space-y-2 text-sm text-gray-300">
      {recentActivity && recentActivity.length > 0 ? (
        recentActivity.map((activity, index) => (
          // ⚠️ FIX: Added 'key' prop for list rendering
          <li key={index}>
            - User **{activity.user}** {activity.action} **{activity.time}**.
          </li>
        ))
      ) : (
        <li>No recent activity logged.</li>
      )}
    </ul>
  </div>
);

// =========================================================
// ASSIGN TEACHER MODAL COMPONENT (NOW INTERNAL) (Keep this)
// =========================================================
const AssignTeacherModal = ({
  isOpen,
  onClose,
  initialScheduleItem,
  onAssignmentSuccess,
}) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTeachers = async () => {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      try {
        // 🛑 FIX 2: Use the authenticated 'get' instead of raw axios.get
        const response = await get("/users/teachers");

        const teacherList = response.data.filter(
          (user) => user.role === "Teacher"
        );
        // ⚠️ FIX: Added 'key' prop error check for teacher options
        setTeachers(teacherList);

        if (initialScheduleItem?.teacher?._id) {
          setSelectedTeacherId(initialScheduleItem.teacher._id);
        } else {
          setSelectedTeacherId("");
        }
      } catch (err) {
        console.error("Failed to fetch teachers:", err);
        setError("Failed to load list of available teachers.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, [isOpen, initialScheduleItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacherId || !initialScheduleItem?._id) {
      setError(
        "Please select a teacher and ensure the schedule item is valid."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 🛑 FIX 3: Use the authenticated 'put' instead of raw axios.put
      const response = await put(
        `/schedule/${initialScheduleItem._id}/assign`,
        {
          teacherId: selectedTeacherId,
        }
        // No need for { withCredentials: true } here, as it's handled by APIEndpoint.js
      );

      if (response.status === 200) {
        setSuccessMessage(
          "Teacher successfully assigned! Refreshing schedule..."
        );
        onAssignmentSuccess();
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      console.error("Assignment failed:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Failed to assign teacher. Please check server logs."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentTeacherName = initialScheduleItem?.teacher?.name || "Unassigned";

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 border border-blue-600/50">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <UserPlus className="w-6 h-6 mr-3 text-blue-400" />
            Assign Teacher to Class
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition duration-150 p-1 rounded-full hover:bg-gray-700"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
            <p className="text-lg font-semibold text-blue-300 mb-2">
              Schedule Slot Details:
            </p>
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-white">Course:</span>{" "}
              {initialScheduleItem?.course?.name || "N/A"}
              <span className="text-gray-400">
                {" "}
                ({initialScheduleItem?.course?.code || ""})
              </span>
            </p>
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-white">Group:</span>{" "}
              {initialScheduleItem?.studentGroup || "N/A"}
            </p>
            <p className="text-gray-300 text-sm">
              <span className="font-medium text-white">Time:</span>{" "}
              {initialScheduleItem?.dayOfWeek} / Period{" "}
              {initialScheduleItem?.period}
            </p>
            <p className="text-gray-300 text-sm mt-2">
              <span className="font-medium text-yellow-300">
                Currently Assigned:
              </span>{" "}
              {currentTeacherName}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label
              htmlFor="teacher-select"
              className="block text-sm font-medium text-gray-300"
            >
              Select Teacher to Assign
            </label>

            {loading ? (
              <div className="flex items-center text-blue-400">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Loading Teachers...
              </div>
            ) : error ? (
              <p className="text-red-400 font-medium">{error}</p>
            ) : (
              <select
                id="teacher-select"
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-700 text-white"
                disabled={isSubmitting || loading}
              >
                <option value="" disabled>
                  -- Select a Teacher --
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} ({teacher._id.slice(-4)})
                  </option>
                ))}
              </select>
            )}

            {successMessage && (
              <p className="text-green-400 font-medium p-2 bg-green-900/30 rounded-lg">
                {successMessage}
              </p>
            )}
            {error && !loading && (
              <p className="text-red-400 font-medium p-2 bg-red-900/30 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-700/50">
              <button
                type="button"
                onClick={onClose}
                className="mr-3 py-2 px-4 border border-gray-600 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition duration-150"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition duration-150 disabled:bg-blue-800 disabled:opacity-70"
                disabled={isSubmitting || !selectedTeacherId || loading}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? "Assigning..." : "Save Assignment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------
// SCHEDULE COMPONENTS (Keep these)
// -----------------------------------------------------------------

const ScheduleTableStructure = ({
  schedule,
  title,
  loading,
  error,
  userRole,
  onAssignClick,
}) => {
  const canAssign = userRole === "HOD";

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-xl mb-10 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-3">
        {title}
      </h3>
      {loading && (
        <p className="text-blue-400 flex items-center">
          <CalendarDays className="w-4 h-4 mr-2 animate-spin" /> Loading
          schedule...
        </p>
      )}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && schedule.length === 0 && (
        <p className="text-gray-400">
          No scheduled classes found for this group/user.
        </p>
      )}

      {!loading && schedule.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Day/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Group
                </th>
                {canAssign && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-gray-200">
              {schedule.map((item) => (
                <tr key={item._id}>
                  {" "}
                  {/* ⚠️ FIX: Used item._id for unique key */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.dayOfWeek} / P{item.period || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {item.course?.name || "N/A"} ({item.course?.code || ""})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.teacher?.name || "Unassigned"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.studentGroup || "N/A"}
                  </td>
                  {canAssign && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onAssignClick(item)}
                        className="text-blue-400 hover:text-blue-300 font-medium p-2 rounded-md transition duration-150 flex items-center bg-blue-900/30 hover:bg-blue-900/50"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Assign Teacher
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-gray-500 text-sm mt-4">
        This table displays the actual schedule data fetched from the backend.
      </p>
    </div>
  );
};

const LiveTeachersScheduleTable = ({
  teacherId,
  teacherName,
  userRole,
  onAssignClick,
  reloadKey,
}) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchSchedule = useCallback(async () => {
    if (!teacherId) {
      setError("Teacher ID is required to fetch schedule.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 🛑 FIX 4: Use authenticated 'get'
      const response = await get(`/schedule/teacher/${teacherId}`);

      setSchedule(response.data);
    } catch (err) {
      console.error("Failed to fetch teacher schedule:", err);
      setError("Could not load schedule. Server error or no data.");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule, reloadKey]);

  return (
    <ScheduleTableStructure
      schedule={schedule}
      title={`${teacherName}'s Schedule`}
      loading={loading}
      error={error}
      userRole={userRole}
      onAssignClick={onAssignClick}
    />
  );
};

const LiveStudentsScheduleTable = ({
  studentGroup,
  userRole,
  onAssignClick,
  reloadKey,
}) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchSchedule = useCallback(async () => {
    if (!studentGroup) {
      setError("Student group is not assigned to the user.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 🛑 FIX 5: Use authenticated 'get'
      const response = await get(`/schedule/student/${studentGroup}`);

      setSchedule(response.data);
    } catch (err) {
      console.error("Failed to fetch student schedule:", err);
      setError("Could not load schedule. Server error or no data.");
    } finally {
      setLoading(false);
    }
  }, [studentGroup]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule, reloadKey]);

  return (
    <ScheduleTableStructure
      schedule={schedule}
      title={`Student Schedule (Group: ${studentGroup})`}
      loading={loading}
      error={error}
      userRole={userRole}
      onAssignClick={onAssignClick}
    />
  );
};

const AdminScheduleView = ({ userRole, onAssignClick, reloadKey }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      // 🛑 FIX 6: Use authenticated 'get'
      const response = await get(`/schedule/admin`);

      setSchedule(response.data);
    } catch (err) {
      console.error("Failed to fetch admin schedule:", err);
      setError(
        "Could not load full schedule. (Authentication/Authorization error likely if not HOD)"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule, reloadKey]);

  return (
    <ScheduleTableStructure
      schedule={schedule}
      title="Full System Schedule (Admin View)"
      loading={loading}
      error={error}
      userRole={userRole}
      onAssignClick={onAssignClick}
    />
  );
};

// =========================================================
// DASHBOARD COMPONENT (MAIN LOGIC)
// =========================================================

const Dashboard = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null); // ⚠️ FIX 1: New state for error message
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduleItemToAssign, setScheduleItemToAssign] = useState(null);
  const [scheduleReloadKey, setScheduleReloadKey] = useState(0);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    teachingStaff: 0,
    studentEnrollment: 0,
    activeCourses: 0,
    recentActivity: [],
    hodCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.Auth.user);

  // ⚠️ FIX 2: Modified fetchDashboardData to handle and set errors
  const fetchDashboardData = async () => {
    try {
      // 🛑 CRITICAL FIX 7: Use the authenticated 'get' instead of raw axios.get
      const response = await get("/dashboard"); // Only need the endpoint path

      if (response.status === 200 && response.data) {
        const {
          totalUsers,
          teachingStaff,
          studentEnrollment,
          activeCourses,
          recentActivity,
        } = response.data;

        setMetrics({
          totalUsers: totalUsers,
          teachingStaff: teachingStaff,
          studentEnrollment: studentEnrollment,
          activeCourses: activeCourses,
          recentActivity: recentActivity,
          hodCount: totalUsers - teachingStaff - studentEnrollment,
        });
        setError(null); // Clear any previous error
      }
    } catch (error) {
      console.error(
        "Error fetching dashboard data.",
        error.response?.data || error.message
      );
      // Set a visible error message if the fetch fails
      setError(
        `Failed to load dashboard data. Status: ${
          error.response?.status || "Network Error"
        }. Check backend connection or ensure you are logged in.`
      );
      // Ensure metrics are set to zero/empty on failure to prevent rendering issues
      setMetrics({
        totalUsers: 0,
        teachingStaff: 0,
        studentEnrollment: 0,
        activeCourses: 0,
        recentActivity: [],
        hodCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (item) => {
    setScheduleItemToAssign(item);
    setIsModalOpen(true);
  };

  const handleAssignmentSuccess = () => {
    setScheduleReloadKey((prev) => prev + 1);
  };

  const handleCloseAssignModal = () => {
    setIsModalOpen(false);
    setScheduleItemToAssign(null);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ⚠️ FIX 3: Removed redundant user check/navigate as PrivateLayout handles it

  if (loading) {
    return (
      <div className="flex-1 overflow-auto relative z-10 h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 mr-3 animate-spin text-blue-400" />
        <p className="text-xl">Loading functional dashboard data...</p>
      </div>
    );
  }

  // ⚠️ FIX 4: Display error message if data fetch failed
  if (error) {
    return (
      <div className="flex-1 overflow-auto relative z-10 h-screen bg-gray-900 text-white p-10">
        <Header title="Overview - Data Error" />
        <div className="max-w-7xl mx-auto py-6">
          <div className="bg-red-900/40 p-6 rounded-xl border border-red-500 shadow-xl">
            <h2 className="text-2xl font-bold text-red-400 mb-2">
              Data Fetch Failed
            </h2>
            <p className="text-red-300">
              {error} Please ensure your **backend server is running** and that
              you are **properly authenticated**.
            </p>
            <p className="text-sm text-red-200 mt-3">
              *Check the Console (F12) for detailed network request errors.*
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No error, not loading: Render actual dashboard UI
  const totalActiveUsers = metrics.totalUsers;
  const mockStudentGroup = "Grade 10-A";

  return (
    <div className="flex-1 overflow-auto relative z-10 h-screen bg-gray-900">
      <Header title="Overview" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
          {user.role === "HOD" ? (
            <>
              <StatCard
                name="Total Active Users"
                icon={UserCheck}
                value={totalActiveUsers}
                color="#4F46E5"
                linkTo="/users"
              />

              <StatCard
                name="Teaching Staff"
                icon={Users}
                value={metrics.teachingStaff}
                color="#10B981"
                linkTo="/teachers"
              />

              <StatCard
                name="Student Enrollment"
                icon={BookOpenText}
                value={metrics.studentEnrollment}
                color="#F59E0B"
                linkTo="/students"
              />

              <StatCard
                name="Active Courses"
                icon={School}
                value={metrics.activeCourses}
                color="#EF4444"
                linkTo="/schedule"
              />
            </>
          ) : null}
        </div>

        {/* User Activity List */}
        <UserActivityList recentActivity={metrics.recentActivity} />

        {/* -----------------------------------------------------------------
            SCHEDULE LOGIC: Use LIVE components
            ----------------------------------------------------------------- */}

        {user.role === "Teacher" && (
          <LiveTeachersScheduleTable
            teacherId={user._id}
            teacherName={user.name}
            userRole={user.role}
            onAssignClick={handleOpenAssignModal}
            reloadKey={scheduleReloadKey}
          />
        )}

        {user.role === "Student" && (
          <LiveStudentsScheduleTable
            studentGroup={user.referenceId || mockStudentGroup}
            userRole={user.role}
            onAssignClick={handleOpenAssignModal}
            reloadKey={scheduleReloadKey}
          />
        )}

        {user.role === "HOD" && (
          <>
            <h3 className="text-2xl font-bold text-white mb-6 mt-10 border-b border-gray-700 pb-3">
              Admin Schedule Views
            </h3>
            <AdminScheduleView
              userRole={user.role}
              onAssignClick={handleOpenAssignModal}
              reloadKey={scheduleReloadKey}
            />
          </>
        )}
      </main>

      {/* The Modal Component is rendered here */}
      <AssignTeacherModal
        isOpen={isModalOpen}
        onClose={handleCloseAssignModal}
        initialScheduleItem={scheduleItemToAssign}
        onAssignmentSuccess={handleAssignmentSuccess}
      />
    </div>
  );
};
export default Dashboard;
