const config = require("./utils/config");
const express = require("express");
require("express-async-errors");
const app = express();
const loginRouter = require("./controllers/login");
const blogsRouter = require("./controllers/blogs");
const usersRouter = require("./controllers/users");
const middleware = require("./utils/middleware");
const logger = require("./utils/logger");
const mongoose = require("mongoose");

logger.info("connecting to", config.MONGODB_URI);

mongoose.set("strictQuery", false);

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connecting to MongoDB:", error.message);
  });

app.use(express.static("build"));
app.use(express.json());
app.use(middleware.requestLogger);

app.use(middleware.tokenExtractor);

// use the middleware in all routes
// app.use(middleware.userExtractor);

app.use("/api/login", loginRouter);
// use the middleware only in /api/blogs routes
// app.use("/api/blogs", middleware.userExtractor, blogsRouter);
app.use("/api/blogs", blogsRouter);
app.use("/api/users", usersRouter);

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
