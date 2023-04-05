const speech = require("@google-cloud/speech");
const { Deepgram } = require("@deepgram/sdk");
const { deepgramApiKey, gcloudConfig } = require("../config/config");

const speechClient = new speech.SpeechClient({
  credentials: gcloudConfig,
});

const deepgram = new Deepgram(deepgramApiKey);

const gCloudTranscribeAudio = async (audioFile) => {
  const request = {
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 48000,
      languageCode: "en-US",
    },
    audio: {
      content: audioFile.buffer.toString("base64"),
    },
  };

  const [response] = await speechClient.recognize(request);
  const transcript = response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");
  return { transcript };
};

const deepGramTranscribeAudio = async (audioFile) => {
  const audioBuffer = audioFile.buffer;
  const bufferSource = { buffer: audioBuffer, mimetype: "audio/webm" };
  const response = await deepgram.transcription.preRecorded(bufferSource, {
    punctuate: true,
    utterances: true,
  });
  const transcript = response.results.channels[0].alternatives[0].transcript;
  return { transcript };
};

module.exports = {
  gCloudTranscribeAudio,
  deepGramTranscribeAudio,
};
