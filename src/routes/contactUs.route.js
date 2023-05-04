const express = require("express");
const validate = require("../middlewares/validate");
const contactUsValidation = require("../validations/contactUs.validation");
const contactUsController = require("../controllers/contactUs.controller");

const router = express.Router();

router
  .route("/")
  .post(validate(contactUsValidation.contactUs), contactUsController.contactUs);

module.exports = router;
