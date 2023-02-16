const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, generateFirebaseId } = require("./firebase.service");
const { uploadFile, deleteFile } = require("./fileStorage.service");

const createEvent = async (photoFile, eventBody) => {
  const uid = generateFirebaseId("events");
  const filename = `eventsPhotos/${uid}.jpg`;
  const photoUrl = await uploadFile(photoFile, filename);
  eventBody.uid = uid;
  eventBody.photoUrl = photoUrl;
  eventBody.createdAt = Date.now();

  // Add extra index field to each ticket
  eventBody.tickets = eventBody.tickets.map((ticket, index) => ({
    index,
    ...ticket,
  }));

  await admin
    .firestore()
    .collection("events")
    .doc(uid)
    .set({ ...eventBody });

  return { ...eventBody };
};

const getEvents = async () => {
  const snapshot = await admin.firestore().collection("events").get();
  const events = snapshot.docs.map((doc) => doc.data());
  return events;
};

const getEventById = async (uid) => {
  const event = await admin.firestore().collection("events").doc(uid).get();
  return event.data();
};

const updateEventById = async (uid, updatePhotoFile, updateBody) => {
  const event = await getEventById(uid);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event with uid not found");
  }

  if (updatePhotoFile) {
    await deleteFile(event.photoUrl);
    const filename = `eventsPhotos/${uid}.jpg`;
    const photoUrl = await uploadFile(updatePhotoFile, filename);
    updateBody.photoUrl = photoUrl;
  }

  if (updateBody.tickets) {
    updateBody.tickets = updateBody.tickets.map((ticket, index) => ({
      index,
      ...ticket,
    }));
  }

  updateBody.updatedAt = Date.now();

  await admin
    .firestore()
    .collection("events")
    .doc(uid)
    .update({ ...updateBody });
  return updateBody;
};

const deleteEventById = async (uid) => {
  const event = await getEventById(uid);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event with uid not found");
  }

  await deleteFile(event.photoUrl);
  await admin.firestore().collection("events").doc(uid).delete();
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEventById,
  deleteEventById,
};
