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
  .route("/event/:eventId")
  .get(
    Authentication,
    validate(questionValidation.getQuestionsByEventId),
    questionController.getQuestionsByEventId
  );

module.exports = router;
