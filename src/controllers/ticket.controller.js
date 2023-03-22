const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { ticketService } = require("../services");

const getUserAcquiredTickets = catchAsync(async (req, res) => {
  const result = await ticketService.getUserAcquiredTicketsByUserId(
    req.params.userId,
    req.user
  );
  res.send(result);
});

module.exports = {
  getUserAcquiredTickets,
};
