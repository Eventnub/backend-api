const express = require("express");
const { Authentication } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const reviewerValidation = require("../validations/reviewer.validation");
const reviewerController = require("../controllers/reviewer.controller");

const router = express.Router();

router.route("/send-phone-number-verification-code").post(
  Authentication,
  validate(reviewerValidation.sendPhoneNumberVerificationCode),
  reviewerController.sendPhoneNumberVerificationCode
);

module.exports = router;
