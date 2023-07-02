const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shuffle = require("../utils/shuffle");
const { admin, generateFirebaseId } = require("./firebase.service");
const { uploadFile, deleteFile } = require("./fileStorage.service");
const { getEventById } = require("./event.service");
const {
  deepGramTranscribeAudio,
  gCloudTranscribeAudio,
} = require("./STT.service");
const { getPaymentById, updatePaymentExtraData } = require("./payment.service");
const { getUsers } = require("./user.service");

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
      delete musicUnison["songLyrics"];
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
      delete musicUnison["songLyrics"];
    }
    return musicUnison;
  });

  return musicUnisons;
};

const getEventMusicUnisonByEventId = async (eventId, requester) => {
  let musicUnisons = await getEventMusicUnisonsByEventId(eventId, requester);
  musicUnisons = shuffle(musicUnisons);
  return musicUnisons.at(0);
};

const transcribeAudio = (service, audioFile) => {
  if (service === "deepgram") {
    return deepGramTranscribeAudio(audioFile);
  } else if (service === "google") {
    return gCloudTranscribeAudio(audioFile);
  } else {
    throw new ApiError(
      httpStatus.UNPROCESSABLE_ENTITY,
      "Service provider not supported"
    );
  }
};

const submitEventMusicUnisonAudio = async (
  submitBody,
  audioFile,
  submitter
) => {
  const { musicUnisonId, paymentId } = submitBody;

  const payment = await getPaymentById(paymentId);
  if (!payment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No payment matched this submission"
    );
  }

  if (payment.userId !== submitter.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment was not made by this user"
    );
  }

  if (payment.objective !== "quiz and music match") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment not made for quiz and music unison"
    );
  }

  if (payment.extraData.hasPlayedMusicUnison) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already completed the music unison"
    );
  }

  const musicUnison = await getMusicUnisonById(musicUnisonId, {
    role: "admin",
  });
  if (!musicUnison) {
    throw new ApiError(httpStatus.NOT_FOUND, "Music unison with uid not found");
  }

  const uid = generateFirebaseId("musicUnisonResults");
  const filename = `musicUnisonResults/${uid}.webm`;
  const audioUrl = await uploadFile(audioFile, filename);

  const musicUnisonResult = {
    uid,
    paymentId,
    musicUnisonId,
    userId: submitter.uid,
    eventId: musicUnison.eventId,
    audioUrl,
    createdAt: Date.now(),
    isReviewed: false,
    reviewedAt: 0,
    accuracyRatio: 0,
  };

  await admin
    .firestore()
    .collection("musicUnisonResults")
    .doc(uid)
    .set(musicUnisonResult);
  await updatePaymentExtraData(payment.uid, { hasPlayedMusicUnison: true });

  return musicUnisonResult;
};

const getMusicUnisonResultsByEventId = async (eventId) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("musicUnisonResults")
      .where("eventId", "==", eventId)
      .get();
    const musicUnisonResults = snapshot.docs.map((doc) => doc.data());
    return musicUnisonResults;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getMusicUnisonResultById = async (uid) => {
  try {
    const user = await admin
      .firestore()
      .collection("musicUnisonResults")
      .doc(uid)
      .get();
    return user.data();
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getReviewedMusicUnisonSubmissions = async () => {
  let snapshot = await admin
    .firestore()
    .collection("musicUnisonResults")
    .where("isReviewed", "==", true)
    .get();
  let musicUnisonSubmissions = snapshot.docs.map((doc) => doc.data());

  snapshot = await admin.firestore().collection("musicUnisons").get();
  const musicUnisons = snapshot.docs.map((doc) => doc.data());

  musicUnisonSubmissions = musicUnisonSubmissions.map((submission) => {
    const [submissionMusicUnison] = musicUnisons.filter(
      (musicUnison) => musicUnison.uid === submission.musicUnisonId
    );
    submission.musicUnison = submissionMusicUnison;
    delete submission["musicUnisonId"];
    return submission;
  });

  return musicUnisonSubmissions;
};

const getUnreviewedMusicUnisonSubmissions = async () => {
  let snapshot = await admin
    .firestore()
    .collection("musicUnisonResults")
    .where("isReviewed", "==", false)
    .get();
  let musicUnisonSubmissions = snapshot.docs.map((doc) => doc.data());

  snapshot = await admin.firestore().collection("musicUnisons").get();
  const musicUnisons = snapshot.docs.map((doc) => doc.data());

  musicUnisonSubmissions = musicUnisonSubmissions.map((submission) => {
    const [submissionMusicUnison] = musicUnisons.filter(
      (musicUnison) => musicUnison.uid === submission.musicUnisonId
    );
    submission.musicUnison = submissionMusicUnison;
    delete submission["musicUnisonId"];
    return submission;
  });

  return musicUnisonSubmissions;
};

const reviewUserMusicUnisonSubmission = async (
  musicUnisonSubmissionId,
  wrongWords,
  reviewer
) => {
  const musicUnisonSubmission = await getMusicUnisonResultById(
    musicUnisonSubmissionId
  );
  if (!musicUnisonSubmission) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Music unison submission not found"
    );
  }
  if (musicUnisonSubmission.isReviewed) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Music unison submission has already been scored"
    );
  }

  const musicUnison = await getMusicUnisonById(
    musicUnisonSubmission.musicUnisonId,
    { role: "admin" }
  );
  if (!musicUnison) {
    throw new ApiError(httpStatus.NOT_FOUND, "Music unison not found");
  }

  const allWordsInSongLyrics = musicUnison.songLyrics
    .replace(",", "")
    .split(" ");
  const allWrongWordsInSubmission = wrongWords.split(",");
  const accuracyRatio = parseFloat(
    (
      1 -
      allWrongWordsInSubmission.length / allWordsInSongLyrics.length
    ).toFixed(2)
  );

  const updateBody = {
    accuracyRatio,
    isReviewed: true,
    reviewedAt: Date.now(),
    reviewer: reviewer.uid,
    wrongWords: allWrongWordsInSubmission,
  };

  await admin
    .firestore()
    .collection("musicUnisonResults")
    .doc(musicUnisonSubmissionId)
    .update(updateBody);

  return updateBody;
};

const getEventMusicUnisonResults = async (eventId) => {
  const users = await getUsers();
  let results = await getMusicUnisonResultsByEventId(eventId);

  results = results.map((result) => {
    const user = users.find((user) => user.uid === result.userId);
    result.user = user;
    return result;
  });

  const totalTakes = results.length;
  const totalPasses = results.filter(
    (result) => result.accuracyRatio >= 0.75
  ).length;
  const totalFailures = totalTakes - totalPasses;

  const statistics = {
    totalTakes,
    totalPasses,
    totalFailures,
  };

  return { results, statistics };
};

module.exports = {
  createMusicUnison,
  getMusicUnisonById,
  updateMusicUnisonById,
  deleteMusicUnisonById,
  getEventMusicUnisonsByEventId,
  getEventMusicUnisonByEventId,
  transcribeAudio,
  submitEventMusicUnisonAudio,
  reviewUserMusicUnisonSubmission,
  getReviewedMusicUnisonSubmissions,
  getUnreviewedMusicUnisonSubmissions,
  getMusicUnisonResultsByEventId,
  getEventMusicUnisonResults,
};
