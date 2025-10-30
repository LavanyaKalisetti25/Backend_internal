const Employee = require("../models/Employee");
const jwt = require("jsonwebtoken");

/**
 * 🧾 Register Employee
 */
exports.registerEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      email,
      phoneNumber,
      password,
      confirmPassword,
    } = req.body;

    // Validation
    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      !email ||
      !phoneNumber ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(400).json({ msg: "Employee already registered" });
    }

    // ✅ Convert dateOfBirth properly
    const dob = new Date(dateOfBirth);
    if (isNaN(dob)) {
      return res.status(400).json({ msg: "Invalid date of birth format" });
    }

    const employee = new Employee({
      firstName,
      lastName,
      dateOfBirth: dob,
      email,
      phoneNumber,
      password,
    });

    await employee.save();

    console.log(" Employee saved:", employee);

    res.status(201).json({
      msg: "Employee registered successfully",
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        dateOfBirth: employee.dateOfBirth,
      },
    });
  } catch (err) {
    console.error(" Registration error:", err);
    res.status(500).json({ msg: "Server error during registration" });
  }
};

/**
 * 🔑 Login Employee
 */
exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: "Email and password required" });

    const employee = await Employee.findOne({ email }).select("+password");
    if (!employee)
      return res.status(404).json({ msg: "Employee not found" });

    if (!employee.password) {
      console.error(`Stored password invalid for: ${email}`);
      return res
        .status(400)
        .json({ msg: "Stored password invalid — please re-register" });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: employee._id, email: employee.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      msg: "Login successful",
      token,
      employee: {
        id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        dateOfBirth: employee.dateOfBirth,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login" });
  }
  
};
/**
 * ✅ Get All Employees
 */
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select("-password");

    if (!employees.length) {
      return res.status(404).json({ msg: "No employees found" });
    }

    res.status(200).json({
      msg: "Employees fetched successfully",
      count: employees.length,
      employees,
    });
  } catch (err) {
    console.error("Get all employees error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};


/**
 * ✅ Get Single Employee by ID
 */
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password");

    if (!employee) {
      return res.status(404).json({ msg: "Employee not found" });
    }

    res.status(200).json({
      msg: "Employee fetched successfully",
      employee,
    });
  } catch (err) {
    console.error("Get employee by ID error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
