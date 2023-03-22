const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { getEvents } = require("./event.service");
const { admin, generateFirebaseId } = require("./firebase.service");

const filterEventFields = (event) => {
  let {
    name,
    description,
    type,
    host,
    venue,
    state,
    country,
    date,
    time,
    artists,
  } = event;

  return {
    name,
    description,
    type,
    host,
    venue,
    state,
    country,
    date,
    time,
    artists,
  };
};

const filterTicketFields = (ticket) => {
  const { type, price, description } = ticket;
  return { type, price, description };
};

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

const getUserAcquiredTicketsByUserId = async (userId, requester) => {
  if (!["admin"].includes(requester.role) && requester.uid !== userId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You can't view other users' tickets"
    );
  }

  const events = await getEvents();

  const snapshot = await admin
    .firestore()
    .collection("acquiredTickets")
    .where("userId", "==", userId)
    .get();
  let tickets = snapshot.docs.map((doc) => doc.data());

  tickets = tickets.map((ticket) => {
    const [event] = events.filter((ev) => ev.uid === ticket.eventId);
    if (event && event.tickets && ticket.ticketIndex < event.tickets.length) {
      let eventFields = filterEventFields(event);
      ticket.event = { ...eventFields };

      const ticketFields = filterTicketFields(
        event.tickets[ticket.ticketIndex]
      );
      ticket.ticket = { ...ticketFields };
    }

    delete ticket["ticketIndex"];
    delete ticket["eventId"];

    return ticket;
  });

  return tickets;
};

module.exports = {
  saveAcquiredTicket,
  getUserAcquiredTicketsByUserId,
};
