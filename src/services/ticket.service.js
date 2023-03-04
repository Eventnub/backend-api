const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, generateFirebaseId } = require("./firebase.service");

const saveAcquiredTicket = async (data) => {
  const uid = generateFirebaseId("acquiredTickets");
  data.uid = uid;
  data.createdAt = Date.now();

  await admin
    .firestore()
    .collection("acquiredTickets")
    .doc(uid)
    .set({ ...data });

  return data;
};

module.exports = {
  saveAcquiredTicket,
};
