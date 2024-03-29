const express = require("express");
const validate = require("../middlewares/validate");
const marketingValidation = require("../validations/marketing.validation");
const marketingController = require("../controllers/marketing.controller");

const router = express.Router();

router
  .route("/submit-quiz-answers")
  .post(
    validate(marketingValidation.submitQuizAnswers),
    marketingController.submitQuizAnswers
  );

router
  .route("/submit-email")
  .post(
    validate(marketingValidation.submitEmail),
    marketingController.submitEmail
  );

module.exports = router;
