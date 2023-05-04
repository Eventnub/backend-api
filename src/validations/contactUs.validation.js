const Joi = require("joi");

const contactUs = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    message: Joi.string().max(600).required(),
  }),
};

module.exports = {
  contactUs,
};
