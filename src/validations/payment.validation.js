const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const handlePaystackTicketPayment = {
  body: Joi.object().keys({
    paymentService: Joi.string().valid("paystack").required(),
    transactionReference: Joi.string().required(),
    amount: Joi.number().required(),
    objective: Joi.string()
      .valid("purchase", "quiz and music match", "raffle draw")
      .required(),
    eventId: Joi.string().required(),
    ticketIndex: Joi.number().required(),
  }),
};

const handleStripeTicketPayment = {
  body: Joi.object().keys({
    paymentService: Joi.string().valid("stripe").required(),
    token: Joi.object().required(),
    amount: Joi.number().required(),
    objective: Joi.string()
      .valid("purchase", "quiz and music match", "raffle draw")
      .required(),
    eventId: Joi.string().required(),
    ticketIndex: Joi.number().required(),
  }),
};

const getUserPaymentForEvent = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

module.exports = {
  handlePaystackTicketPayment,
  handleStripeTicketPayment,
  getUserPaymentForEvent,
};
