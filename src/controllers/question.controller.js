const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { questionService } = require("../services");

const createQuestion = catchAsync(async (req, res) => {
  const question = await questionService.createQuestion(req.user, req.body);
  res.status(httpStatus.CREATED).send(question);
});

const getQuestion = catchAsync(async (req, res) => {
  const question = await questionService.getQuestionById(
    req.params.uid,
    req.user.role
  );
  if (!question) {
    throw new ApiError(httpStatus.NOT_FOUND, "Question not found");
  }
  res.send(question);
});

const updateQuestion = catchAsync(async (req, res) => {
  const question = await questionService.updateQuestionById(
    req.user,
    req.params.uid,
    req.body
  );
  res.send(question);
});

const deleteQuestion = catchAsync(async (req, res) => {
  await questionService.deleteQuestionById(req.user, req.params.uid);
  res.status(httpStatus.NO_CONTENT).send();
});

const getEventQuiz = catchAsync(async (req, res) => {
  const questions = await questionService.getEventQuizByEventId(
    req.params.eventId,
    req.query.isIOSDevice,
    req.user.role
  );
  res.send(questions);
});

const submitEventQuizAnswers = catchAsync(async (req, res) => {
  const result = await questionService.submitEventQuizAnswersByEventId(
    req.user.uid,
    req.params.eventId,
    req.body
  );
  res.send(result);
});

const getEventQuizResults = catchAsync(async (req, res) => {
  const results = await questionService.getEventQuizResults(req.params.eventId);
  res.send(results);
});

module.exports = {
  createQuestion,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getEventQuiz,
  submitEventQuizAnswers,
  getEventQuizResults,
};
