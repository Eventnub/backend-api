const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const getUserAcquiredTickets = {
  query: Joi.object().keys({
    userId: Joi.string(),
  }),
};

module.exports = {
  getUserAcquiredTickets,
};
