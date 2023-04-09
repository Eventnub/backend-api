const axios = require("axios");
const { sinchConfig } = require("../config/config");

const sendSMS = async (to, message) => {
  const response = await axios.post(
    "https://us.sms.api.sinch.com/xms/v1/" +
      sinchConfig.servicePlanId +
      "/batches",
    {
      from: sinchConfig.sinchNumber,
      to: [to],
      body: message,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sinchConfig.apiToken}`,
      },
    }
  );
};

module.exports = {
  sendSMS,
};
