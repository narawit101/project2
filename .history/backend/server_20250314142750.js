const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const pool = require("./db"); 

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());
app.use(express.json()); 

const registerRoute = require("./routers/register");
const loginRoute = require("./routers/login");
const usersRoute = require("./routers/users");
const logoutRoute = require("./routers/logout");
const protectedRoute = require("./routers/protected");

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.use("/register", registerRoute);
app.use("/login", loginRoute);
app.use("/users", usersRoute);
app.use("/logout", logoutRoute);
app.use("/protected", protectedRoute);

const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
