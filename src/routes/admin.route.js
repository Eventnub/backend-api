const express = require("express");
const validate = require("../middlewares/validate");
const authValidation = require("../validations/auth.validation");
const adminController = require("../controllers/admin.controller");

const router = express.Router();

router
  .route("/login")
  .post(validate(authValidation.login), adminController.login);

module.exports = router;
