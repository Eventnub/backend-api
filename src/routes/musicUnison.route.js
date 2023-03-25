const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const multerConfig = require("../config/multer");
const validate = require("../middlewares/validate");
const musicUnisonController = require("../controllers/musicUnison.controller");

const router = express.Router();

router
  .route("/transcribe-audio")
  .post(
    Authentication,
    Authorization(["admin", "host"]),
    multerConfig.single("audio"),
    musicUnisonController.transcribeAudio
  );

module.exports = router;
