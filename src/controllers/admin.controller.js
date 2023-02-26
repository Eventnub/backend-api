const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { adminService } = require("../services");

const register = catchAsync(async (req, res) => {
  const result = await adminService.register(req.body);
  res.status(httpStatus.OK).send(result);
});

const login = catchAsync(async (req, res) => {
  const result = await adminService.login(req.body.email, req.body.password);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  register,
  login,
};
