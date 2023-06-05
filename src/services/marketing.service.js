const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, generateFirebaseId } = require("./firebase.service");
const { questions } = require("../config/marketing");

const submitQuizAnswers = async (answersBody) => {
  const questionAndAnswers = [];
  let numberOfPasses = 0;
  let numberOfFailures = 0;

  answersBody.answers.forEach((answer) => {
    const [question] = questions.filter(
      (question) => question.id === answer.questionId
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

  const uid = generateFirebaseId("marketingQuizResults");
  const result = {
    firstName: answersBody.firstName,
    lastName: answersBody.lastName,
    email: answersBody.email,
    country: answersBody.country,
    questionAndAnswers,
    numberOfPasses,
    numberOfFailures,
    numberOfQuestions: questionAndAnswers.length,
    submittedAt: Date.now(),
  };

  await admin
    .firestore()
    .collection("marketingQuizResults")
    .doc(uid)
    .set(result);
  delete result["questionAndAnswers"];

  return result;
};

module.exports = {
  submitQuizAnswers,
};
