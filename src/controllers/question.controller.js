const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { questionService } = require("../services");

const createQuestion = catchAsync(async (req, res) => {
  const question = await questionService.createQuestion(req.body);
  res.status(httpStatus.CREATED).send(question);
});

const getQuestionsByEventId = catchAsync(async (req, res) => {
  const questions = await questionService.getQuestionsByEventId(
    req.params.eventId,
    req.user.role
  );
  res.send(questions);
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
    req.params.uid,
    req.body
  );
  res.send(question);
});

const deleteQuestion = catchAsync(async (req, res) => {
  await questionService.deleteQuestionById(req.params.uid);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createQuestion,
  getQuestionsByEventId,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
