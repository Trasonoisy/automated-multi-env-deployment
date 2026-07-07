const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "Automated Multi-Environment Deployment Pipeline Demo",
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

module.exports = app;