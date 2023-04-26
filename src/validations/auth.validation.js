const Joi = require("joi");
const { createUser } = require("./user.validation");

const register = {
  ...createUser,
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const sendPasswordResetEmail = {
  body: Joi.object().keys({
    email: Joi.string().email(),
  }),
};

const sendForgotPasswordEmail = {
  body: Joi.object().keys({
    email: Joi.string().email(),
  }),
};

const resendEmailVerificationLink = {
  body: Joi.object().keys({
    email: Joi.string().email(),
  }),
};

module.exports = {
  register,
  login,
  sendPasswordResetEmail,
  sendForgotPasswordEmail,
  resendEmailVerificationLink,
};
