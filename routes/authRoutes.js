const express = require("express");
const router = express.Router();

const {
  registerEmployee,
  loginEmployee,
  getAllEmployees,
  getEmployeeById,
} = require("../controllers/employeeController");

// ✅ Register
router.post("/register", registerEmployee);

// ✅ Login
router.post("/login", loginEmployee);

// ✅ Get all employees
router.get("/all", getAllEmployees);

// ✅ Get employee by ID
router.get("/:id", getEmployeeById);

module.exports = router;
