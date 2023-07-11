const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { sendWonTicketEmail } = require("./email.service");
const { getEventById } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");
const { saveAcquiredTicket } = require("./ticket.service");
const { getUsers } = require("./user.service");
const { getQuizResultsByEventId } = require("./question.service");
const { getMusicUnisonResultsByEventId } = require("./musicUnison.service");

const getQuizAndMusicUnisonWinnersByEventId = async (eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("quizAndMusicUnisonWinners")
    .where("eventId", "==", eventId)
    .get();
  const quizAndMusicUnisonWinners = snapshot.empty
    ? null
    : snapshot.docs.at(0).data();
  return quizAndMusicUnisonWinners;
};

const rewardTicketWinners = async (rewardData) => {
  for (let i = 0; i < rewardData.length; i++) {
    await saveAcquiredTicket(rewardData[i].acquiredTicket);
    await sendWonTicketEmail(rewardData[i].emailData);
  }
};

const getEventQuizAndMusicUnisonWinners = async (eventId, role) => {
  let quizAndMusicUnisonWinners = await getQuizAndMusicUnisonWinnersByEventId(
    eventId
  );

  if (!quizAndMusicUnisonWinners) {
    const event = await getEventById(eventId);
    if (event && event.gameEndTimestamp > Date.now()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Submission of quiz answers and music match audio has not ended yet"
      );
    }

    const quizResults = await getQuizResultsByEventId(eventId);
    const musicUnisonResults = await getMusicUnisonResultsByEventId(eventId);

    if (quizResults.length === 0) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "There are no results for this event's quiz"
      );
    }

    if (musicUnisonResults.length === 0) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "There are no results for this event's music unsion"
      );
    }

    const winningQuizResults = quizResults.filter(
      (result) => result.numberOfPasses === result.numberOfQuestions
    );

    const winners = [];

    for (let i = 0; i < winningQuizResults.length; i++) {
      const currentQuizResult = winningQuizResults[i];
      const [musicUnisonResult] = musicUnisonResults.filter(
        (musicUnisonResult) =>
          currentQuizResult.userId === musicUnisonResult.userId &&
          currentQuizResult.eventId === musicUnisonResult.eventId &&
          currentQuizResult.paymentId === musicUnisonResult.paymentId
      );

      if (musicUnisonResult && !musicUnisonResult.isReviewed) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "There is an unreviewed music unison submission"
        );
      }

      if (musicUnisonResult && +musicUnisonResult.accuracyRatio > 0.8) {
        winners.push({
          userId: currentQuizResult.userId || musicUnisonResult.userId,
          eventId: currentQuizResult.eventId || musicUnisonResult.eventId,
          quizRecord: {
            uid: currentQuizResult.uid,
            numberOfPasses: currentQuizResult.numberOfPasses,
          },
          musicUnisonRecord: {
            uid: musicUnisonResult.uid,
            accuracyRatio: musicUnisonResult.accuracyRatio,
          },
        });
      }
    }

    const users = await getUsers();
    const rewardData = winners.map((winner) => {
      const [user] = users.filter((user) => user.uid === winner.userId);
      const [result] = quizResults.filter(
        (result) => result.uid === winner.quizRecord.uid
      );
      const acquiredTicket = {
        userId: user.uid,
        eventId: event.uid,
        ticketIndex: result.ticketIndex,
        acquisitionMethod: "Won",
        playedGame: "quiz and music unison",
      };
      const emailData = {
        userName: user.firstName,
        userEmail: user.email,
        eventName: event.name,
        eventDate: event.date,
        playedGame: "Quiz and Music Unison",
        ticketUrl: `https://eventnub.netlify.app/dashboard/tickets`,
      };

      return { acquiredTicket, emailData };
    });
    await rewardTicketWinners(rewardData);

    const uid = generateFirebaseId("quizAndMusicUnisonWinners");
    quizAndMusicUnisonWinners = {
      uid,
      eventId,
      winners,
      createdAt: Date.now(),
    };

    await admin
      .firestore()
      .collection("quizAndMusicUnisonWinners")
      .doc(uid)
      .set(quizAndMusicUnisonWinners);
  }

  return quizAndMusicUnisonWinners;
};

module.exports = {
  getEventQuizAndMusicUnisonWinners,
};
