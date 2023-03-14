const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const raffleDrawValidation = require("../validations/raffleDraw.validation");
const raffleDrawController = require("../controllers/raffleDraw.controller");

const router = express.Router();

router
  .route("/")
  .post(
    Authentication,
    Authorization(["admin", "host"]),
    validate(raffleDrawValidation.createRaffleDraw),
    raffleDrawController.createRaffleDraw
  );

router
  .route("/:uid")
  .get(
    Authentication,
    validate(raffleDrawValidation.getRaffleDraw),
    raffleDrawController.getRaffleDraw
  )
  .patch(
    Authentication,
    Authorization(["admin", "host"]),
    validate(raffleDrawValidation.updateRaffleDraw),
    raffleDrawController.updateRaffleDraw
  )
  .delete(
    Authentication,
    Authorization(["admin", "host"]),
    validate(raffleDrawValidation.deleteRaffleDraw),
    raffleDrawController.deleteRaffleDraw
  );

router
  .route("/get-event-raffle-draw/:eventId")
  .get(
    Authentication,
    validate(raffleDrawValidation.getEventRaffleDraw),
    raffleDrawController.getEventRaffleDraw
  );

router
  .route("/submit-event-raffle-draw-choice/:eventId")
  .post(
    Authentication,
    validate(raffleDrawValidation.submitEventRaffleDrawChoice),
    raffleDrawController.submitEventRaffleDrawChoice
  );

router
  .route("/get-event-raffle-draw-winners/:eventId")
  .get(
    Authentication,
    validate(raffleDrawValidation.getEventRaffleDrawWinners),
    raffleDrawController.getEventRaffleDrawWinners
  );

module.exports = router;
