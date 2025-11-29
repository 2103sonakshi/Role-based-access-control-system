// backend/Controllers/Dashboard.js

import UserModel from "../Models/user.js";
import CourseModel from "../Models/Course.js";
// Note: Ensure your models (user.js and Course.js) use 'export default'
// and correctly define and export the Mongoose model.

export const getDashboardMetrics = async (req, res) => {
  try {
    // --- 1. Fetch Counts for Overview Cards (Metrics) ---

    // Using .estimatedDocumentCount() for simple total counts, which is generally faster
    // and less prone to environment/indexing errors than countDocuments({})
    // when you don't need filters.

    const totalUsers = await UserModel.estimatedDocumentCount();

    // These queries require filtering, so we stick to countDocuments:

    // Counts users where the 'role' field is 'Teacher':
    const teachingStaff = await UserModel.countDocuments({ role: "Teacher" });

    // Counts users where the 'role' field is 'Student':
    const studentEnrollment = await UserModel.countDocuments({
      role: "Student",
    });

    // Counts all documents in the Course collection:
    const activeCourses = await CourseModel.estimatedDocumentCount();

    // --- 2. Placeholder for Recent Activity ---
    // NOTE: This uses placeholder data until you create a functional ActivityLog model.
    const recentActivity = [
      { user: "John Doe", action: "logged in", time: "5 minutes ago" },
      { user: "Jane Smith", action: "updated profile", time: "10 minutes ago" },
      { user: "Admin", action: "assigned new schedule", time: "1 hour ago" },
    ];

    // --- 3. Send the compiled data as a single JSON response ---
    res.status(200).json({
      totalUsers,
      teachingStaff,
      studentEnrollment,
      activeCourses,
      recentActivity,
    });
  } catch (error) {
    // Log the full error to the console for debugging
    console.error("Critical Error fetching dashboard metrics:", error);

    // Return a 500 status with a clear message
    res.status(500).json({
      message:
        "Failed to fetch dashboard data. Check the server console for details.",
      error: error.message,
    });
  }
};
