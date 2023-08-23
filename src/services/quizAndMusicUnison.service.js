const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { sendWonTicketEmail } = require("./email.service");
const { getEventById } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");
const { saveAcquiredTicket } = require("./ticket.service");
const { getUserById } = require("./user.service");

const getQuizAndMusicUnisonWinnersByEventId = async (eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("quizAndMusicUnisonWinners")
    .where("eventId", "==", eventId)
    .get();
  const quizAndMusicUnisonWinners = snapshot.docs.map((doc) => doc.data());
  return quizAndMusicUnisonWinners;
};

const processWinningResult = async (
  userId,
  eventId,
  quizResult,
  musicUnisonResult
) => {
  const uid = generateFirebaseId("quizAndMusicUnisonWinners");
  const winnerRecord = {
    uid,
    userId,
    eventId,
    isIOSDevice: quizResult.isIOSDevice,
    quizRecord: {
      uid: quizResult.uid,
      numberOfPasses: quizResult.numberOfPasses,
    },
    musicUnisonRecord: {
      uid: musicUnisonResult.uid || "NA",
      accuracyRatio: musicUnisonResult.accuracyRatio || "NA",
    },
    wonTicketIndex: quizResult.ticketIndex,
    medium: "quiz and music match",
  };

  await admin
    .firestore()
    .collection("quizAndMusicUnisonWinners")
    .doc(uid)
    .set(winnerRecord);

  const user = await getUserById(userId);
  const event = await getEventById(eventId);

  const acquiredTicket = {
    userId: user.uid,
    eventId: event.uid,
    ticketIndex: quizResult.ticketIndex,
    acquisitionMethod: "Won",
    playedGame: "quiz and music unison",
  };
  const emailData = {
    userName: user.firstName,
    userEmail: user.email,
    eventName: event.name,
    eventDate: event.date,
    playedGame: "Quiz and Music Unison",
    ticketUrl: `https://globeventnub.com/dashboard/tickets`,
  };

  await saveAcquiredTicket(acquiredTicket);
  await sendWonTicketEmail(emailData);
};

module.exports = {
  getQuizAndMusicUnisonWinnersByEventId,
};
