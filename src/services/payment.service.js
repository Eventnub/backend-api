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

    await onTicketPaymentSuccess(userId, paymentBody);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const handleStripeTicketPayment = async (payer, paymentBody) => {
  const payment = await getPaymentByUserIdAndEventId(
    payer.uid,
    paymentBody.eventId
  );
  if (payment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You've already made payment for this event"
    );
  }

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

    await onTicketPaymentSuccess(userId, paymentBody);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getUserPaymentForEvent = async (userId, eventId) => {
  const payment = await getPaymentByUserIdAndEventId(userId, eventId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "No payment found");
  }
  delete payment["transactionReference"];
  return payment;
};

module.exports = {
  handlePaystackTicketPayment,
  handleStripeTicketPayment,
  getPaymentByUserIdAndEventId,
  getUserPaymentForEvent,
};
