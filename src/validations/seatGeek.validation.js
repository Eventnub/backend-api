const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const getSeatGeekEvents = {
  query: Joi.object().keys({
    perPage: Joi.number(),
    page: Joi.number(),
  }),
};

module.exports = {
  getSeatGeekEvents,
};
