const Joi = require("joi");
const { password, documentId } = require("./custom.validation");

const createRaffleDraw = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    firstNumber: Joi.number().required(),
    numbersCount: Joi.number().default(50),
  }),
};

const getRaffleDraw = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
};

const updateRaffleDraw = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
  body: Joi.object().keys({
    firstNumber: Joi.number(),
    numbersCount: Joi.number().default(50),
  }),
};

const deleteRaffleDraw = {
  params: Joi.object().keys({
    uid: Joi.string().required().custom(documentId),
  }),
};

const getEventRaffleDraw = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

const submitEventRaffleDrawChoice = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
  body: Joi.object().keys({
    paymentId: Joi.string().required(),
    chosenNumbers: Joi.array()
      .items(Joi.number().required())
      .unique()
      .length(5),
  }),
};

const getEventRaffleDrawWinners = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

const getEventRaffleDrawResults = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

module.exports = {
  createRaffleDraw,
  getRaffleDraw,
  updateRaffleDraw,
  deleteRaffleDraw,
  getEventRaffleDraw,
  submitEventRaffleDrawChoice,
  getEventRaffleDrawWinners,
  getEventRaffleDrawResults,
};
