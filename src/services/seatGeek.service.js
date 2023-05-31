const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { seatGeekClientApi } = require("../config/config");
const { admin, generateFirebaseId } = require("./firebase.service");

const seatGeekBaseUrl = `https://api.seatgeek.com/2`;

const getSeatGeekEvents = async (query) => {
  let { perPage, page } = query;
  perPage = perPage ? perPage : 10;
  page = page ? page : 1;

  let { data } = await axios.get(
    `${seatGeekBaseUrl}/events?per_page=${perPage}&page=${page}&client_id=${seatGeekClientApi}`
  );

  return data;
};

module.exports = {
  getSeatGeekEvents,
};
