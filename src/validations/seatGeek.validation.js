const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const getSeatGeekEvents = {
  query: Joi.object().keys({
    perPage: Joi.number(),
    page: Joi.number(),
  }),
};

const getSeatGeekEvent = {
  params: Joi.object().keys({
    eventId: Joi.number().required(),
  }),
};

module.exports = {
  getSeatGeekEvents,
  getSeatGeekEvent,
};
