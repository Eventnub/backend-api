const Joi = require("joi");
const { documentId } = require("./custom.validation");

const createMusicUnison = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    songTranscript: Joi.string().required(),
    songArtist: Joi.string().required(),
    songTitle: Joi.string().required(),
  }),
  file: Joi.string().required(),
};

const getMusicUnison = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
};

const updateMusicUnison = {
  params: Joi.object().keys({
    uid: Joi.required().custom(documentId),
  }),
  body: Joi.object().keys({
    songTranscript: Joi.string(),
    songArtist: Joi.string(),
    songTitle: Joi.string(),
  }),
  file: Joi.string(),
};

const deleteMusicUnison = {
  params: Joi.object().keys({
    uid: Joi.string().required().custom(documentId),
  }),
};

const getEventMusicUnisons = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

const transcribeAudio = {
  file: Joi.string().required(),
};

const submitEventMusicUnisonAudio = {
  body: Joi.object().keys({
    musicUnisonId: Joi.string().required(),
  }),
  file: Joi.string().required(),
};

module.exports = {
  createMusicUnison,
  getMusicUnison,
  updateMusicUnison,
  deleteMusicUnison,
  getEventMusicUnisons,
  transcribeAudio,
  submitEventMusicUnisonAudio,
};
