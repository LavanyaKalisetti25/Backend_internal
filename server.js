const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
//const personalDetailsRoutes = require('./routes/personalDetailsRoutes');


dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req,res)=>{
    res.status(200).json({
        message:"welcome..."
    })
})

app.use("/api/auth", require("./routes/authRoutes"));
//app.use('/api/employees', personalDetailsRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));