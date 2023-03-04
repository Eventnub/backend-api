const catchAsync = require("../utils/catchAsync");
const { paymentService } = require("../services");

const verifyTicketPayment = catchAsync(async (req, res) => {
  const result = await paymentService.verifyTicketPayment(
    req.user.uid,
    req.body
  );
  res.send(result);
});

module.exports = {
  verifyTicketPayment,
};
