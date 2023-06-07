const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const data = require("./data.json");

// checking if the server is running
app.get("/", (req, res) => {
  res.send("finely tuned");
});
// sending demon class data
app.get("/classes", (req, res) => {
  res.send(data);
});
app.listen(port, () => {
  console.log(`tuned at ${port}`);
});
