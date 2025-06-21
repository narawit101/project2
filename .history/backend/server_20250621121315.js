const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const cloudinary = require('cloudinary').v2;
const cookieParser = require('cookie-parser');
const http = require("http"); 
const { Server } = require("socket.io"); // ดึง Server class จาก socket.io
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "https://project-eight-jet-70.vercel.app", // เปลี่ยนให้ตรงกับของคุณจริงๆ
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
//  Middleware ผูก io เข้ากับ req
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use(
  cors({
    origin: allowedOrigins, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.json()); 
app.use('/uploads/images/field-profile', express.static(path.join(__dirname, 'uploads/images/field-profile')));
app.use('/uploads/images/posts', express.static(path.join(__dirname, 'uploads/images/posts')));
app.use('/uploads/images/slip', express.static(path.join(__dirname, 'uploads/images/slip')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));



cloudinary.config({
  cloud_name: 'YOUR_CLOUD_NAME',
  api_key: 'YOUR_API_KEY',
  api_secret: 'YOUR_API_SECRET'
});



const registerRoute = require("./routers/register");
const loginRoute = require("./routers/login");
const usersRoute = require("./routers/users");
const logoutRoute = require("./routers/logout");
const fieldRoute = require("./routers/field");
const facilitiesRoutes = require("./routers/facilities");
const sportsTypesRoutes = require("./routers/sportsTypes");
const myfieldRoute = require("./routers/myfield");
const profile = require("./routers/profile");
const posts = require("./routers/posts");
const booking = require("./routers/booking")(io);
const reviews = require("./routers/reviews");

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.use("/register", registerRoute);
app.use("/login", loginRoute);
app.use("/users", usersRoute);
app.use("/logout", logoutRoute);
app.use("/facilities", facilitiesRoutes);
app.use("/sports_types", sportsTypesRoutes);
app.use("/field", fieldRoute);
app.use("/myfield", myfieldRoute);
app.use("/profile", profile);
app.use("/posts", posts);
app.use("/booking",booking)
app.use("/reviews",reviews)
io.on("connection", (socket) => {
  console.log("📡 User connected:", socket.id);

  // ฟัง event ที่ client ส่งมาเพื่อ join ห้อง user_id
  socket.on("join_room", (userId) => {
    socket.join(userId.toString());
    console.log(`User joined room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


const port = 5000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});