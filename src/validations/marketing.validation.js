const Joi = require("joi");

const submitQuizAnswers = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required(),
    country: Joi.string().required(),
    answers: Joi.array()
      .items(
        Joi.object().keys({
          questionId: Joi.number().required(),
          answer: Joi.string().required(),
        })
      )
      .required()
      .min(5),
  }),
};

const submitEmail = {
  body: Joi.object().keys({
    firstName: Joi.string().required(),
    email: Joi.string().required(),
  }),
};

module.exports = {
  submitQuizAnswers,
  submitEmail,
};
