const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE",""],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());
app.use(express.json()); 
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/uploads/images/posts', express.static(path.join(__dirname, 'uploads/images/posts')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));

const registerRoute = require("./routers/register");
const loginRoute = require("./routers/login");
const usersRoute = require("./routers/users");
const logoutRoute = require("./routers/logout");
const protectedRoute = require("./routers/protected");
const fieldRoute = require("./routers/field");
const facilitiesRoutes = require("./routers/facilities");
const sportsTypesRoutes = require("./routers/sportsTypes");
const myfieldRoute = require("./routers/myfield");
const profile = require("./routers/profile");
const posts = require("./routers/posts");

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.use("/register", registerRoute);
app.use("/login", loginRoute);
app.use("/users", usersRoute);
app.use("/logout", logoutRoute);
app.use("/protected", protectedRoute);
app.use("/facilities", facilitiesRoutes);
app.use("/sports_types", sportsTypesRoutes);
app.use("/field", fieldRoute);
app.use("/myfield", myfieldRoute);
app.use("/profile", profile);
app.use("/posts", posts);

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
