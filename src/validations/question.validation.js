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

const getEventQuiz = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

const submitEventQuizAnswers = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
  body: Joi.object().keys({
    paymentId: Joi.string().required(),
    answers: Joi.array()
      .items(
        Joi.object().keys({
          questionId: Joi.string().required(),
          answer: Joi.string().required(),
        })
      )
      .required()
      .min(3),
  }),
};

const getEventQuizResults = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

module.exports = {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getEventQuiz,
  submitEventQuizAnswers,
  getEventQuizResults,
};
