const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const handlePaystackTicketPayment = {
  body: Joi.object().keys({
    paymentService: Joi.string().valid("paystack").required(),
    transactionReference: Joi.string().required(),
    objective: Joi.string().valid("to buy", "to play game").required(),
    eventId: Joi.string().required(),
    ticketIndex: Joi.number().required(),
  }),
};

const handleStripeTicketPayment = {
  body: Joi.object().keys({
    paymentService: Joi.string().valid("stripe").required(),
    token: Joi.string().required(),
    amount: Joi.number().required(),
    objective: Joi.string().valid("to buy", "to play game").required(),
    eventId: Joi.string().required(),
    ticketIndex: Joi.number().required(),
  }),
};

module.exports = {
  handlePaystackTicketPayment,
  handleStripeTicketPayment,
};
