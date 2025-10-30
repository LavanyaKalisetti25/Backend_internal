// controllers/employeeController.js
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1h';

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

    // Basic validation
    if (!firstName || !lastName || !dateOfBirth || !email || !phoneNumber || !password || !confirmPassword) {
      return res.status(400).json({ msg: 'All fields are required' });
    }
    if (password !== confirmPassword) return res.status(400).json({ msg: 'Passwords do not match' });

    // check duplicate email
    const exists = await Employee.findOne({ email }).lean();
    if (exists) return res.status(409).json({ msg: 'Email already registered' });

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return res.status(400).json({ msg: 'Invalid date of birth format' });

    // Create model instance and set confirmPassword virtual so schema can validate it
    const employee = new Employee({
      firstName,
      lastName,
      dateOfBirth: dob,
      email,
      phoneNumber,
      password,
    });
    // set virtual confirmPassword (so pre-save validation can compare)
    employee.confirmPassword = confirmPassword;

    await employee.save();

    return res.status(201).json({
      msg: 'Employee registered successfully',
      employee: {
        id: employee._id,
        empId: employee.empId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        dateOfBirth: employee.dateOfBirth,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      return res.status(409).json({ msg: `${field} already exists` });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ msg: 'Validation failed', errors });
    }
    return res.status(500).json({ msg: 'Server error during registration', error: err.message });
  }
};

exports.loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email and password required' });

    // fetch with password explicitly selected
    const employee = await Employee.findOne({ email }).select('+password');
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    if (!employee.password) {
      console.error(`Stored password missing for: ${email}`);
      return res.status(400).json({ msg: 'Stored password invalid — please re-register' });
    }

    // Compare - prefer instance method (document), fallback to bcrypt
    let isMatch = false;
    if (employee && typeof employee.comparePassword === 'function') {
      isMatch = await employee.comparePassword(password);
    } else {
      console.warn('comparePassword missing on doc; using bcrypt.compare fallback');
      isMatch = await bcrypt.compare(password, employee.password);
    }

    if (!isMatch) return res.status(401).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: employee._id, email: employee.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.status(200).json({
      msg: 'Login successful',
      token,
      employee: {
        id: employee._id,
        empId: employee.empId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ msg: 'Server error during login', error: err.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select('-password');
    if (!employees.length) return res.status(404).json({ msg: 'No employees found' });
    res.status(200).json({ msg: 'Employees fetched successfully', count: employees.length, employees });
  } catch (err) {
    console.error('Get all employees error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'Invalid employee id' });
    const employee = await Employee.findById(id).select('-password');
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });
    res.status(200).json({ msg: 'Employee fetched successfully', employee });
  } catch (err) {
    console.error('Get employee by ID error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.searchEmployees = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ msg: "Query param 'q' is required" });
    const regex = new RegExp(q.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    const employees = await Employee.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }] }).select('-password');
    return res.status(200).json({ msg: 'Search results', count: employees.length, employees });
  } catch (err) {
    console.error('Search employees error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
