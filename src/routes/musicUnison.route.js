const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const multerConfig = require("../config/multer");
const validate = require("../middlewares/validate");
const musicUnisonValidation = require("../validations/musicUnison.validation");
const musicUnisonController = require("../controllers/musicUnison.controller");

const router = express.Router();

router
  .route("/")
  .post(
    Authentication,
    Authorization(["admin", "host"]),
    multerConfig.single("audio"),
    validate(musicUnisonValidation.createMusicUnison),
    musicUnisonController.createMusicUnison
  );

router
  .route("/:uid")
  .get(
    Authentication,
    validate(musicUnisonValidation.getMusicUnison),
    musicUnisonController.getMusicUnison
  )
  .patch(
    Authentication,
    Authorization(["admin", "host"]),
    multerConfig.single("audio"),
    validate(musicUnisonValidation.updateMusicUnison),
    musicUnisonController.updateMusicUnison
  )
  .delete(
    Authentication,
    Authorization(["admin", "host"]),
    validate(musicUnisonValidation.deleteMusicUnison),
    musicUnisonController.deleteMusicUnison
  );

router
  .route("/get-event-music-unisons/:eventId")
  .get(
    Authentication,
    Authorization(["admin", "host"]),
    validate(musicUnisonValidation.getEventMusicUnisons),
    musicUnisonController.getEventMusicUnisons
  );

router
  .route("/get-event-music-unison/:eventId")
  .get(
    Authentication,
    validate(musicUnisonValidation.getEventMusicUnison),
    musicUnisonController.getEventMusicUnison
  );

router
  .route("/transcribe-audio")
  .post(
    Authentication,
    Authorization(["admin", "host"]),
    multerConfig.single("audio"),
    validate(musicUnisonValidation.transcribeAudio),
    musicUnisonController.transcribeAudio
  );

router
  .route("/submit-event-music-unison-audio")
  .post(
    Authentication,
    multerConfig.single("audio"),
    validate(musicUnisonValidation.submitEventMusicUnisonAudio),
    musicUnisonController.submitEventMusicUnisonAudio
  );

router
  .route("/get-reviewed-music-unison-submissions/all")
  .get(
    Authentication,
    Authorization(["admin"]),
    musicUnisonController.getReviewedMusicUnisonSubmissions
  );

router
  .route("/get-unreviewed-music-unison-submissions/all")
  .get(
    Authentication,
    Authorization(["admin"]),
    musicUnisonController.getUnreviewedMusicUnisonSubmissions
  );

router
  .route("/review-user-music-submission")
  .post(
    Authentication,
    Authorization(["admin"]),
    validate(musicUnisonValidation.reviewUserMusicUnisonSubmission),
    musicUnisonController.reviewUserMusicUnisonSubmission
  );

router
  .route("/get-event-music-unison-results/:eventId")
  .get(
    Authentication,
    Authorization(["admin"]),
    validate(musicUnisonValidation.getEventMusicUnisonResults),
    musicUnisonController.getEventMusicUnisonResults
  );

module.exports = router;
