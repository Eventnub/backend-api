const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const paymentValidation = require("../validations/payment.validation");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

router
  .route("/verify-ticket-payment")
  .post(
    Authentication,
    validate(paymentValidation.verifyTicketPayment),
    paymentController.verifyTicketPayment
  );

router
  .route("/handle-stripe-ticket-payment")
  .post(
    Authentication,
    validate(paymentValidation.handleStripeTicketPayment),
    paymentController.handleStripeTicketPayment
  );

module.exports = router;
