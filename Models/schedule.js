// backend/Models/Schedule.js

import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  studentGroup: {
    type: String,
    required: true,
  },
  dayOfWeek: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🛠️ CRITICAL FIX: Check if the model has already been compiled (exists)
// If it exists, use it (mongoose.models.Schedule). If not, compile it (mongoose.model('Schedule', ...)).
const ScheduleModel =
  mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);

export default ScheduleModel;
