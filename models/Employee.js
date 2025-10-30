// models/Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  empId: { type: String, unique: true /* remove sparse here if using index migration below */ },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true, select: false }
}, { timestamps: true });

// generate empId before validation (so it exists for unique index checks)
employeeSchema.pre('validate', function (next) {
  if (!this.empId) {
    const datePart = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    this.empId = `EMP-${datePart}-${randomPart}`;
  }
  next();
});

// Hash password on save (keep as pre-save)
employeeSchema.pre('save', async function (next) {
  try {
    if (this.isModified('password')) {
      if (!this.password) return next(new Error('Password missing'));
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Optionally add index definition at schema level (if you want sparse)
employeeSchema.index({ empId: 1 }, { unique: true /*, sparse: true */ });

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
