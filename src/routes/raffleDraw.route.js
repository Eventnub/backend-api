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
    Authorization("admin"),
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
    Authorization("admin"),
    validate(raffleDrawValidation.updateRaffleDraw),
    raffleDrawController.updateRaffleDraw
  )
  .delete(
    Authentication,
    Authorization("admin"),
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

module.exports = router;
