const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { seatGeekService } = require("../services");

const getSeatGeekEvents = catchAsync(async (req, res) => {
  const result = await seatGeekService.getSeatGeekEvents(req.query);
  res.send(result);
});

module.exports = {
  getSeatGeekEvents,
};
