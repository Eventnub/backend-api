const { Deepgram } = require("@deepgram/sdk");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

const deepgram = new Deepgram(config.deepgramApiKey);

const transcribeAudio = async (audioFile) => {
  try {
    const audioBuffer = audioFile.buffer;
    const bufferSource = { buffer: audioBuffer, mimetype: "`audio/webm`" };
    const response = await deepgram.transcription.preRecorded(bufferSource, {
      punctuate: true,
    });

    return {
      transcription: response.results.channels[0].alternatives[0].transcript,
    };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  transcribeAudio,
};
