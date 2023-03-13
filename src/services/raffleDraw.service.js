const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shuffle = require("../utils/shuffle");
const { getEventById } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");

const createRaffleDraw = async (raffleDrawBody) => {
  const event = await getEventById(raffleDrawBody.eventId);
  if (!event) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Event with the specified id not found"
    );
  }

  const raffleDraw = await getEventRaffleDrawByEventId(
    raffleDrawBody.eventId,
    "admin"
  );
  if (raffleDraw) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Raffle draw has already been created for this event"
    );
  }

  const uid = generateFirebaseId("raffleDraws");
  raffleDrawBody.uid = uid;
  raffleDrawBody.lastNumber =
    raffleDrawBody.firstNumber + raffleDrawBody.numbersCount - 1;
  raffleDrawBody.createdAt = Date.now();
  raffleDrawBody.updatedAt = Date.now();

  raffleDrawBody.chosenNumbers.forEach((number) => {
    if (
      number < raffleDrawBody.firstNumber ||
      number > raffleDrawBody.lastNumber
    ) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Chosen numbers must be between ${raffleDrawBody.firstNumber} and ${raffleDrawBody.lastNumber}`
      );
    }
  });

  await admin
    .firestore()
    .collection("raffleDraws")
    .doc(uid)
    .set({ ...raffleDrawBody });

  return { ...raffleDrawBody };
};

const getRaffleDrawById = async (uid, role) => {
  const doc = await admin.firestore().collection("raffleDraws").doc(uid).get();
  let raffleDraw = null;

  if (doc) {
    raffleDraw = doc.data();
    if (!["admin"].includes(role)) {
      delete raffleDraw["chosenNumbers"];
    }
  }
  return raffleDraw;
};

const updateRaffleDrawById = async (uid, updateBody) => {
  const raffleDraw = await getRaffleDrawById(uid);
  if (!raffleDraw) {
    throw new ApiError(httpStatus.NOT_FOUND, "Raffle draw with uid not found");
  }

  const firstNumber = updateBody.firstNumber
    ? updateBody.firstNumber
    : raffleDraw.firstNumber;
  const numbersCount = updateBody.numbersCount
    ? updateBody.numbersCount
    : raffleDraw.numbersCount;
  const chosenNumbers = updateBody.chosenNumbers
    ? updateBody.chosenNumbers
    : raffleDraw.chosenNumbers;

  const lastNumber = firstNumber + numbersCount - 1;

  chosenNumbers.forEach((number) => {
    if (number < firstNumber || number > lastNumber) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Chosen numbers must be between ${firstNumber} and ${lastNumber}`
      );
    }
  });

  updateBody.updatedAt = Date.now();

  await admin
    .firestore()
    .collection("raffleDraws")
    .doc(uid)
    .update({ ...updateBody });
  return updateBody;
};

const deleteRaffleDrawById = async (uid) => {
  await admin.firestore().collection("raffleDraws").doc(uid).delete();
};

const getEventRaffleDrawByEventId = async (eventId, role) => {
  const snapshot = await admin
    .firestore()
    .collection("raffleDraws")
    .where("eventId", "==", eventId)
    .get();
  const eventRaffleDraw = snapshot.empty ? null : snapshot.docs.at(0).data();

  if (eventRaffleDraw && !["admin"].includes(role)) {
    delete eventRaffleDraw["chosenNumbers"];
  }

  return eventRaffleDraw;
};

const getRaffleDrawChoiceByUserIdAndEventId = async (userId, eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("raffleDrawChoices")
    .where("userId", "==", userId)
    .where("eventId", "==", eventId)
    .get();
  const raffleDrawChoice = snapshot.empty ? null : snapshot.docs.at(0).data();
  return raffleDrawChoice;
};

const submitEventRaffleDrawChoiceByEventId = async (
  userId,
  eventId,
  choiceBody
) => {
  const raffleDrawChoice = await getRaffleDrawChoiceByUserIdAndEventId(
    userId,
    eventId
  );

  if (raffleDrawChoice) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already submitted a choice for this raffle draw"
    );
  }

  const eventRaffleDraw = await getEventRaffleDrawByEventId(eventId, "admin");

  if (!eventRaffleDraw) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "There is no raffle draw for the event id"
    );
  }

  const correctMatches = [];

  choiceBody.chosenNumbers.forEach((number) => {
    if (eventRaffleDraw.chosenNumbers.includes(number)) {
      correctMatches.push(number);
    }
  });

  const uid = generateFirebaseId("raffleDrawChoices");

  const result = {
    uid,
    userId,
    eventId,
    chosenNumbers: choiceBody.chosenNumbers,
    correctMatches,
    numberOfCorrectMatches: correctMatches.length,
    submittedAt: Date.now(),
  };

  await admin.firestore().collection("raffleDrawChoices").doc(uid).set(result);
  delete result["correctMatches"];

  return result;
};

module.exports = {
  createRaffleDraw,
  getRaffleDrawById,
  updateRaffleDrawById,
  deleteRaffleDrawById,
  getEventRaffleDrawByEventId,
  submitEventRaffleDrawChoiceByEventId,
};