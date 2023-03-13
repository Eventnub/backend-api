const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const questionValidation = require("../validations/question.validation");
const questionController = require("../controllers/question.controller");

const router = express.Router();

router
  .route("/")
  .post(
    Authentication,
    Authorization("admin"),
    validate(questionValidation.createQuestion),
    questionController.createQuestion
  );

router
  .route("/:uid")
  .get(
    Authentication,
    validate(questionValidation.getQuestion),
    questionController.getQuestion
  )
  .patch(
    Authentication,
    Authorization("admin"),
    validate(questionValidation.updateQuestion),
    questionController.updateQuestion
  )
  .delete(
    Authentication,
    Authorization("admin"),
    validate(questionValidation.deleteQuestion),
    questionController.deleteQuestion
  );

router
  .route("/get-event-quiz/:eventId")
  .get(
    Authentication,
    validate(questionValidation.getEventQuiz),
    questionController.getEventQuiz
  );

router
  .route("/submit-event-quiz-answers/:eventId")
  .post(
    Authentication,
    validate(questionValidation.submitEventQuizAnswers),
    questionController.submitEventQuizAnswers
  );

router
  .route("/get-event-quiz-winners/:eventId")
  .get(
    Authentication,
    validate(questionValidation.getEventQuizWinners),
    questionController.getEventQuizWinners
  );

module.exports = router;
