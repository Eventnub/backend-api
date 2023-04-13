const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shuffle = require("../utils/shuffle");
const { sendWonTicketEmail } = require("./email.service");
const { getEventById, getEvents } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");
const { getPaymentByUserIdAndEventId } = require("./payment.service");
const { saveAcquiredTicket } = require("./ticket.service");
const { getUsers } = require("./user.service");

const createQuestion = async (creator, questionBody) => {
  const event = await getEventById(questionBody.eventId);
  if (!event) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Event with the specified id not found"
    );
  }

  if (!["admin"].includes(creator.role) && event.creatorId !== creator.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't add question for events they didn't create"
    );
  }

  const uid = generateFirebaseId("questions");
  questionBody.uid = uid;
  questionBody.createdAt = Date.now();
  questionBody.updatedAt = Date.now();

  if (!questionBody.answerOptions.includes(questionBody.correctAnswer)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Correct answer not found in the options"
    );
  }

  await admin
    .firestore()
    .collection("questions")
    .doc(uid)
    .set({ ...questionBody });

  return { ...questionBody };
};

const getQuestionById = async (uid, role) => {
  const doc = await admin.firestore().collection("questions").doc(uid).get();
  let question = null;

  if (doc) {
    question = doc.data();
    if (!["admin"].includes(role)) {
      delete question["correctAnswer"];
    }
  }
  return question;
};

const updateQuestionById = async (updater, uid, updateBody) => {
  const question = await getQuestionById(uid);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, "Question with uid not found");
  }

  const event = await getEventById(question.eventId);
  if (!["admin"].includes(updater.role) && event.creatorId !== updater.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't update question for events they didn't create"
    );
  }

  const answerOptions = updateBody.answerOptions
    ? updateBody.answerOptions
    : question.answerOptions;
  const correctAnswer = updateBody.correctAnswer
    ? updateBody.correctAnswer
    : question.correctAnswer;

  if (!answerOptions.includes(correctAnswer)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Correct answer not found in the options"
    );
  }

  updateBody.updatedAt = Date.now();

  await admin
    .firestore()
    .collection("questions")
    .doc(uid)
    .update({ ...updateBody });
  return updateBody;
};

const deleteQuestionById = async (deleter, uid) => {
  const question = await getQuestionById(uid);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, "Question with uid not found");
  }

  const event = await getEventById(question.eventId);
  if (!["admin"].includes(deleter.role) && event.creatorId !== deleter.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't delete question for events they didn't create"
    );
  }

  await admin.firestore().collection("questions").doc(uid).delete();
};

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

const getQuizResultsByEventId = async (eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("quizResults")
    .where("eventId", "==", eventId)
    .get();
  const quizResults = snapshot.docs.map((doc) => doc.data());
  return quizResults;
};

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

const getEventQuizByEventId = async (eventId, role) => {
  const snapshot = await admin
    .firestore()
    .collection("questions")
    .where("eventId", "==", eventId)
    .get();
  let questions = snapshot.docs.map((doc) => {
    const question = doc.data();
    if (!["admin"].includes(role)) {
      delete question["correctAnswer"];
    }
    return question;
  });

  if (!["admin"].includes(role)) {
    questions = shuffle(questions);
    if (questions.length > 3) {
      questions = questions.slice(0, 3);
    }
  }

  return questions;
};

const submitEventQuizAnswersByEventId = async (
  userId,
  eventId,
  answersBody
) => {
  const payment = await getPaymentByUserIdAndEventId(userId, eventId);
  if (!payment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've not made payment for this event quiz"
    );
  }

  const quizResult = await getQuizResultByUserIdAndEventId(userId, eventId);
  if (quizResult) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already taken this quiz"
    );
  }

  const raffleDrawResult = await getRaffleDrawResultByUserIdAndEventId(
    userId,
    eventId
  );
  if (raffleDrawResult) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You've already made a submission for this event raffle draw.
      Users can only participate in one game for a particular event.`
    );
  }

  const event = await getEventById(eventId);
  if (event && Date.now() > event.gameEndTimestamp) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Submission of quiz answers has ended"
    );
  }

  const eventQuiz = await getEventQuizByEventId(eventId, "admin");

  if (!(eventQuiz.length > 0)) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "There are no questions for the event id"
    );
  }

  const questionAndAnswers = [];
  let numberOfPasses = 0;
  let numberOfFailures = 0;

  answersBody.answers.forEach((answer) => {
    const [question] = eventQuiz.filter(
      (question) => question.uid === answer.questionId
    );

    questionAndAnswers.push({
      question: question.question,
      correctAnswer: question.correctAnswer,
      userAnswer: answer.answer,
    });

    if (question.correctAnswer === answer.answer) {
      numberOfPasses++;
    } else {
      numberOfFailures++;
    }
  });

  const uid = generateFirebaseId("quizResults");

  const result = {
    uid,
    userId,
    eventId,
    ticketIndex: payment.ticketIndex,
    questionAndAnswers,
    numberOfPasses,
    numberOfFailures,
    numberOfQuestions: questionAndAnswers.length,
    submittedAt: Date.now(),
  };

  await admin.firestore().collection("quizResults").doc(uid).set(result);
  delete result["questionAndAnswers"];

  return result;
};

const rewardTicketWinners = async (rewardData) => {
  for (let i = 0; i < rewardData.length; i++) {
    await saveAcquiredTicket(rewardData[i].acquiredTicket);
    await sendWonTicketEmail(rewardData[i].emailData);
  }
};

const getEventQuizWinnersByEventId = async (eventId, role) => {
  let quizAndMusicUnisonWinners = await getQuizAndMusicUnisonWinnersByEventId(
    eventId
  );

  if (!quizAndMusicUnisonWinners) {
    const event = await getEventById(eventId);
    if (event && event.gameEndTimestamp > Date.now()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Submission of quiz answers has not ended yet"
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

    const quizAndMusicUnisonResults = quizResults.forEach((quizResult) => {
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
    // await rewardTicketWinners(rewardData);

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

// Added here to avoid circular dependency issue
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

module.exports = {
  createQuestion,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
  getEventQuizByEventId,
  submitEventQuizAnswersByEventId,
  getEventQuizWinnersByEventId,
};
