const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { adminService } = require("../services");

const login = catchAsync(async (req, res) => {
  const result = await adminService.login(req.body.email, req.body.password);
  res.status(httpStatus.OK).send(result);
});

module.exports = {
  login
};
