const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shuffle = require("../utils/shuffle");
const { getEventById } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");

const createQuestion = async (questionBody) => {
  const event = await getEventById(questionBody.eventId);
  if (!event) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Event with the specified id not found"
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

const updateQuestionById = async (uid, updateBody) => {
  const question = await getQuestionById(uid);
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, "Question with uid not found");
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

const deleteQuestionById = async (uid) => {
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

module.exports = {
  createQuestion,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
  getEventQuizByEventId,
  submitEventQuizAnswersByEventId,
};
