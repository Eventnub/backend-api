const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { musicUnisonService } = require("../services");

const createMusicUnison = catchAsync(async (req, res) => {
  const musicUnison = await musicUnisonService.createMusicUnison(
    req.user,
    req.file,
    req.body
  );
  res.status(httpStatus.CREATED).send(musicUnison);
});

const getMusicUnison = catchAsync(async (req, res) => {
  const musicUnison = await musicUnisonService.getMusicUnisonById(
    req.params.uid,
    req.user
  );
  if (!musicUnison) {
    throw new ApiError(httpStatus.NOT_FOUND, "MusicUnison not found");
  }
  res.send(musicUnison);
});

const updateMusicUnison = catchAsync(async (req, res) => {
  const musicUnison = await musicUnisonService.updateMusicUnisonById(
    req.user,
    req.params.uid,
    req.file,
    req.body
  );
  res.send(musicUnison);
});

const deleteMusicUnison = catchAsync(async (req, res) => {
  await musicUnisonService.deleteMusicUnisonById(req.user, req.params.uid);
  res.status(httpStatus.NO_CONTENT).send();
});

const getEventMusicUnisons = catchAsync(async (req, res) => {
  const musicUnisons = await musicUnisonService.getEventMusicUnisonsByEventId(
    req.params.eventId,
    req.user
  );
  res.send(musicUnisons);
});

const transcribeAudio = catchAsync(async (req, res) => {
  const transcription = await musicUnisonService.transcribeAudio(
    req.body.service,
    req.file
  );
  res.send(transcription);
});

const submitEventMusicUnisonAudio = catchAsync(async (req, res) => {
  const result = await musicUnisonService.submitEventMusicUnisonAudio(
    req.body.musicUnisonId,
    req.file,
    req.user
  );
  res.send(result);
});

const reviewUserMusicUnisonSubmission = catchAsync(async (req, res) => {
  const result = await musicUnisonService.reviewUserMusicUnisonSubmission(
    req.body.musicUnisonSubmissionId,
    req.body.wrongWords,
    req.user
  );
  res.send(result);
});

module.exports = {
  createMusicUnison,
  getMusicUnison,
  updateMusicUnison,
  deleteMusicUnison,
  getEventMusicUnisons,
  transcribeAudio,
  submitEventMusicUnisonAudio,
  reviewUserMusicUnisonSubmission
};
