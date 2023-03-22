const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const ticketValidation = require("../validations/ticket.validation");
const ticketController = require("../controllers/ticket.controller");

const router = express.Router();

router
  .route("/get-user-acquired-tickets/:userId")
  .get(
    Authentication,
    validate(ticketValidation.getUserAcquiredTickets),
    ticketController.getUserAcquiredTickets
  );

module.exports = router;
