// routes/employeeRoutes.js
const express = require("express");
const router = express.Router();

const {
  registerEmployee,
  loginEmployee,
  getAllEmployees,
  getEmployeeById,
  searchEmployees, // optional search handler
} = require("../controllers/employeeController");

// ✅ Register
router.post("/register", registerEmployee);

// ✅ Login
router.post("/login", loginEmployee);

// ✅ Get all employees
router.get("/all", getAllEmployees);

// ✅ Search employees (use ?q=term)
if (typeof searchEmployees === "function") {
  router.get("/search", searchEmployees);
}

// ✅ Get employee by ID (keep this last)
router.get("/:id", getEmployeeById);

module.exports = router;
