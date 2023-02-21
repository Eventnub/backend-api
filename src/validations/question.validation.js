const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const createQuestion = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    question: Joi.string().required(),
    answerOptions: Joi.array().items(Joi.string().required()).min(4).required(),
    correctAnswer: Joi.string().required(),
  }),
};

const getQuestionsByEventId = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

const getQuestion = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
};

const updateQuestion = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
  body: Joi.object().keys({
    question: Joi.string(),
    answerOptions: Joi.array().items(Joi.string().required()).min(4),
    correctAnswer: Joi.string(),
  }),
};

const deleteQuestion = {
  params: Joi.object().keys({
    uid: Joi.string().required().custom(documentId),
  }),
};

module.exports = {
  createQuestion,
  getQuestionsByEventId,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
