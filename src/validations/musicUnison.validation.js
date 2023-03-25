const Joi = require("joi");
const { documentId } = require("./custom.validation");

const transcribeAudio = {
  file: Joi.string().required(),
};

module.exports = {
  transcribeAudio,
};
