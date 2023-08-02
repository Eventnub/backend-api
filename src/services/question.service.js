const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shuffle = require("../utils/shuffle");
const { getEventById } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");
const { updatePaymentExtraData, getPaymentById } = require("./payment.service");
const { getUsers, getUserById } = require("./user.service");
const { sendGameResultEmail } = require("./email.service");

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

const getEventQuizByEventId = async (eventId, isIOSDevice, role) => {
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

  const questionsCount = isIOSDevice ? 10 : 5;

  if (!["admin"].includes(role)) {
    questions = shuffle(questions);
    if (questions.length > questionsCount) {
      questions = questions.slice(0, questionsCount);
    }
  }

  return questions;
};

const submitEventQuizAnswersByEventId = async (
  userId,
  eventId,
  answersBody
) => {
  const payment = await getPaymentById(answersBody.paymentId);
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

  if (payment.objective !== "quiz and music match") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment not made for quiz and music unison"
    );
  }

  if (payment.extraData.hasPlayedQuiz) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already completed the quiz"
    );
  }

  const event = await getEventById(eventId);
  if (event && Date.now() > event.gameEndTimestamp) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Submission of quiz answers has ended"
    );
  }

  const eventQuiz = await getEventQuizByEventId(
    eventId,
    answersBody.isIOSDevice,
    "admin"
  );

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
    paymentId: answersBody.paymentId,
    isIOSDevice: answersBody.isIOSDevice,
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
  await updatePaymentExtraData(payment.uid, {
    hasPlayedQuiz: true,
    isIOSDevice: answersBody.isIOSDevice,
  });

  if (answersBody.isIOSDevice) {
    const user = await getUserById(userId);

    const emailData = {
      userName: user.firstName,
      userEmail: user.email,
      eventName: event.name,
      eventDate: event.date,
      ticketType: event.tickets[payment.ticketIndex].type || "Null",
      game: "Quiz",
      result: [
        {
          title: "Quiz score:",
          score: `${numberOfPasses}/${questionAndAnswers.length}`,
        },
      ],
    };

    await sendGameResultEmail(emailData);
  }

  return result;
};

const getEventQuizResults = async (eventId) => {
  const users = await getUsers();
  let results = await getQuizResultsByEventId(eventId);

  results = results.map((result) => {
    const user = users.find((user) => user.uid === result.userId);
    result.user = user;
    return result;
  });

  const totalTakes = results.length;
  const totalPasses = results.filter(
    (result) => result.numberOfPasses === result.numberOfQuestions
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
  createQuestion,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
  getEventQuizByEventId,
  submitEventQuizAnswersByEventId,
  getQuizResultsByEventId,
  getEventQuizResults,
};
