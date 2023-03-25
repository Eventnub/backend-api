const { Deepgram } = require("@deepgram/sdk");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const { admin, generateFirebaseId } = require("./firebase.service");
const { uploadFile, deleteFile } = require("./fileStorage.service");
const { getEventById } = require("./event.service");

const deepgram = new Deepgram(config.deepgramApiKey);

const createMusicUnison = async (creator, audioFile, musicUnisonBody) => {
  const event = await getEventById(musicUnisonBody.eventId);
  if (!event) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Event with the specified id not found"
    );
  }

  if (!["admin"].includes(creator.role) && event.creatorId !== creator.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't add music unison for events they didn't create"
    );
  }

  const uid = generateFirebaseId("musicUnisons");
  const filename = `musicUnisonAudios/${uid}.webm`;
  const audioUrl = await uploadFile(audioFile, filename);
  musicUnisonBody.uid = uid;
  musicUnisonBody.audioUrl = audioUrl;
  musicUnisonBody.createdAt = Date.now();
  musicUnisonBody.creatorId = creator.uid;

  await admin
    .firestore()
    .collection("musicUnisons")
    .doc(uid)
    .set(musicUnisonBody);

  return { ...musicUnisonBody };
};

const getMusicUnisonById = async (uid, requester) => {
  const doc = await admin.firestore().collection("musicUnisons").doc(uid).get();
  let musicUnison = null;

  if (doc) {
    musicUnison = doc.data();
    if (!["admin", "host"].includes(requester.role)) {
      delete musicUnison["songTranscript"];
    }
  }
  return musicUnison;
};

const updateMusicUnisonById = async (
  updater,
  uid,
  updateAudioFile,
  updateBody
) => {
  const musicUnison = await getMusicUnisonById(uid, { role: "admin" });
  if (!musicUnison) {
    throw new ApiError(httpStatus.NOT_FOUND, "Music unison with uid not found");
  }

  const event = await getEventById(musicUnison.eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Music unison event not found");
  }

  if (!["admin"].includes(updater.role) && event.creatorId !== updater.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't update music unison for events they didn't create"
    );
  }

  if (updateAudioFile) {
    await deleteFile(event.audioUrl);
    const filename = `musicUnisonAudios/${uid}.webm`;
    const audioUrl = await uploadFile(updateAudioFile, filename);
    updateBody.audioUrl = audioUrl;
  }

  updateBody.updatedAt = Date.now();

  await admin
    .firestore()
    .collection("musicUnisons")
    .doc(uid)
    .update(updateBody);
  return updateBody;
};

const deleteMusicUnisonById = async (deleter, uid) => {
  const musicUnison = await getMusicUnisonById(uid, { role: "admin" });
  if (!musicUnison) {
    throw new ApiError(httpStatus.NOT_FOUND, "Music unison with uid not found");
  }

  const event = await getEventById(musicUnison.eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Music unison event not found");
  }

  if (!["admin"].includes(deleter.role) && event.creatorId !== deleter.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't delete music unison for events they didn't create"
    );
  }

  await deleteFile(musicUnison.audioUrl);
  await admin.firestore().collection("musicUnisons").doc(uid).delete();
};

const getEventMusicUnisonsByEventId = async (eventId, requester) => {
  const event = await getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event with uid not found");
  }

  const snapshot = await admin
    .firestore()
    .collection("musicUnisons")
    .where("eventId", "==", eventId)
    .get();
  let musicUnisons = snapshot.docs.map((doc) => {
    const musicUnison = doc.data();
    if (
      !["admin"].includes(requester.role) &&
      event.creatorId !== requester.uid
    ) {
      delete musicUnison["songTranscript"];
    }
    return musicUnison;
  });

  return musicUnisons;
};

const transcribeAudio = async (audioFile) => {
  try {
    const audioBuffer = audioFile.buffer;
    const bufferSource = { buffer: audioBuffer, mimetype: "`audio/webm`" };
    const response = await deepgram.transcription.preRecorded(bufferSource, {
      punctuate: true,
    });

    return {
      transcript: response.results.channels[0].alternatives[0].transcript,
    };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  createMusicUnison,
  getMusicUnisonById,
  updateMusicUnisonById,
  deleteMusicUnisonById,
  getEventMusicUnisonsByEventId,
  transcribeAudio,
};
