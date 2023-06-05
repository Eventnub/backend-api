const catchAsync = require("../utils/catchAsync");
const { marketingService } = require("../services");

const submitQuizAnswers = catchAsync(async (req, res) => {
  const result = await marketingService.submitQuizAnswers(req.body);
  res.send(result);
});

module.exports = {
  submitQuizAnswers,
};
