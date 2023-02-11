const express = require("express");
const cors = require("cors");
const httpStatus = require("http-status");
const bodyParser = require("body-parser");
require("dotenv").config();
const config = require("./config/config");
const morgan = require("./config/morgan");
const routes = require("./routes");
const { rateLimiter } = require("./middlewares/rateLimiter");
const { errorConverter, errorHandler } = require("./middlewares/error");
const ApiError = require("./utils/ApiError");
const path = require("path");

const start = () => {
  const app = express();

  if (config.env !== "test") {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
  }

  // parse json request body
  app.use(bodyParser.json());

  // parse urlencoded request body
  app.use(bodyParser.urlencoded({ extended: true }));

  // enable cors
  app.use(cors());
  app.options("*", cors());

  // limit repeated request
  app.use(rateLimiter);

  app.use("/api", routes);
  app.use("/docs", express.static(path.join(__dirname, "docs")));

  // send back a 404 error for any unknown api request
  app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
  });

  // convert error to ApiError, if needed
  app.use(errorConverter);

  // handle error
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Eventnub API server started on port ${PORT}`);
  });
};

module.exports = { start };
