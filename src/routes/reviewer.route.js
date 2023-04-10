const express = require("express");
const { Authentication } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const reviewerValidation = require("../validations/reviewer.validation");
const reviewerController = require("../controllers/reviewer.controller");

const router = express.Router();

router.route("/send-email-verification-code").post(
  Authentication,
  validate(reviewerValidation.sendEmailVerificationCode),
  reviewerController.sendEmailVerificationCode
);

router.route("/verify-code").post(
  Authentication,
  validate(reviewerValidation.verifyCode),
  reviewerController.verifyCode
);

module.exports = router;
