const Joi = require("joi");
const { documentId } = require("./custom.validation");

const createEvent = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().valid("Paid", "Free").required(),
    host: Joi.string().required(),
    venue: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    date: Joi.string().required(),
    time: Joi.string().required(),
    artists: Joi.array().items(Joi.string().required()).required(),
    tickets: Joi.array()
      .items(
        Joi.object()
          .keys({
            type: Joi.string().required(),
            price: Joi.number().required(),
          })
          .min(1)
      )
      .required(),
    raffleCount: Joi.number().default(0),
    raffleWinners: Joi.array().items(Joi.object()).default([]),
  }),
  file: Joi.string().required(),
};

const getEvents = {
  query: Joi.object().keys({
    date: Joi.string(),
  }),
};

const getEvent = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
};

const updateEvent = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    type: Joi.string().valid("Paid", "Free"),
    host: Joi.string(),
    venue: Joi.string(),
    state: Joi.string(),
    country: Joi.string(),
    date: Joi.string(),
    time: Joi.string(),
    artists: Joi.array().items(Joi.string().required()),
    tickets: Joi.array().items(
      Joi.object()
        .keys({
          type: Joi.string().required(),
          price: Joi.number().required(),
        })
        .min(1)
    ),
    raffleCount: Joi.number(),
    raffleWinners: Joi.array().items(Joi.object()),
  }),
  file: Joi.string(),
};

const deleteEvent = {
  params: Joi.object().keys({
    uid: Joi.string().required().custom(documentId),
  }),
};

const likeOrUnlikeEvent = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
  body: Joi.object().keys({
    action: Joi.string().valid("like", "unlike").required(),
  }),
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  likeOrUnlikeEvent,
};
