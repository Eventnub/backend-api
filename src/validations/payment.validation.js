const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const verifyTicketPayment = {
  body: Joi.object().keys({
    paymentService: Joi.string().required(),
    transactionReference: Joi.string().required(),
    objective: Joi.string().valid("to buy", "to play game").required(),
    eventId: Joi.string().required(),
    ticketIndex: Joi.number().required(),
  }),
};

module.exports = {
  verifyTicketPayment,
};
