// backend/Routes/dashboardRoutes.js - OLD
// const express = require('express');
// const dashboardController = require('../Controllers/Dashboard');
// module.exports = router;

// backend/Routes/dashboardRoutes.js - CORRECTED
import express from "express";
// 💡 IMPORTANT: Import the function using its named export (getDashboardMetrics)
import { getDashboardMetrics } from "../Controllers/Dashboard.js";

const router = express.Router();

router.get("/", getDashboardMetrics);

// 🛠️ CRITICAL FIX: Use 'export default' to resolve the SyntaxError in server.js
export default router;
