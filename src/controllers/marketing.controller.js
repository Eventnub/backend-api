const catchAsync = require("../utils/catchAsync");
const httpStatus = require("http-status");
const { marketingService } = require("../services");

const submitQuizAnswers = catchAsync(async (req, res) => {
  const result = await marketingService.submitQuizAnswers(req.body);
  res.send(result);
});

const submitEmail = catchAsync(async (req, res) => {
  await marketingService.submitEmail(req.body);
  res.status(httpStatus.OK).send();
});

module.exports = {
  submitQuizAnswers,
  submitEmail,
};
