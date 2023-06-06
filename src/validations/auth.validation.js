const Joi = require("joi");
const { createUser, createUserFromProvider } = require("./user.validation");

const register = {
  ...createUser,
};

const registerViaProvider = {
  ...createUserFromProvider,
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
  registerViaProvider,
  login,
  sendPasswordResetEmail,
  sendForgotPasswordEmail,
  resendEmailVerificationLink,
};
