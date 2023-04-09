const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { reviewerService } = require("../services");

const sendPhoneNumberVerificationCode = catchAsync(async (req, res) => {
  await reviewerService.sendPhoneNumberVerificationCode(req.body, req.user);
  res.status(httpStatus.OK).send();
});

module.exports = {
  sendPhoneNumberVerificationCode,
};
