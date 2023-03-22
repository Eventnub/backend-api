const express = require("express");
const { Authentication, Authorization } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const paymentValidation = require("../validations/payment.validation");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

router
  .route("/handle-paystack-ticket-payment")
  .post(
    Authentication,
    validate(paymentValidation.handlePaystackTicketPayment),
    paymentController.handlePaystackTicketPayment
  );

router
  .route("/handle-stripe-ticket-payment")
  .post(
    Authentication,
    validate(paymentValidation.handleStripeTicketPayment),
    paymentController.handleStripeTicketPayment
  );

module.exports = router;
