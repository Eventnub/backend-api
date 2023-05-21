const catchAsync = require("../utils/catchAsync");
const httpStatus = require("http-status");
const { paymentService } = require("../services");

const handlePaystackTicketPayment = catchAsync(async (req, res) => {
  const result = await paymentService.handlePaystackTicketPayment(req.user, req.body);
  res.send(result);
});

const handleStripeTicketPayment = catchAsync(async (req, res) => {
  const result = await paymentService.handleStripeTicketPayment(req.user, req.body);
  res.send(result);
});

const getUserPaymentsForEvent = catchAsync(async (req, res) => {
  const payments = await paymentService.getUserPaymentsForEvent(
    req.user.uid,
    req.params.eventId
  );
  res.send(payments);
});

module.exports = {
  handlePaystackTicketPayment,
  handleStripeTicketPayment,
  getUserPaymentsForEvent
};
