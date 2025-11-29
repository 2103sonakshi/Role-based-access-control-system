import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import DbCon from "./Utils/db.js";
import AuthRoutes from "./Routes/Auth.js";
import AuthAdmin from "./Routes/AdminRoute.js";
import cookieparser from "cookie-parser";

// Route imports confirmed correct to fix 404
import DashboardRoutes from "./Routes/dashboardRoutes.js";
import ScheduleRoutes from "./Routes/ScheduleRoutes.js";

// CRITICAL: Call dotenv.config() immediately after imports
dotenv.config();

const app = express();
// Ensure PORT reads from the .env file (should be 5000)
const PORT = process.env.PORT || 5000;

// Database connection function is called after environment variables are loaded
DbCon();

// --- Middleware Setup ---
app.use(express.json());

// FIX FOR CORS POLICY BLOCK
const allowedOrigins = [
  "https://rbac-frontend-bu6e.onrender.com",
  "http://localhost:5173", // Your Local Frontend URL
  "http://localhost:3000",
];

app.use(
  cors({
    credentials: true,
    // Use a function to check if the request origin is in the allowed list
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Log the error for the server operator but return a generic error to the client
        console.error(`CORS Blocked: Origin ${origin} not allowed`);
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
// ---------------------------------

app.use(cookieparser());
// ---------------------------------

// --- Route Mounting (Confirmed Correct) ---
app.use("/api/auth", AuthRoutes);
app.use("/api/admin", AuthAdmin); // Assuming this is for admin-specific endpoints
app.use("/api/dashboard", DashboardRoutes);
app.use("/api/schedule", ScheduleRoutes);
// ------------------------------------------

app.get("/", (req, res) => {
  res.send("test");
});

// --- ENHANCEMENT: Global Error Handling Middleware ---
// This must be the last middleware function added before app.listen()
app.use((err, req, res, next) => {
  // Use the status code from the error if available, otherwise default to 500
  const statusCode = err.statusCode || 500;
  // Use the error message if available, otherwise provide a generic message
  const message = err.message || "Internal Server Error";

  // Log the error details to the console (for debugging on the server)
  console.error(
    `[ERROR] Status: ${statusCode}, Message: ${message}, Stack: ${err.stack}`
  );

  // Send a standardized JSON response to the client
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
// ----------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  // Log to confirm the route handlers are applied
  console.log("Authentication routes loaded under /api/auth");
  console.log("Dashboard routes loaded under /api/dashboard");
  console.log("Schedule routes loaded under /api/schedule");
});
