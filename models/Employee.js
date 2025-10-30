// models/Employee.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema(
  {
    empId: { type: String, unique: true, sparse: true },
    firstName: { type: String, required: [true, 'First name is required'] },
    lastName: { type: String, required: [true, 'Last name is required'] },
    dateOfBirth: { type: Date, required: [true, 'Date of birth is required'] },
    email: { type: String, required: [true, 'Email is required'], unique: true },
    phoneNumber: { type: String, required: [true, 'Phone number is required'] },
    password: { type: String, required: [true, 'Password is required'], select: false }, // not returned by default
  },
  { timestamps: true }
);

// virtual for confirmPassword (not stored)
employeeSchema.virtual('confirmPassword')
  .get(function () { return this._confirmPassword; })
  .set(function (val) { this._confirmPassword = val; });

// generate empId before validation so unique index checks work
employeeSchema.pre('validate', function (next) {
  if (!this.empId) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    this.empId = `EMP-${datePart}-${randomPart}`;
  }
  next();
});

// validate confirmPassword on save when password is modified
employeeSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    if (!this.password) return next(new Error('Password missing'));
    // confirmPassword only available if set on the model instance before save
    if (this._confirmPassword !== undefined && this.password !== this._confirmPassword) {
      return next(new Error('Passwords do not match'));
    }
  }
  next();
});

// hash password before saving (separate pre-save to keep async)
employeeSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// instance method to compare password
employeeSchema.methods.comparePassword = async function (enteredPassword) {
  // note: this.password exists only if .select('+password') was used
  return bcrypt.compare(enteredPassword, this.password);
};

// partial unique index to avoid null conflicts for empId
employeeSchema.index(
  { empId: 1 },
  { unique: true, partialFilterExpression: { empId: { $type: 'string' } } }
);

const Employee = mongoose.model('Employee', employeeSchema);
module.exports = Employee;
