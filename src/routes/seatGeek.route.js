const express = require("express");
const { Authentication } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const seatGeekValidation = require("../validations/seatGeek.validation");
const seatGeekController = require("../controllers/seatGeek.controller");

const router = express.Router();

router.get(
  "/get-events",
  validate(seatGeekValidation.getSeatGeekEvents),
  seatGeekController.getSeatGeekEvents
);

router.get(
  "/get-event/:eventId",
  validate(seatGeekValidation.getSeatGeekEvent),
  seatGeekController.getSeatGeekEvent
);

module.exports = router;
