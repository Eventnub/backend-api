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
    validate(musicUnisonValidation.getEventMusicUnisons),
    musicUnisonController.getEventMusicUnisons
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

module.exports = router;
