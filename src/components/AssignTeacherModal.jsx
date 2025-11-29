import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, UserPlus, Calendar, Clock, BookOpen } from "lucide-react";

// --- Data for Select Fields (Should match your backend constants) ---
const DAYS = [
  { label: "Monday", value: "M" },
  { label: "Tuesday", value: "T" },
  { label: "Wednesday", value: "W" },
  { label: "Thursday", value: "Th" },
  { label: "Friday", value: "F" },
];
const PERIODS = Array.from({ length: 8 }, (_, i) => ({
  label: `Period ${i + 1}`,
  value: i + 1,
}));

// Mock Course Data - REPLACE with API fetch if needed
const MOCK_COURSES = [
  { _id: "course1", name: "Mathematics", studentGroup: "Grade 10-A" },
  { _id: "course2", name: "Physics", studentGroup: "Grade 10-A" },
  { _id: "course3", name: "History", studentGroup: "Grade 11-B" },
];

const AssignTeacherModal = ({ isOpen, onClose, initialScheduleItem }) => {
  const [selectedDay, setSelectedDay] = useState(
    initialScheduleItem?.dayOfWeek || DAYS[0].value
  );
  const [selectedPeriod, setSelectedPeriod] = useState(
    initialScheduleItem?.period || PERIODS[0].value
  );
  const [selectedCourseId, setSelectedCourseId] = useState(
    initialScheduleItem?.course?._id || MOCK_COURSES[0]._id
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    initialScheduleItem?.teacher?._id || ""
  );

  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [courses, setCourses] = useState(MOCK_COURSES); // Using mock data for simplicity
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    message: null,
    type: null,
  });

  // 1. Fetch available teachers based on selected Day and Period
  useEffect(() => {
    if (!isOpen) return;

    const fetchAvailableTeachers = async () => {
      setLoadingTeachers(true);
      setAvailableTeachers([]);
      try {
        // This is the CRITICAL backend endpoint we fixed earlier
        const response = await axios.get(
          `http://localhost:5000/api/admin/availableTeachers?day=${selectedDay}&period=${selectedPeriod}`,
          { withCredentials: true }
        );

        // The response.data should contain an array of teacher objects {_id, name}
        if (response.data.success && response.data.data) {
          setAvailableTeachers(response.data.data);
        } else {
          setAvailableTeachers([]);
          console.warn("No available teachers found.");
        }
      } catch (error) {
        console.error("Error fetching available teachers:", error);
        setSubmitStatus({ message: "Error fetching teachers.", type: "error" });
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchAvailableTeachers();
  }, [isOpen, selectedDay, selectedPeriod]);

  // 2. Handle the final assignment submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ message: "Assigning...", type: "info" });

    const selectedCourse = courses.find((c) => c._id === selectedCourseId);

    if (!selectedCourseId || !selectedTeacherId) {
      setSubmitStatus({
        message: "Please select a course and a teacher.",
        type: "error",
      });
      return;
    }

    try {
      // This is the endpoint that creates/updates the schedule slot
      const payload = {
        day: selectedDay,
        period: parseInt(selectedPeriod),
        courseId: selectedCourseId,
        teacherId: selectedTeacherId,
        // Assuming you need studentGroup for the schedule model
        studentGroup: selectedCourse.studentGroup,
      };

      // This POST request creates the schedule entry
      await axios.post(`http://localhost:5000/api/schedule/create`, payload, {
        withCredentials: true,
      });

      setSubmitStatus({ message: "Assignment successful!", type: "success" });
      // Close modal after a short delay to show success message
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error(
        "Assignment failed:",
        error.response?.data || error.message
      );
      setSubmitStatus({
        message: `Assignment failed: ${
          error.response?.data?.message || "Server error"
        }`,
        type: "error",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <UserPlus className="w-6 h-6 mr-3 text-blue-400" />
            Assign Teacher to Slot
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Status Message */}
          {submitStatus.message && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                submitStatus.type === "error"
                  ? "bg-red-900/50 text-red-300"
                  : submitStatus.type === "success"
                  ? "bg-green-900/50 text-green-300"
                  : "bg-blue-900/50 text-blue-300"
              }`}
            >
              {submitStatus.message}
            </div>
          )}

          {/* Day Selector */}
          <div className="flex items-center space-x-4">
            <label
              htmlFor="day"
              className="w-1/4 text-gray-300 font-medium flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2 text-blue-400" /> Day
            </label>
            <select
              id="day"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-3/4 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {DAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-4">
            <label
              htmlFor="period"
              className="w-1/4 text-gray-300 font-medium flex items-center"
            >
              <Clock className="w-4 h-4 mr-2 text-blue-400" /> Period
            </label>
            <select
              id="period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-3/4 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Course Selector (Mocked) */}
          <div className="flex items-center space-x-4">
            <label
              htmlFor="course"
              className="w-1/4 text-gray-300 font-medium flex items-center"
            >
              <BookOpen className="w-4 h-4 mr-2 text-blue-400" /> Course
            </label>
            <select
              id="course"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-3/4 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.studentGroup})
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Selector (Populated from API) */}
          <div className="flex items-center space-x-4">
            <label
              htmlFor="teacher"
              className="w-1/4 text-gray-300 font-medium flex items-center"
            >
              <Users className="w-4 h-4 mr-2 text-blue-400" /> Teacher
            </label>
            <select
              id="teacher"
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-3/4 p-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              required
              disabled={loadingTeachers}
            >
              {loadingTeachers && (
                <option>Loading available teachers...</option>
              )}
              {!loadingTeachers && availableTeachers.length === 0 && (
                <option value="">No teacher available or none exist.</option>
              )}

              {!loadingTeachers && availableTeachers.length > 0 && (
                <>
                  <option value="" disabled>
                    Select a Teacher
                  </option>
                  {availableTeachers.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-700">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md flex items-center justify-center disabled:bg-blue-800"
              disabled={loadingTeachers || submitStatus.type === "info"}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTeacherModal;
