const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const sendEmailVerificationCode = {
  body: Joi.object().keys({
    email: Joi.string(),
  }),
};

const verifyCode = {
  body: Joi.object().keys({
    code: Joi.number().required(),
  }),
};

const submitIdDocument = {
  body: Joi.object().keys({
    verificationCodeId: Joi.string().required(),
  }),
  frontImagePhoto: Joi.string().required(),
  frontImagePhoto: Joi.string().required(),
};

module.exports = {
  sendEmailVerificationCode,
  verifyCode,
  submitIdDocument,
};
