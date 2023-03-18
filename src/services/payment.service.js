const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { paystackSecretKey } = require("../config/config");
const { admin, generateFirebaseId } = require("./firebase.service");
const { getEventById } = require("./event.service");
const { getUserById } = require("./user.service");
const { saveAcquiredTicket } = require("./ticket.service");
const { sendBoughtTicketEmail } = require("./email.service");

const verifyPaystackPayment = async (reference) => {
  try {
    let result = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: "Bearer " + paystackSecretKey,
        },
      }
    );

    if (result.data.status === true) {
      const transactionData = result.data.data;

      if (transactionData.status === "success") {
        return true;
      }
    }

    return false;
  } catch (error) {
    return null;
  }
};

const getPaymentByTransactionReference = async (transactionReference) => {
  const snapshot = await admin
    .firestore()
    .collection("payments")
    .where("transactionReference", "==", transactionReference)
    .get();
  const user = snapshot.empty ? null : snapshot.docs[0].data();
  return user;
};

const getPaymentByUserIdAndEventId = async (userId, eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("payments")
    .where("userId", "==", userId)
    .where("eventId", "==", eventId)
    .get();
  const user = snapshot.empty ? null : snapshot.docs.at(0).data();
  return user;
};

const verifyTicketPayment = async (userId, paymentBody) => {
  try {
    const payment = await getPaymentByTransactionReference(
      paymentBody.transactionReference
    );
    if (payment) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Payment with the specified transaction reference has already being processed"
      );
    }

    if (paymentBody.paymentService === "paystack") {
      const isSuccess = await verifyPaystackPayment(
        paymentBody.transactionReference
      );

      if (!isSuccess) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Invalid transaction reference."
        );
      }
    }

    const event = await getEventById(paymentBody.eventId);
    if (!event) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Event with specified eventId not found"
      );
    }

    if (!event.tickets || !(paymentBody.ticketIndex < event.tickets.length)) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Ticket at specified ticketIndex not found"
      );
    }

    if (paymentBody.objective === "to buy") {
      const acquiredTicket = {
        userId,
        eventId: paymentBody.eventId,
        ticketIndex: paymentBody.ticketIndex,
        acquisitionMethod: "Paid",
      };
      await saveAcquiredTicket(acquiredTicket);

      const user = await getUserById(userId);
      const emailData = {
        userName: user.firstName,
        userEmail: user.email,
        eventName: event.name,
        eventDate: event.date,
        ticketUrl: `https://eventnub.netlify.app/dashboard/tickets`,
      };
      await sendBoughtTicketEmail(emailData);
    }

    paymentBody.userId = userId;
    paymentBody.createdAt = Date.now();

    const uid = generateFirebaseId("payments");

    await admin
      .firestore()
      .collection("payments")
      .doc(uid)
      .set({ ...paymentBody });
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  verifyTicketPayment,
  getPaymentByUserIdAndEventId
};
