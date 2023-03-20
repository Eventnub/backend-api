const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { getUserById } = require("./user.service");
const { admin, generateFirebaseId } = require("./firebase.service");
const { uploadFile, deleteFile } = require("./fileStorage.service");

const createEvent = async (creator, photoFile, eventBody) => {
  const uid = generateFirebaseId("events");
  const filename = `eventsPhotos/${uid}.jpg`;
  const photoUrl = await uploadFile(photoFile, filename);
  eventBody.uid = uid;
  eventBody.photoUrl = photoUrl;
  eventBody.createdAt = Date.now();
  eventBody.creatorId = creator.uid;

  if (creator.role === "admin") {
    eventBody.isApproved = true;
  } else {
    eventBody.isApproved = false;
  }

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
  const snapshot = await admin
    .firestore()
    .collection("events")
    .where("isApproved", "==", true)
    .get();
  const events = snapshot.docs.map((doc) => doc.data());
  return events;
};

const getEventById = async (uid) => {
  const event = await admin.firestore().collection("events").doc(uid).get();
  return event.data();
};

const updateEventById = async (updater, uid, updatePhotoFile, updateBody) => {
  const event = await getEventById(uid);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event with uid not found");
  }

  if (!["admin"].includes(updater.role) && event.creatorId !== updater.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't update events they didn't create"
    );
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

const deleteEventById = async (deleter, uid) => {
  const event = await getEventById(uid);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event with uid not found");
  }

  if (!["admin"].includes(deleter.role) && event.creatorId !== deleter.uid) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Hosts can't delete events they didn't create"
    );
  }

  await deleteFile(event.photoUrl);
  await admin.firestore().collection("events").doc(uid).delete();
};

const likeOrUnlikeEventById = async (eventId, userId, action) => {
  const event = await getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event with uid not found");
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  event.likers = event.likers ? event.likers : [];
  user.likedEvents = user.likedEvents ? user.likedEvents : [];

  const { arrayUnion, arrayRemove } = admin.firestore.FieldValue;

  if (action === "like") {
    if (!event.likers.includes(userId)) {
      await admin
        .firestore()
        .collection("events")
        .doc(eventId)
        .update({ likers: arrayUnion(userId) });
    }

    if (!user.likedEvents.includes(eventId)) {
      await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .update({ likedEvents: arrayUnion(eventId) });
    }
  }

  if (action === "unlike") {
    if (event.likers.includes(userId)) {
      await admin
        .firestore()
        .collection("events")
        .doc(eventId)
        .update({ likers: arrayRemove(userId) });
    }

    if (user.likedEvents.includes(eventId)) {
      await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .update({ likedEvents: arrayRemove(eventId) });
    }
  }
};

const approveEventById = async (approverId, eventId) => {
  const event = await getEventById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, "Event with uid not found");
  }

  if (event.isApproved) {
    throw new ApiError(httpStatus.BAD_REQUEST, "The event is already approved");
  }

  const approveBody = {
    isApproved: true,
    approvedAt: Date.now(),
    approverId: approverId,
  };

  await admin.firestore().collection("events").doc(eventId).update(approveBody);
  return approveBody;
};

const getCreatorEventsByCreatorId = async (creatorId, requester) => {
  const snapshot = await admin
    .firestore()
    .collection("events")
    .where("creatorId", "==", creatorId)
    .get();

  let events = snapshot.docs.map((doc) => doc.data());

  if (
    !["admin", "host"].includes(requester.role) ||
    (["host"].includes(requester.role) && requester.uid !== creatorId)
  ) {
    events = events.filter((event) => event.isApproved === true);
  }

  return events;
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEventById,
  deleteEventById,
  likeOrUnlikeEventById,
  approveEventById,
  getCreatorEventsByCreatorId,
};
