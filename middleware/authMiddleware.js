const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ msg: "Access denied, no token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.employee = await Employee.findById(decoded.id).select("-password");
    if (!req.employee) return res.status(404).json({ msg: "Employee not found" });
    next();
  } catch (err) {
    res.status(400).json({ msg: "Invalid token" });
  }
};

module.exports = authMiddleware;