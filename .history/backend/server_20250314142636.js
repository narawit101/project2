const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config(); // ✅ โหลดค่า .env
const pool = require("./db"); // ✅ นำเข้าโมดูลฐานข้อมูล

const app = express(); // ✅ ต้องกำหนดก่อนใช้ app

require("dotenv").config(); // ✅ โหลด Environment Variables ก่อน

// ✅ ตั้งค่า CORS ก่อนกำหนดค่า Routes
app.use(
  cors({
    origin: "http://localhost:3000", // ✅ อนุญาตเฉพาะ Next.js
    credentials: true, // ✅ อนุญาตให้ส่ง cookies
    methods: ["GET", "POST", "PUT", "DELETE"], // ✅ กำหนด HTTP Methods ที่อนุญาต
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ กำหนด Headers ที่อนุญาต
  })
);

app.use(bodyParser.json()); // ✅ รองรับ JSON request
app.use(express.json()); // ✅ ใช้ Express JSON Middleware (อัปเดตใหม่)


// ✅ Import Routes
const registerRoute = require("./routers/register");
const loginRoute = require("./routers/login");
const usersRoute = require("./routers/users");
const logoutRoute = require("./routers/logout");
const protectedRoute = require("./routers/protected");

// ✅ เพิ่ม route สำหรับ root URL
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

// ✅ ใช้ routes ที่แยกออกมา (ต้องมากหลังจากกำหนด CORS)
app.use("/register", registerRoute);
app.use("/login", loginRoute);
app.use("/users", usersRoute);
app.use("/logout", logoutRoute);
app.use("/protected", protectedRoute);

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
