// --- CRITICAL: We import the Teacher model (from teachers.js)
// and the User model (from user.js) ---
import Teacher from "../Models/teachers.js";
import Schedule from "../Models/schedule.js";
import User from "../Models/user.js";

// --- EXISTING FUNCTION (Retrieves a specific teacher's schedule) ---

const getTschedule = async (req, res) => {
  try {
    const tId = req.params.tId;

    const schedules = await Schedule.find({ teacherId: tId });

    if (!schedules.length) {
      return res
        .status(404)
        .json({ success: false, message: "No schedules found for You!" });
    }

    res.status(200).json({
      success: true,
      message: "Class schedule retrieved successfully!",
      schedules,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error." });
    console.error(error);
  }
};

// --- CORRECTED FUNCTION (Uses POPULATE to get name from User model) ---

const getAllTeachers = async (req, res) => {
  try {
    // 1. Find all Teacher documents
    // 2. Populate the 'userId' field to get the associated user details (name, email)
    const teachers = await Teacher.find({}).populate({
      path: "userId", // The field in the Teacher model to populate
      model: User, // Use the imported User model
      select: "name email role", // Fields to retrieve from the User model
    });

    if (!teachers.length) {
      return res
        .status(404)
        .json({ success: false, message: "No teachers found in the system." });
    }

    // 3. Format the data to have the Teacher ID and the User's name directly
    const formattedTeachers = teachers.map((teacher) => ({
      _id: teacher._id, // The Teacher document ID (used for assignment)
      name: teacher.userId.name, // The teacher's name from the populated User document
      email: teacher.userId.email,
    }));

    res.status(200).json({
      success: true,
      message: "All teachers retrieved successfully!",
      teachers: formattedTeachers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error." });
    console.error(error);
  }
};

export { getTschedule, getAllTeachers };
