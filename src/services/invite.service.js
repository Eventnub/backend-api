const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { getUserByEmail } = require("./user.service");
const { admin, generateFirebaseId } = require("./firebase.service");

const createInvite = async (inviter, inviteBody) => {
  try {
    const user = await getUserByEmail(inviteBody.email);

    if (user) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Can't invite existing user as ${inviteBody.role}`
      );
    }

    const invite = await getInviteByEmail(inviteBody.email);

    if (invite) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `The email has already been invited as ${invite.role}`
      );
    }

    //TODO: Send invitation email

    const uid = generateFirebaseId("invites");
    inviteBody.uid = uid;
    inviteBody.createdAt = Date.now();
    inviteBody.inviter = inviter;
    inviteBody.status = "pending";

    await admin
      .firestore()
      .collection("invites")
      .doc(uid)
      .set({ ...inviteBody });

    return { ...inviteBody };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getInvites = async () => {
  try {
    const snapshot = await admin.firestore().collection("invites").get();
    const invites = snapshot.docs.map((doc) => doc.data());
    return invites;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getInviteById = async (uid) => {
  try {
    const invite = await admin.firestore().collection("invites").doc(uid).get();
    return invite.data();
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getInviteByEmail = async (email) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("invites")
      .where("email", "==", email)
      .get();
    const invite = snapshot.empty ? null : snapshot.docs.at(0).data();
    return invite;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const updateInviteById = async (uid, updateBody) => {
  try {
    await admin
      .firestore()
      .collection("invites")
      .doc(uid)
      .update({ ...updateBody });
    return updateBody;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const deleteInviteById = async (uid) => {
  try {
    await admin.firestore().collection("invites").doc(uid).delete();
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  createInvite,
  getInvites,
  getInviteById,
  getInviteByEmail,
  updateInviteById,
  deleteInviteById,
};
