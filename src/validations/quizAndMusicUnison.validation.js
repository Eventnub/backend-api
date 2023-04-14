const Joi = require("joi");
const { documentId } = require("./custom.validation");

const getEventQuizAndMusicUnisonWinners = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

module.exports = {
  getEventQuizAndMusicUnisonWinners,
};
