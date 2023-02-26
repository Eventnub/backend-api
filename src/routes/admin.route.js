const express = require("express");
const validate = require("../middlewares/validate");
const { Authentication, Authorization } = require("../middlewares/auth");
const adminValidation = require("../validations/admin.validation");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router
  .route("/register")
  .post(validate(adminValidation.register), adminController.register);

router
  .route("/login")
  .post(validate(adminValidation.login), adminController.login);

module.exports = router;
