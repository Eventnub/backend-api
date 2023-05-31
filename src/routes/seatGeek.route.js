const express = require("express");
const { Authentication } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const seatGeekValidation = require("../validations/seatGeek.validation");
const seatGeekController = require("../controllers/seatGeek.controller");

const router = express.Router();

router
  .route("/get-seat-geek-events")
  .get(
    validate(seatGeekValidation.getSeatGeekEvents),
    seatGeekController.getSeatGeekEvents
  );

module.exports = router;
