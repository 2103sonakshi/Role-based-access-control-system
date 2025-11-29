import mongoose from "mongoose";
import dotenv from "dotenv";

// Import your Mongoose models. Adjust the paths if your Models folder is named differently.
import UserModel from "./Models/User.js";
import CourseModel from "./Models/Course.js";
import ScheduleModel from "./Models/Schedule.js";

// Load environment variables (to get the MongoDB URI)
dotenv.config();

// --- CRITICAL TEST DATA ---
// NOTE: This ID MUST match the mock teacher ID used in your Dashboard.jsx frontend
const MOCK_TEACHER_ID = "60c72b1f9c1d440000a6f44d";
const MOCK_STUDENT_GROUP = "10th A"; // Assuming this is the mock student group

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    // Using MONGODB variable as per your .env configuration
    await mongoose.connect(process.env.MONGODB);
    console.log("MongoDB Connected for seeding...");

    // 2. Clean up existing test data to prevent duplicates
    await UserModel.deleteOne({ _id: MOCK_TEACHER_ID });
    await CourseModel.deleteMany({
      name: { $in: ["Calculus I", "Physics II"] },
    });
    await ScheduleModel.deleteMany({ teacher: MOCK_TEACHER_ID });

    console.log("Existing test data cleaned up.");

    // --- CREATE CORE DOCUMENTS ---

    // 3. Create the Mock Teacher (User)
    const mockTeacher = await UserModel.create({
      _id: MOCK_TEACHER_ID,
      username: "mockteacher",
      // 🐛 FIX: Added the required 'name' field
      name: "Mock Teacher",
      email: "mock.teacher@example.com",
      role: "Teacher",
      password: "password123",
      referencedId: new mongoose.Types.ObjectId(),
    });
    console.log(
      `Mock Teacher created: ${mockTeacher.username} with ID ${mockTeacher._id}`
    );

    // 4. Create Courses
    const course1 = await CourseModel.create({
      name: "Calculus I",
      code: "MATH101",
      description: "Introduction to differential and integral calculus.",
    });

    const course2 = await CourseModel.create({
      name: "Physics II",
      code: "PHYS202",
      description: "Electromagnetism and thermodynamics.",
    });
    console.log(`Courses created: ${course1.name}, ${course2.name}`);

    // 5. Create Schedule Entries for the Mock Teacher (linking to the mock student group)
    const schedule1 = await ScheduleModel.create({
      course: course1._id,
      teacher: mockTeacher._id,
      studentGroup: MOCK_STUDENT_GROUP,
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:30",
    });

    const schedule2 = await ScheduleModel.create({
      course: course2._id,
      teacher: mockTeacher._id,
      studentGroup: MOCK_STUDENT_GROUP,
      dayOfWeek: "Tuesday",
      startTime: "11:00",
      endTime: "12:30",
    });

    console.log("Schedule entries created successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // 6. Disconnect from the database
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
};

seedDatabase();
