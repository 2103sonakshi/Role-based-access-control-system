// backend/Controllers/Schedule.js

import ScheduleModel from "../Models/Schedule.js";
// Assuming your Course model is named Course.js and uses export default
import CourseModel from "../Models/Course.js";
// Assuming your User model is named user.js and uses export default
import UserModel from "../Models/user.js";

// --- Function to fetch a specific teacher's schedule ---
export const getTeacherSchedule = async (req, res) => {
  // In a real app, you'd get the teacherId from req.user or a parameter
  const { teacherId } = req.params;

  try {
    const schedule = await ScheduleModel.find({ teacher: teacherId })
      // Populate the course field to get the course name
      .populate("course", "name code")
      .sort({ dayOfWeek: 1, startTime: 1 }); // Sort by day and time

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching teacher schedule:", error);
    res.status(500).json({ message: "Failed to fetch teacher schedule." });
  }
};

// --- Function to fetch a specific student's schedule ---
export const getStudentSchedule = async (req, res) => {
  // In a real app, you'd get the studentGroup from req.user
  const { studentGroup } = req.params;

  try {
    const schedule = await ScheduleModel.find({ studentGroup: studentGroup })
      // Populate course and teacher details
      .populate("course", "name code")
      .populate("teacher", "name")
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json(schedule);
  } catch (error) {
    console.error("Error fetching student schedule:", error);
    res.status(500).json({ message: "Failed to fetch student schedule." });
  }
};

// --- Function for Admin View (e.g., fetch ALL scheduled items) ---
export const getAllSchedules = async (req, res) => {
  try {
    // Fetch all schedules for the admin/HOD view
    const allSchedules = await ScheduleModel.find({})
      .populate("course", "name code")
      .populate("teacher", "name")
      .sort({ studentGroup: 1, dayOfWeek: 1, startTime: 1 });

    res.status(200).json(allSchedules);
  } catch (error) {
    console.error("Error fetching all schedules:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch all schedules for admin view." });
  }
};
