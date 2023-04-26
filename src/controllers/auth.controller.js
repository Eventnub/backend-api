const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { authService, userService } = require("../services");

const register = catchAsync(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.status(httpStatus.OK).send(result);
});

const sendPasswordResetEmail = catchAsync(async (req, res) => {
  if (req.user.email !== req.body.email) {
    throw new ApiError(
      httpStatus.NOT_ACCEPTABLE,
      "Requesting user email doesn't match supplied email"
    );
  }
  await authService.sendPasswordResetEmail(req.body.email);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendForgotPasswordEmail = catchAsync(async (req, res) => {
  const user = await userService.getUserByEmail(req.body.email);
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No user with the specified email"
    );
  }
  await authService.sendPasswordResetEmail(req.body.email);
  res.status(httpStatus.NO_CONTENT).send();
});

const resendEmailVerificationLink = catchAsync(async (req, res) => {
  await authService.resendEmailVerificationLink(req.body.email);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  sendPasswordResetEmail,
  sendForgotPasswordEmail,
  resendEmailVerificationLink,
};
