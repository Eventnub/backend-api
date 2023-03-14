const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shuffle = require("../utils/shuffle");
const { getEventById } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");

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

const getQuizWinnersByEventId = async (eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("quizWinners")
    .where("eventId", "==", eventId)
    .get();
  const quizWinners = snapshot.empty ? null : snapshot.docs.at(0).data();
  return quizWinners;
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
  const quizResult = await getQuizResultByUserIdAndEventId(userId, eventId);

  if (quizResult) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already taken this quiz"
    );
  }

  const event = await getEventById(eventId);
  if (event && Date.now() > event.quizEndTimestamp) {
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

const getEventQuizWinnersByEventId = async (eventId, role) => {
  let quizWinners = await getQuizWinnersByEventId(eventId);

  if (!quizWinners) {
    const event = await getEventById(eventId);
    if (event && event.quizEndTimestamp > Date.now()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Submission of quiz answers has not ended yet"
      );
    }

    const quizResults = await getQuizResultsByEventId(eventId);

    if (quizResults.length === 0) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "There are no results for this event's quiz"
      );
    }

    const sortedQuizResults = quizResults.sort((a, b) => {
      if (a.numberOfPasses < b.numberOfPasses) return 1;
      if (a.numberOfPasses > b.numberOfPasses) return -1;
    });

    const slicedQuizResults = sortedQuizResults.slice(0, 5);

    const winners = slicedQuizResults.map((result) => ({
      userId: result.userId,
      resultId: result.uid,
    }));

    // TODO: Send mails containing ticket to winners

    const uid = generateFirebaseId("quizWinners");
    quizWinners = {
      uid,
      eventId,
      winners,
      createdAt: Date.now(),
    };

    await admin.firestore().collection("quizWinners").doc(uid).set(quizWinners);
  }

  return quizWinners;
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
