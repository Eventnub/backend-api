const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { reviewerService } = require("../services");

const sendEmailVerificationCode = catchAsync(async (req, res) => {
  await reviewerService.sendEmailVerificationCode(req.user);
  res.status(httpStatus.OK).send();
});

const verifyCode = catchAsync(async (req, res) => {
  await reviewerService.verifyCode(req.body.code, req.user);
  res.status(httpStatus.OK).send();
});

module.exports = {
  sendEmailVerificationCode,
  verifyCode,
};
