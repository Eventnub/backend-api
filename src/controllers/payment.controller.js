const catchAsync = require("../utils/catchAsync");
const httpStatus = require("http-status");
const { paymentService } = require("../services");

const handlePaystackTicketPayment = catchAsync(async (req, res) => {
  await paymentService.handlePaystackTicketPayment(req.user, req.body);
  res.status(httpStatus.NO_CONTENT).send();
});

const handleStripeTicketPayment = catchAsync(async (req, res) => {
  await paymentService.handleStripeTicketPayment(req.user, req.body);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  handlePaystackTicketPayment,
  handleStripeTicketPayment,
};
