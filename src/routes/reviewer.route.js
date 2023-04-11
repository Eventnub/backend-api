const express = require("express");
const { Authentication } = require("../middlewares/auth");
const multerConfig = require("../config/multer");
const validate = require("../middlewares/validate");
const reviewerValidation = require("../validations/reviewer.validation");
const reviewerController = require("../controllers/reviewer.controller");

const router = express.Router();

router
  .route("/send-email-verification-code")
  .post(
    Authentication,
    validate(reviewerValidation.sendEmailVerificationCode),
    reviewerController.sendEmailVerificationCode
  );

router
  .route("/verify-code")
  .post(
    Authentication,
    validate(reviewerValidation.verifyCode),
    reviewerController.verifyCode
  );

router.route("/submit-id-document").post(
  Authentication,
  multerConfig.fields([
    { name: "frontImagePhoto", maxCount: 1 },
    { name: "backImagePhoto", maxCount: 1 },
  ]),
  validate(reviewerValidation.submitIdDocument),
  reviewerController.submitIdDocument
);

module.exports = router;
