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

const getSeatGeekEvent = async (eventId) => {
  try {
    let { data } = await axios.get(
      `${seatGeekBaseUrl}/events/${eventId}?client_id=${seatGeekClientApi}`
    );
    return data;
  } catch (error) {
    if (error.code === "ERR_BAD_REQUEST") {
      throw new ApiError(httpStatus.NOT_FOUND, "Event with ID not found");
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  }
};

module.exports = {
  getSeatGeekEvents,
  getSeatGeekEvent,
};
