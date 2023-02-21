const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
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

const getQuestionsByEventId = async (eventId, role) => {
  const snapshot = await admin
    .firestore()
    .collection("questions")
    .where("eventId", "==", eventId)
    .get();
  const questions = snapshot.docs.map((doc) => {
    const question = doc.data();
    if (!["admin"].includes(role)) {
      delete question["correctAnswer"];
    }
    return question;
  });
  return questions;
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

module.exports = {
  createQuestion,
  getQuestionsByEventId,
  getQuestionById,
  updateQuestionById,
  deleteQuestionById,
};
