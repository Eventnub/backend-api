const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { reviewerService } = require("../services");

const sendEmailVerificationCode = catchAsync(async (req, res) => {
  await reviewerService.sendEmailVerificationCode(req.user);
  res.status(httpStatus.OK).send();
});

const verifyCode = catchAsync(async (req, res) => {
  const result = await reviewerService.verifyCode(req.body.code, req.user);
  res.status(httpStatus.OK).send(result);
});

const submitIdDocument = catchAsync(async (req, res) => {
  await reviewerService.submitIdDocument(
    req.files.frontImagePhoto[0],
    req.files.backImagePhoto[0],
    req.body.verificationCodeId,
    req.user
  );
  res.status(httpStatus.OK).send();
});

module.exports = {
  sendEmailVerificationCode,
  verifyCode,
  submitIdDocument,
};
