const catchAsync = require("../utils/catchAsync");
const { paymentService } = require("../services");

const verifyTicketPayment = catchAsync(async (req, res) => {
  await paymentService.verifyTicketPayment(req.user.uid, req.body);
  res.status(httpStatus.NO_CONTENT).send();
});

const handleStripeTicketPayment = catchAsync(async (req, res) => {
  await paymentService.handleStripeTicketPayment(req.user, req.body);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  verifyTicketPayment,
  handleStripeTicketPayment,
};
