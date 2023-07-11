const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { paystackSecretKey } = require("../config/config");
const { admin, generateFirebaseId } = require("./firebase.service");
const { getEventById } = require("./event.service");
const { getUserById } = require("./user.service");
const { saveAcquiredTicket } = require("./ticket.service");
const { sendBoughtTicketEmail } = require("./email.service");
const { stripeSecretKey } = require("../config/config");
const stripe = require("stripe")(stripeSecretKey);

const getPaymentByTransactionReference = async (transactionReference) => {
  const snapshot = await admin
    .firestore()
    .collection("payments")
    .where("transactionReference", "==", transactionReference)
    .get();
  const user = snapshot.empty ? null : snapshot.docs[0].data();
  return user;
};

const getPaymentById = async (paymentId) => {
  const payment = await admin
    .firestore()
    .collection("payments")
    .doc(paymentId)
    .get();
  return payment.data();
};

const onTicketPaymentSuccess = async (userId, paymentBody) => {
  const payment = await getPaymentByTransactionReference(
    paymentBody.transactionReference
  );
  if (payment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment with the specified transaction reference has already being processed"
    );
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

  paymentBody.extraData = {
    hasPlayedQuiz: false,
    hasPlayedMusicUnison: false,
    hasPlayedRaffleDraw: false,
  };

  if (paymentBody.objective === "purchase") {
    paymentBody.extraData = {
      hasPlayedQuiz: true,
      hasPlayedMusicUnison: true,
      hasPlayedRaffleDraw: true,
    };

    const acquiredTicket = {
      userId,
      eventId: paymentBody.eventId,
      ticketIndex: paymentBody.ticketIndex,
      acquisitionMethod: "Purchased",
    };
    await saveAcquiredTicket(acquiredTicket);

    const user = await getUserById(userId);
    const emailData = {
      userName: user.firstName,
      userEmail: user.email,
      eventName: event.name,
      eventDate: event.date,
      ticketUrl: `https://globeventnub.com/dashboard/tickets`,
    };
    await sendBoughtTicketEmail(emailData);
  }

  const uid = generateFirebaseId("payments");

  paymentBody.uid = uid;
  paymentBody.userId = userId;
  paymentBody.createdAt = Date.now();

  await admin
    .firestore()
    .collection("payments")
    .doc(uid)
    .set({ ...paymentBody });

  return paymentBody;
};

const handlePaystackTicketPayment = async (payer, paymentBody) => {
  const { transactionReference } = paymentBody;
  const { uid: userId } = payer;

  try {
    let { data } = await axios.get(
      `https://api.paystack.co/transaction/verify/${transactionReference}`,
      {
        headers: {
          Authorization: "Bearer " + paystackSecretKey,
        },
      }
    );

    if (!(data.status === true && data.data.status === "success")) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid paystack transaction"
      );
    }

    const result = await onTicketPaymentSuccess(userId, paymentBody);
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const handleStripeTicketPayment = async (payer, paymentBody) => {
  const { amount, token } = paymentBody;
  const { uid: userId, email } = payer;

  try {
    const customer = await stripe.customers.create({
      email: email,
      source: token.id,
      name: token.card.name,
    });
    const charge = await stripe.charges.create({
      amount: parseFloat(amount) * 100,
      description: `Payment for USD ${amount}`,
      currency: "USD",
      customer: customer.id,
    });

    paymentBody.transactionReference = charge.id;
    delete paymentBody["token"];

    const result = await onTicketPaymentSuccess(userId, paymentBody);
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getUserPaymentsForEvent = async (userId, eventId) => {
  const snapshot = await admin
    .firestore()
    .collection("payments")
    .where("userId", "==", userId)
    .where("eventId", "==", eventId)
    .get();
  const payments = snapshot.docs.map((doc) => doc.data());
  return payments;
};

const updatePaymentExtraData = async (paymentId, extraData) => {
  const payment = await getPaymentById(paymentId);
  extraData = { ...payment.extraData, ...extraData };
  await admin
    .firestore()
    .collection("payments")
    .doc(paymentId)
    .update({ extraData });
};

module.exports = {
  handlePaystackTicketPayment,
  handleStripeTicketPayment,
  getUserPaymentsForEvent,
  getPaymentById,
  updatePaymentExtraData,
};
