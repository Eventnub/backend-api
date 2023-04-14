const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const quizAndMusicUnisonValidation = require("../validations/quizAndMusicUnison.validation");
const quizAndMusicUnisonController = require("../controllers/quizAndMusicUnison.controller");

const router = express.Router();

router
  .route("/get-quiz-and-music-unison-winners/:eventId")
  .get(
    Authentication,
    validate(quizAndMusicUnisonValidation.getEventQuizAndMusicUnisonWinners),
    quizAndMusicUnisonController.getEventQuizAndMusicUnisonWinners
  );

module.exports = router;
