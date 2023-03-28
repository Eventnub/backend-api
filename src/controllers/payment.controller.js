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

const getUserPaymentForEvent = catchAsync(async (req, res) => {
  const payment = await paymentService.getUserPaymentForEvent(
    req.user.uid,
    req.params.eventId
  );
  res.send(payment);
});

module.exports = {
  handlePaystackTicketPayment,
  handleStripeTicketPayment,
  getUserPaymentForEvent
};
