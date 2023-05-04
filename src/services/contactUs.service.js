const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const emailService = require("./email.service");

const contactUs = async (contactBody) => {
  await emailService.sendContactUsEmail(
    contactBody.name,
    contactBody.email,
    contactBody.message
  );
};

module.exports = {
  contactUs,
};
