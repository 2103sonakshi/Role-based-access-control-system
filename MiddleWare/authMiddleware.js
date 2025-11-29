// backend/Middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import UserModel from "../Models/user.js";
// Note: You must ensure '../Models/user.js' exists and uses export default

// Middleware to protect routes (check for token and verify user)
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers or cookies
  if (req.cookies.token) {
    token = req.cookies.token;
  }
  // You might also check req.headers.authorization here:
  /* else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } */

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to the request object (excluding the password)
    req.user = await UserModel.findById(decoded.id).select("-password");

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Middleware to authorize user roles (check if user has the required role)
export const authorize = (roles = []) => {
  // If roles is a single string, convert it to an array
  if (typeof roles === "string") {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
