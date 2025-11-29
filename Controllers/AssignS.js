import Schedule from "../Models/schedule.js";
import Teacher from "../Models/teachers.js"; // Assuming this is the Teacher Profile model

const assignTeacher = async (req, res) => {
  try {
    // Data received from frontend ScheduleTable.jsx
    const { classId, teacherId, day, period } = req.body;

    if (!classId || !teacherId || !day || !period) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required!" });
    }

    // --- 1. Check if the Teacher is available for the slot ---
    const teacherProfile = await Teacher.findOne({
      userId: teacherId,
      available: {
        $elemMatch: {
          day: day,
          periods: { $elemMatch: { period: period, isAvailable: true } },
        },
      },
    });

    if (!teacherProfile) {
      // This error means the teacher is either non-existent or currently unavailable for this specific slot.
      return res.status(400).json({
        success: false,
        message:
          "Teacher is not available for the specified slot or already assigned!",
      });
    }

    // --- 2. Check if the schedule slot is already assigned ---
    const existingSchedule = await Schedule.findOne({ classId, day, period });
    if (existingSchedule) {
      return res.status(409).json({
        success: false,
        message: "This slot is already assigned to a course/class!",
      });
    }

    // --- 3. Create the new schedule entry ---
    const schedule = await Schedule.create({ classId, teacherId, day, period });

    // --- 4. Update the Teacher's Availability Status (set isAvailable to false) ---
    // Simplified query to find the teacher: { userId: teacherId }
    await Teacher.updateOne(
      { userId: teacherId },
      {
        // Use array filters to target the exact nested document
        $set: {
          "available.$[dayFilter].periods.$[periodFilter].isAvailable": false,
        },
      },
      {
        // Define the array filters to pinpoint the day and period
        arrayFilters: [
          { "dayFilter.day": day },
          { "periodFilter.period": period },
        ],
        runValidators: true,
      }
    );

    // --- 5. IMPORTANT: Add the new schedule to the teacher's assignedSchedules array ---
    // This keeps your Teacher model consistent with the schedule change.
    await Teacher.updateOne(
      { userId: teacherId },
      {
        $push: {
          assignedSchedules: { classId, day, period },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Teacher assigned successfully!",
      schedule,
    });
  } catch (error) {
    // CRITICAL: Log the actual error to the console for debugging
    console.error("Error in assignTeacher controller:", error);
    res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

export { assignTeacher };
