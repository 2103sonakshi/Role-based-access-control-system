import { motion } from "framer-motion";
import { X, Search, Trash2, CalendarCheck, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { get, post } from "../../services/ApiEndPoint";
// CRITICAL: We need axios to ensure auth tokens are sent correctly
import axios from "axios";

// ⬅️ CRITICAL FIX 1: Accept the 'teachers' prop from the parent component
const ScheduleTable = ({ teachers = [] }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  // Initialized to empty array []
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Initialized to empty array []
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  // Initialized to empty array []
  const [scheduleData, setScheduleData] = useState([]);
  const [fdata, setFdata] = useState();
  const [selectedClass, setSelectedClass] = useState("Select a class");

  const dayMap = {
    M: "Monday",
    T: "Tuesday",
    W: "Wednesday",
    Th: "Thursday",
    F: "Friday",
  };

  const initializeSchedule = () => {
    return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
      (day) => ({
        name: day,
        schedule: Array(4).fill(null),
      })
    );
  };

  const fetchSchedules = async (classId) => {
    try {
      // 🔄 Use axios.get with withCredentials for secure route
      const response = await axios.get(`/api/admin/classS/${classId}`, {
        withCredentials: true,
      });

      const data = response.data;
      setFdata(data);

      const scheduleMap = initializeSchedule();

      if (
        data.success &&
        data.message === "Class schedule retrieved successfully!"
      ) {
        toast.success(data.message);

        data.schedules.forEach((item) => {
          const dayName = dayMap[item.day];
          const dayIndex = scheduleMap.findIndex((d) => d.name === dayName);
          if (dayIndex !== -1) {
            // Check if teacherId is an object (populated) and has a name property
            const teacherName =
              item.teacherId && item.teacherId.name
                ? item.teacherId.name
                : "Unassigned";
            scheduleMap[dayIndex].schedule[item.period - 1] = teacherName;
          }
        });
      } else if (data.success && data.message === "No schedules found!") {
        toast.success(data.message);
      }

      setScheduleData(scheduleMap);
      setFilteredSchedules(scheduleMap);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Unauthorized: Please log in again.");
      } else {
        toast.error(
          error.response?.data?.message || "Error fetching schedules"
        );
      }
      console.error("Error fetching schedules:", error);
    }
  };

  useEffect(() => {
    if (selectedClass !== "Select a class") {
      fetchSchedules(selectedClass);
    } else {
      const emptySchedule = initializeSchedule();
      setScheduleData(emptySchedule);
      setFilteredSchedules(emptySchedule);
    }
  }, [selectedClass]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    // CRITICAL FIX: Ensure scheduleData is an array before filtering
    const dataToFilter = scheduleData || [];
    const filtered = dataToFilter.filter((day) =>
      day.name.toLowerCase().includes(term)
    );
    setFilteredSchedules(filtered);
  };

  const handleDeleteAssignment = async (dayName, index) => {
    // CRITICAL FIX: Ensure scheduleData is an array before spreading
    const updatedSchedule = [...(scheduleData || [])];
    const dayIndex = updatedSchedule.findIndex((day) => day.name === dayName);

    if (dayIndex !== -1) {
      const assignment = updatedSchedule[dayIndex].schedule[index];

      const reverseDayMap = Object.fromEntries(
        Object.entries(dayMap).map(([key, value]) => [value, key])
      );
      const day = reverseDayMap[dayName];

      if (assignment && assignment !== "-") {
        const scheduleItem = fdata?.schedules?.find(
          (item) => item.day === day && item.period === index + 1
        );

        if (scheduleItem) {
          const scheduleId = scheduleItem._id;
          try {
            // 🔄 Use axios.post for DELETE with withCredentials
            const request = await axios.post(
              `/api/admin/deleteS/${scheduleId}`,
              {}, // Empty body for a delete action
              { withCredentials: true }
            );
            toast.success(request.data.message);

            // Optimistic update of the UI
            updatedSchedule[dayIndex].schedule[index] = null;
            setScheduleData(updatedSchedule);
            setFilteredSchedules(
              // CRITICAL FIX: Ensure filteredSchedules is an array before mapping
              (filteredSchedules || []).map((day) =>
                day.name === dayName
                  ? {
                      ...day,
                      schedule: day.schedule.map((s, i) =>
                        i === index ? null : s
                      ),
                    }
                  : day
              )
            );
          } catch (error) {
            if (error.response && error.response.status === 401) {
              toast.error("Unauthorized: Cannot delete assignment.");
            } else {
              toast.error(
                error.response?.data?.message || "Failed to delete assignment"
              );
            }
          }
        }
      } else {
        toast.error("No assignment to delete at this period!");
      }
    } else {
      toast.error("Error: Day not found!");
    }
  };

  const handleAssign = (dayName, index) => {
    setSelectedPeriod(index + 1);

    const reverseDayMap = Object.fromEntries(
      Object.entries(dayMap).map(([key, value]) => [value, key])
    );
    const day = reverseDayMap[dayName];
    setSelectedDay(day);

    // Clear previous selection
    setSelectedTeacher("");

    // Fetch available teachers
    const fetchTeachers = async () => {
      try {
        // 🔄 Use axios.get for fetching teachers with withCredentials
        const response = await axios.get(
          `/api/admin/available?day=${day}&period=${index + 1}`,
          { withCredentials: true }
        );

        // ⬅️ CRITICAL FIX 2: Robust data extraction for available teachers
        let availableData = [];
        if (Array.isArray(response.data.data)) {
          availableData = response.data.data;
        } else if (Array.isArray(response.data.availableTeachers)) {
          // Check for a common property name
          availableData = response.data.availableTeachers;
        } else if (Array.isArray(response.data)) {
          // Fallback for an array returned at the root
          availableData = response.data;
        }

        setAvailableTeachers(availableData);

        if (availableData.length === 0) {
          toast(
            "No available teachers found for this slot. Showing all teachers as an option.",
            { icon: "⚠️" }
          );
        }
      } catch (error) {
        // --- ADDED DEBUG LOGGING HERE ---
        console.error(
          "Error fetching available teachers:",
          error.response?.data || error
        );
        // -------------------------------
        if (error.response && error.response.status === 401) {
          toast.error("Unauthorized: Cannot fetch available teachers.");
        } else {
          // Display server message if available, otherwise a generic one
          // ⬅️ Fallback message informs user we are showing all teachers now
          toast.error(
            error.response?.data?.message ||
              "Failed to fetch available teachers. Showing all teachers."
          );
        }
        // ⬅️ Fallback: If fetching available teachers fails, use the full list passed as prop.
        setAvailableTeachers(teachers);
      }
    };

    fetchTeachers();
    setShowPopup(true);
  };

  const handleAssignTeacher = async () => {
    // 1. Robust check for the empty string (which is the default value)
    if (!selectedTeacher) {
      toast.error("Please select a teacher from the list.");
      console.log("Assignment failed: No teacher selected."); // DEBUG LOG
      return;
    }

    try {
      const assignmentPayload = {
        classId: selectedClass,
        teacherId: selectedTeacher,
        day: selectedDay,
        period: selectedPeriod,
      };

      // --- ADDED DEBUG LOGGING HERE ---
      console.log(
        "Attempting to assign teacher with payload:",
        assignmentPayload
      );
      // -------------------------------

      // 🔄 Use axios.post for assignment with withCredentials
      const response = await axios.post(
        `/api/admin/assignS`,
        assignmentPayload, // Use the payload variable
        { withCredentials: true }
      );

      toast.success(response.data.message);
      setShowPopup(false);
      // Re-fetch the schedule to update the table
      fetchSchedules(selectedClass);
    } catch (error) {
      // --- ADDED DETAILED ERROR LOGGING HERE ---
      console.error(
        "Error during teacher assignment:",
        error.response?.data || error
      );
      // -----------------------------------------

      if (error.response && error.response.status === 401) {
        toast.error("Unauthorized token. Please log in again.");
      } else {
        // Display the server's specific message if available, otherwise a generic one
        toast.error(
          error.response?.data?.message ||
            "Assignment failed due to a server error."
        );
      }
    }
  };

  // Determine which list to use for the dropdown: available list, or all teachers list (as a fallback)
  const dropdownTeachers =
    availableTeachers.length > 0 ? availableTeachers : teachers;

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-100">Schedule Table</h2>
        <div className="flex gap-4">
          <select
            className="bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSelectedClass(e.target.value)}
            value={selectedClass}
          >
            <option value="Select a class">Select a class</option>
            <option value="CST101">CST101</option>
            <option value="MAT101">MAT101</option>
          </select>
        </div>
      </div>

      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search schedules..."
          className="bg-gray-700 text-white placeholder-gray-400 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={handleSearch}
          value={searchTerm}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Day
              </th>
              {["1st Hour", "2nd Hour", "3rd Hour", "4th Hour"].map((hour) => (
                <th
                  key={hour}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  {hour}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700">
            {/* CRITICAL FIX: Use the Logical OR (||) operator to ensure filteredSchedules is an array */}
            {(filteredSchedules || []).map((day) => (
              <motion.tr
                key={day.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100 flex gap-2 items-center">
                  <CalendarCheck size={18} />
                  {day.name}
                </td>
                {/* Ensure day.schedule is also treated defensively */}
                {(day.schedule || []).map((subject, index) => (
                  <td
                    key={index}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                  >
                    <div className="flex items-center ">
                      <span>{subject || ""}</span>

                      {selectedClass !== "Select a class" &&
                        (subject ? (
                          <button
                            className="text-red-400 hover:text-red-300 ml-2"
                            onClick={() =>
                              handleDeleteAssignment(day.name, index)
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            className="text-green-400 hover:text-green-300"
                            onClick={() => handleAssign(day.name, index)}
                          >
                            <Plus size={16} />
                          </button>
                        ))}
                    </div>
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>

        {showPopup && (
          <div className="fixed inset-0 flex justify-center items-center bg-gray-700 bg-opacity-50 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-80 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  Assign Teacher
                </h3>
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-gray-500 hover:text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Day: {dayMap[selectedDay] || selectedDay}
                  </label>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Period: {selectedPeriod}
                  </label>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300">
                    Select Teacher
                  </label>
                  <select
                    className="w-full mt-1 p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    value={selectedTeacher}
                  >
                    <option value="">Select a teacher</option>
                    {/* ⬅️ CRITICAL FIX 3: Use the robust 'dropdownTeachers' list */}
                    {dropdownTeachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-800 disabled:opacity-50"
                    onClick={handleAssignTeacher}
                    disabled={!selectedTeacher}
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ScheduleTable;
