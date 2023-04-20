const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shuffle = require("../utils/shuffle");
const { genNValuesInRange } = require("../utils/generator");
const { sendWonTicketEmail } = require("./email.service");
const { getEventById } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");
const { getPaymentByUserIdAndEventId } = require("./payment.service");
const { saveAcquiredTicket } = require("./ticket.service");
const { getUsers } = require("./user.service");

const createRaffleDraw = async (creator, raffleDrawBody) => {
  const event = await getEventById(raffleDrawBody.eventId);
  if (!event) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Event with the specified id not found"
    );
  }

  if (!["admin"].includes(creator.role) && event.creatorId !== creator.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't add raffle draw for events they didn't create"
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

  raffleDrawBody.chosenNumbers = genNValuesInRange(
    5,
    raffleDrawBody.firstNumber,
    raffleDrawBody.lastNumber
  );

  await admin
    .firestore()
    .collection("raffleDraws")
    .doc(uid)
    .set({ ...raffleDrawBody });

  return raffleDrawBody;
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

const updateRaffleDrawById = async (updater, uid, updateBody) => {
  const raffleDraw = await getRaffleDrawById(uid);
  if (!raffleDraw) {
    throw new ApiError(httpStatus.NOT_FOUND, "Raffle draw with uid not found");
  }

  const event = await getEventById(raffleDraw.eventId);
  if (!["admin"].includes(updater.role) && event.creatorId !== updater.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't update raffle draw for events they didn't create"
    );
  }

  updateBody.firstNumber = updateBody.firstNumber
    ? updateBody.firstNumber
    : raffleDraw.firstNumber;
  updateBody.numbersCount = updateBody.numbersCount
    ? updateBody.numbersCount
    : raffleDraw.numbersCount;
  updateBody.lastNumber = updateBody.firstNumber + updateBody.numbersCount - 1;

  updateBody.chosenNumbers = genNValuesInRange(
    5,
    updateBody.firstNumber,
    updateBody.lastNumber
  );

  updateBody.updatedAt = Date.now();

  await admin.firestore().collection("raffleDraws").doc(uid).update(updateBody);
  return updateBody;
};

const deleteRaffleDrawById = async (deleter, uid) => {
  const raffleDraw = await getRaffleDrawById(uid);
  if (!raffleDraw) {
    throw new ApiError(httpStatus.NOT_FOUND, "Raffle draw with uid not found");
  }

  const event = await getEventById(raffleDraw.eventId);
  if (!["admin"].includes(deleter.role) && event.creatorId !== deleter.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't delete raffle draw for events they didn't create"
    );
  }

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

const getRaffleDrawResultByUserIdAndEventId = async (userId, eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("raffleDrawResults")
    .where("userId", "==", userId)
    .where("eventId", "==", eventId)
    .get();
  const raffleDrawResult = snapshot.empty ? null : snapshot.docs.at(0).data();
  return raffleDrawResult;
};

const submitEventRaffleDrawChoiceByEventId = async (
  userId,
  eventId,
  choiceBody
) => {
  const payment = await getPaymentByUserIdAndEventId(userId, eventId);
  if (!payment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've not made payment for this event quiz"
    );
  }

  const raffleDrawResult = await getRaffleDrawResultByUserIdAndEventId(
    userId,
    eventId
  );
  if (raffleDrawResult) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already made a submission for this event raffle draw"
    );
  }

  const quizResult = await getQuizResultByUserIdAndEventId(userId, eventId);
  if (quizResult) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You've already made a submission for this event quiz.
      Users can only participate in one game for a particular event.`
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

  const uid = generateFirebaseId("raffleDrawResults");

  const result = {
    uid,
    userId,
    eventId,
    ticketIndex: payment.ticketIndex,
    chosenNumbers: choiceBody.chosenNumbers,
    correctMatches,
    numberOfCorrectMatches: correctMatches.length,
    submittedAt: Date.now(),
  };

  await admin.firestore().collection("raffleDrawResults").doc(uid).set(result);
  delete result["correctMatches"];

  return result;
};

const getRaffleDrawWinnersByEventId = async (eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("raffleDrawWinners")
    .where("eventId", "==", eventId)
    .get();
  const raffleDrawWinners = snapshot.empty ? null : snapshot.docs.at(0).data();
  return raffleDrawWinners;
};

const getRaffleDrawResultsByEventId = async (eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("raffleDrawResults")
    .where("eventId", "==", eventId)
    .get();
  const raffleDrawResults = snapshot.docs.map((doc) => doc.data());
  return raffleDrawResults;
};

const rewardTicketWinners = async (rewardData) => {
  for (let i = 0; i < rewardData.length; i++) {
    await saveAcquiredTicket(rewardData[i].acquiredTicket);
    await sendWonTicketEmail(rewardData[i].emailData);
  }
};

const getEventRaffleDrawWinnersByEventId = async (eventId, role) => {
  let raffleDrawWinners = await getRaffleDrawWinnersByEventId(eventId);

  if (!raffleDrawWinners) {
    const event = await getEventById(eventId);
    if (event && event.gameEndTimestamp > Date.now()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Submission of raffle draw choices has not ended yet"
      );
    }

    const raffleDrawResults = await getRaffleDrawResultsByEventId(eventId);

    if (raffleDrawResults.length === 0) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "There are no results for this event's raffle draw"
      );
    }

    const sortedRaffleDrawResults = raffleDrawResults.sort((a, b) => {
      if (a.numberOfCorrectMatches < b.numberOfCorrectMatches) return 1;
      if (a.numberOfCorrectMatches > b.numberOfCorrectMatches) return -1;
    });

    const slicedRaffleDrawResults = sortedRaffleDrawResults.slice(0, 5);

    const winners = slicedRaffleDrawResults.map((result) => ({
      userId: result.userId,
      resultId: result.uid,
    }));

    const users = await getUsers();
    const rewardData = winners.map((winner) => {
      const [user] = users.filter((user) => user.uid === winner.userId);
      const [result] = raffleDrawResults.filter(
        (result) => result.uid === winner.resultId
      );
      const acquiredTicket = {
        userId: user.uid,
        eventId: event.uid,
        ticketIndex: result.ticketIndex,
        acquisitionMethod: "Won",
        playedGame: "raffle draw",
      };
      const emailData = {
        userName: user.firstName,
        userEmail: user.email,
        eventName: event.name,
        eventDate: event.date,
        playedGame: "raffle draw",
        ticketUrl: `https://eventnub.netlify.app/dashboard/tickets`,
      };

      return { acquiredTicket, emailData };
    });
    await rewardTicketWinners(rewardData);

    const uid = generateFirebaseId("raffleDrawWinners");
    raffleDrawWinners = {
      uid,
      eventId,
      winners,
      createdAt: Date.now(),
    };

    await admin
      .firestore()
      .collection("raffleDrawWinners")
      .doc(uid)
      .set(raffleDrawWinners);
  }

  return raffleDrawWinners;
};

// Added here to avoid circular dependency issue
const getQuizResultByUserIdAndEventId = async (userId, eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("quizResults")
    .where("userId", "==", userId)
    .where("eventId", "==", eventId)
    .get();
  const quizResult = snapshot.empty ? null : snapshot.docs.at(0).data();
  return quizResult;
};

module.exports = {
  createRaffleDraw,
  getRaffleDrawById,
  updateRaffleDrawById,
  deleteRaffleDrawById,
  getEventRaffleDrawByEventId,
  submitEventRaffleDrawChoiceByEventId,
  getEventRaffleDrawWinnersByEventId,
};
