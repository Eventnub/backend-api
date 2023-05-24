const Joi = require("joi");
const { documentId } = require("./custom.validation");

const createMusicUnison = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    songLyrics: Joi.string().required(),
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
    songLyrics: Joi.string(),
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

const getEventMusicUnison = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

const transcribeAudio = {
  body: Joi.object().keys({
    service: Joi.string().valid("deepgram", "google").required(),
  }),
  file: Joi.string().required(),
};

const submitEventMusicUnisonAudio = {
  body: Joi.object().keys({
    musicUnisonId: Joi.string().required(),
    paymentId: Joi.string().required(),
  }),
  file: Joi.string().required(),
};

const reviewUserMusicUnisonSubmission = {
  body: Joi.object().keys({
    musicUnisonSubmissionId: Joi.string().required(),
    wrongWords: Joi.string().required(),
  }),
};

const getEventMusicUnisonResults = {
  params: Joi.object().keys({
    eventId: Joi.required().custom(documentId),
  }),
};

module.exports = {
  createMusicUnison,
  getMusicUnison,
  updateMusicUnison,
  deleteMusicUnison,
  getEventMusicUnisons,
  getEventMusicUnison,
  transcribeAudio,
  submitEventMusicUnisonAudio,
  reviewUserMusicUnisonSubmission,
  getEventMusicUnisonResults,
};
