const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const sendPhoneNumberVerificationCode = {
  body: Joi.object().keys({
    phoneNumber: Joi.string().required(),
  }),
};

module.exports = {
  sendPhoneNumberVerificationCode,
};
