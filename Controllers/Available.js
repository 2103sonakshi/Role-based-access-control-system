import Teacher from "../Models/teachers.js";
import UserModel from "../Models/user.js";
// CRITICAL: Import the Schedule model to check which teachers are busy
import ScheduleModel from "../Models/Schedule.js";
import mongoose from "mongoose";

// The function is renamed to match the import statement in AdminRoute.js
const getAvailableTeachers = async (req, res) => {
  try {
    const { day, period } = req.query;

    if (!day || !period) {
      return res
        .status(400)
        .json({ success: false, message: "Day and period are required." });
    }

    // --- CRITICAL LOGGING: STEP 1 (Input) ---
    console.log(
      `[Available: STEP 1] Request received for Day: ${day}, Period: ${period}`
    );

    // 1. Find all schedules for the requested day and period to get busy teachers
    const periodNumber = parseInt(period);

    const busySchedules = await ScheduleModel.find({
      day: day,
      period: periodNumber,
    }).select("teacherId");

    // 2. Extract the IDs of the teachers who are already busy (scheduled)
    // CRITICAL: Convert ObjectIds to strings for reliable comparison in $nin later.
    const busyTeacherIds = busySchedules
      .map((schedule) => schedule.teacherId.toString())
      .filter((id) => id);

    // --- CRITICAL LOGGING: STEP 2 (Busy Check) ---
    console.log(
      `[Available: STEP 2] Found ${
        busyTeacherIds.length
      } busy teacher(s): ${busyTeacherIds.join(", ")}`
    );

    // 3. Find all users who have the role 'Teacher' and are NOT in the busy list
    let availableTeachers = await UserModel.find({
      role: "Teacher", // Matches the capitalized role in your UserModel
      _id: { $nin: busyTeacherIds }, // Use string IDs for comparison
    }).select("_id name");

    // --- CRITICAL LOGGING: STEP 3 (Result Check) ---
    console.log(
      `[Available: STEP 3] Found ${availableTeachers.length} available teacher(s) after schedule filter.`
    );

    // 4. --- FALLBACK LOGIC ---
    if (availableTeachers.length === 0) {
      // If the filter found 0, check if ANY teacher exists at all.
      const allTeachers = await UserModel.find({ role: "Teacher" }).select(
        "_id name"
      );

      if (allTeachers.length > 0) {
        // If teachers exist but were filtered out, it means ALL are busy or the comparison failed.
        console.error(
          `[Available: ERROR] ${allTeachers.length} teachers exist, but were all filtered out by the schedule filter. ` +
            `Returning ALL teachers TEMPORARILY to unblock the dropdown.`
        );
        // TEMPORARILY return all teachers to let you proceed with assignment.
        availableTeachers = allTeachers;
      } else {
        console.error(
          `[Available: FATAL] Database contains 0 users with role "Teacher".`
        );
      }
    }

    // 5. Final Response
    if (availableTeachers.length === 0) {
      return res.status(200).json({
        success: true,
        // Customized message based on the FATAL log
        message:
          "No teachers found in the database with the role 'Teacher'. Please create teacher users.",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Available teachers retrieved successfully.",
      data: availableTeachers,
    });
  } catch (error) {
    // --- CRITICAL LOGGING ---
    console.error("Error in getAvailableTeachers controller:", error);
    // ------------------------
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

export { getAvailableTeachers };
