const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { sinchConfig } = require("../config/config");
const { sendSMS } = require("./sms.service");

const sendPhoneNumberVerificationCode = async ({ phoneNumber }, requester) => {
  try {
    const message = `Eventnub reviewer verification code is ${32132}`;
    await sendSMS(phoneNumber, message);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  sendPhoneNumberVerificationCode,
};
