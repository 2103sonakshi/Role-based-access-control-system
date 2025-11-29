// backend/Models/Course.js

import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming teachers are also stored in the 'User' model
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CourseModel = mongoose.model("Course", courseSchema);

export default CourseModel;
