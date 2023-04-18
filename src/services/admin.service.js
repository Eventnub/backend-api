const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { getInviteByEmail, updateInviteById } = require("./invite.service");
const { admin, firebase } = require("./firebase.service");

const register = async (adminBody) => {
  try {
    const invite = await getInviteByEmail(adminBody.email);

    if (!invite) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `The email has not being invited`
      );
    }

    if (invite.status !== "pending") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This invite has already been accepted"
      );
    }

    const user = await admin.auth().createUser({
      email: adminBody.email,
      password: adminBody.password,
    });
    await admin.auth().setCustomUserClaims(user.uid, { role: invite.role });

    adminBody.uid = user.uid;
    adminBody.createdAt = Date.now();
    delete adminBody["password"];

    await admin
      .firestore()
      .collection("admins")
      .doc(user.uid)
      .set({ ...adminBody });

    await updateInviteById(invite.uid, { status: "accepted" });

    return { ...adminBody };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const login = async (email, password) => {
  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    const idToken = await firebase.auth().currentUser.getIdToken();
    const user = await admin.auth().verifyIdToken(idToken);
    await firebase.auth().signOut();
    if (user.role !== "admin") {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Not an admin");
    }
    return { idToken };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Admin with credentials not found"
      );
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  }
};

module.exports = {
  register,
  login,
};
