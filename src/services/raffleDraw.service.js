const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shuffle = require("../utils/shuffle");
const { genNValuesInRange } = require("../utils/generator");
const { sendWonTicketEmail, sendGameResultEmail } = require("./email.service");
const { getEventById, getEvents } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");
const { getPaymentById, updatePaymentExtraData } = require("./payment.service");
const { saveAcquiredTicket } = require("./ticket.service");
const { getUsers, getUserById } = require("./user.service");

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

const submitEventRaffleDrawChoiceByEventId = async (
  userId,
  eventId,
  choiceBody
) => {
  const payment = await getPaymentById(choiceBody.paymentId);
  if (!payment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "No payment matched this submission"
    );
  }

  if (payment.userId !== userId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment was not made by this user"
    );
  }

  if (payment.eventId !== eventId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment not made for this event"
    );
  }

  if (payment.objective !== "raffle draw") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment not made for raffle draw"
    );
  }

  if (payment.extraData.hasPlayedRaffleDraw) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already completed the raffle draw"
    );
  }

  const eventRaffleDraw = await getEventRaffleDrawByEventId(eventId, "admin");

  if (!eventRaffleDraw) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "There is no raffle draw for the event id"
    );
  }

  const event = await getEventById(eventId);
  if (event && Date.now() > event.gameEndTimestamp) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Submission of raffle draw choice numbers has ended"
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
    paymentId: choiceBody.paymentId,
    userId,
    eventId,
    ticketIndex: payment.ticketIndex,
    chosenNumbers: choiceBody.chosenNumbers,
    correctMatches,
    numberOfCorrectMatches: correctMatches.length,
    submittedAt: Date.now(),
  };

  await admin.firestore().collection("raffleDrawResults").doc(uid).set(result);
  await updatePaymentExtraData(payment.uid, { hasPlayedRaffleDraw: true });

  const user = await getUserById(userId);

  const emailData = {
    userName: user.firstName,
    userEmail: user.email,
    eventName: event.name,
    eventDate: event.date,
    ticketType: event.tickets[payment.ticketIndex].type || "Null",
    game: "Raffle Draw",
    result: [
      {
        title: "Raffle Draw:",
        score: `${correctMatches.length}/${eventRaffleDraw.chosenNumbers.length}`,
      },
    ],
  };

  await sendGameResultEmail(emailData);

  if (result.correctMatches.length === eventRaffleDraw.chosenNumbers.length) {
    await processWinningResult(userId, eventId, result);
  }

  delete result["correctMatches"];
  return result;
};

const getRaffleDrawWinnersByEventId = async (eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("raffleDrawWinners")
    .where("eventId", "==", eventId)
    .get();
  let raffleDrawWinners = snapshot.docs.map((doc) => doc.data());

  if (raffleDrawWinners && raffleDrawWinners.length > 0) {
    const users = await getUsers();
    const events = await getEvents({});

    raffleDrawWinners = raffleDrawWinners.map((winner) => {
      const user = users.find((user) => user.uid === winner.userId);
      const event = events.find((event) => event.uid === winner.eventId);

      winner.user = user;
      winner.ticketWon =
        winner.wonTicketIndex < event.tickets?.length
          ? event.tickets[winner.wonTicketIndex]
          : event.tickets[0];

      return winner;
    });
  }

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

const processWinningResult = async (userId, eventId, result) => {
  const uid = generateFirebaseId("raffleDrawWinners");
  const winnerRecord = {
    uid,
    userId,
    eventId,
    raffleDrawRecord: {
      uid: result.uid,
      numberOfCorrectMatches: result.numberOfCorrectMatches,
    },
    wonTicketIndex: result.ticketIndex,
    medium: "raffle draw",
    createdAt: Date.now(),
  };

  await admin
    .firestore()
    .collection("raffleDrawWinners")
    .doc(uid)
    .set(winnerRecord);

  const user = await getUserById(userId);
  const event = await getEventById(eventId);

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
    ticketUrl: `https://globeventnub.com/dashboard/tickets`,
  };

  await saveAcquiredTicket(acquiredTicket);
  await sendWonTicketEmail(emailData);
};

const getEventRaffleDrawResults = async (eventId) => {
  const users = await getUsers();
  let results = await getRaffleDrawResultsByEventId(eventId);

  results = results.map((result) => {
    const user = users.find((user) => user.uid === result.userId);
    result.user = user;
    return result;
  });

  const totalTakes = results.length;
  const totalPasses = results.filter(
    (result) => result.numberOfCorrectMatches >= result.chosenNumbers.length / 2
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
  createRaffleDraw,
  getRaffleDrawById,
  updateRaffleDrawById,
  deleteRaffleDrawById,
  getEventRaffleDrawByEventId,
  submitEventRaffleDrawChoiceByEventId,
  getRaffleDrawWinnersByEventId,
  getEventRaffleDrawResults,
};
