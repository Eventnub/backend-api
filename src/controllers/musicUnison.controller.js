const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { musicUnisonService } = require("../services");

const transcribeAudio = catchAsync(async (req, res) => {
  const transcription = await musicUnisonService.transcribeAudio(req.file);
  res.send(transcription);
});

module.exports = {
  transcribeAudio,
};
