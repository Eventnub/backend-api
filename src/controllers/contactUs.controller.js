const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { contactUsService } = require("../services");

const contactUs = catchAsync(async (req, res) => {
  await contactUsService.contactUs(req.body);
  res.status(httpStatus.OK).send();
});

module.exports = {
  contactUs,
};
