const express = require("express");
const { Authentication } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const authValidation = require("../validations/auth.validation");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router
  .route("/register")
  .post(validate(authValidation.register), authController.register);

router
  .route("/login")
  .post(validate(authValidation.login), authController.login);

router
  .route("/send-password-reset-email")
  .post(
    Authentication,
    validate(authValidation.sendPasswordResetEmail),
    authController.sendPasswordResetEmail
  );

router
  .route("/send-forgot-password-email")
  .post(
    validate(authValidation.sendForgotPasswordEmail),
    authController.sendForgotPasswordEmail
  );

router
  .route("/resend-email-verification-link")
  .post(
    validate(authValidation.resendEmailVerificationLink),
    authController.resendEmailVerificationLink
  );

module.exports = router;
