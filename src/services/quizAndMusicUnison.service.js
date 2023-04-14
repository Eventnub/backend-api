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
    // if (event && event.gameEndTimestamp > Date.now()) {
    //   throw new ApiError(
    //     httpStatus.BAD_REQUEST,
    //     "Submission of quiz answers and music match audio has not ended yet"
    //   );
    // }

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

    const quizAndMusicUnisonResults = quizResults.map((quizResult) => {
      const [musicUnisonResult] = musicUnisonResults.filter(
        (musicUnisonResult) =>
          quizResult.userId === musicUnisonResult.userId &&
          quizResult.eventId === musicUnisonResult.eventId
      );

      if (!musicUnisonResult) {
        const totalScore = parseFloat(
          (
            (quizResult.numberOfPasses / quizResult.numberOfQuestions) *
            100
          ).toFixed(6)
        );

        return {
          userId: quizResult.userId,
          eventId: quizResult.eventId,
          quizResultId: quizResult.uid,
          musicUnisonResultId: "",
          totalScore,
        };
      }

      if (!musicUnisonResult.isReviewed) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "There is an unreviewed music unsion submission"
        );
      }

      const totalScore = parseFloat(
        (
          (quizResult.numberOfPasses / quizResult.numberOfQuestions +
            musicUnisonResult.accuracyRation) *
          100
        ).toFixed(6)
      );

      return {
        userId: quizResult.userId || musicUnisonResult.userId,
        eventId: quizResult.eventId || musicUnisonResult.eventId,
        quizResultId: quizResult.uid,
        musicUnisonResultId: musicUnisonResult.uid,
        totalScore,
      };
    });

    const sortedQuizAndMusicUnisonResultsizResults =
      quizAndMusicUnisonResults.sort((a, b) => {
        if (a.totalScore < b.totalScore) return 1;
        if (a.totalScore > b.totalScore) return -1;
      });

    const winners = sortedQuizAndMusicUnisonResultsizResults.slice(0, 5);

    const users = await getUsers();
    const rewardData = winners.map((winner) => {
      const [user] = users.filter((user) => user.uid === winner.userId);
      const [result] = quizResults.filter(
        (result) => result.uid === winner.quizResultId
      );
      const acquiredTicket = {
        userId: user.uid,
        eventId: event.uid,
        ticketIndex: result.ticketIndex,
        acquisitionMethod: "Won",
        playedGame: "quiz",
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
