import React, { useState, useEffect } from "react"; // Import React hooks
import Header from "../components/common/Header";
import ScheduleTable from "../components/schedule/ScheduleTable";

const Schedule = () => {
  // State to hold the list of all teachers
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch all teachers from the backend
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        // Assuming your API is running on localhost:5173 or similar,
        // and you can make a request to the Admin route endpoint we defined: /admin/allteachers
        const token = localStorage.getItem("token"); // Get auth token (adjust if needed)
        if (!token) {
          setError("Authentication token not found.");
          setLoadingTeachers(false);
          return;
        }

        // NOTE: Adjust the fetch URL if your base URL is different
        const response = await fetch("/api/admin/allteachers", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Store the teachers array
          setTeachers(data.teachers);
        } else {
          setError(data.message || "Failed to fetch teachers.");
        }
      } catch (err) {
        console.error("Error fetching teachers:", err);
        setError("Network error while fetching teachers.");
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10 h-screen">
      <Header title="Class Schedule" />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* Optional: Show loading/error states */}
        {loadingTeachers ? (
          <div className="text-center py-8 text-blue-500">
            Loading teacher list...
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            Error: {error}. Cannot assign teachers.
          </div>
        ) : (
          // Pass the fetched teachers list to the ScheduleTable component
          <ScheduleTable teachers={teachers} />
        )}
      </main>
    </div>
  );
};
export default Schedule;
