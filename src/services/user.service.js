const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, firebase } = require("./firebase.service");
const { uploadFile, deleteFile } = require("./fileStorage.service");

const createUser = async (userBody) => {
  try {
    const user = await admin.auth().createUser({
      email: userBody.email,
      password: userBody.password,
    });

    await admin.auth().setCustomUserClaims(user.uid, { role: "user" });
    const token = await admin.auth().createCustomToken(user.uid);
    const result = await firebase.auth().signInWithCustomToken(token);
    await result.user.sendEmailVerification();
    await firebase.auth().signOut();

    userBody.uid = user.uid;
    userBody.role = "user";
    userBody.createdAt = Date.now();
    userBody.disabled = false;
    delete userBody["password"];

    await admin
      .firestore()
      .collection("users")
      .doc(user.uid)
      .set({ ...userBody });

    return { ...userBody };
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getUsers = async () => {
  try {
    const snapshot = await admin.firestore().collection("users").get();
    const users = snapshot.docs.map((doc) => doc.data());
    return users;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getUserById = async (uid) => {
  try {
    const user = await admin.firestore().collection("users").doc(uid).get();
    return user.data();
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const getUserByEmail = async (email) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("users")
      .where("email", "==", email)
      .get();
    const user = snapshot.empty ? null : snapshot.docs[0].data();
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const updateUserById = async (uid, updateBody) => {
  try {
    updateBody.updatedAt = Date.now();
    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .update({ ...updateBody });
    return updateBody;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const deleteUserById = async (uid) => {
  try {
    await admin.auth().deleteUser(uid);
    await admin.firestore().collection("users").doc(uid).delete();
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const uploadUserProfilePhoto = async (uid, photoFile) => {
  try {
    if (!photoFile) {
      throw new ApiError(httpStatus.NOT_FOUND, "No profile photo was provided");
    }

    const user = await getUserById(uid);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User with uid not found");
    }

    if (user.photoUrl) {
      await deleteFile(user.photoUrl);
    }

    const filename = `usersPhotos/${uid}.jpg`;
    const photoUrl = await uploadFile(photoFile, filename);
    const updateBody = {
      photoUrl: photoUrl,
      updatedAt: Date.now(),
    };

    await admin
      .firestore()
      .collection("users")
      .doc(uid)
      .update({ ...updateBody });
    return updateBody;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const saveUserSearchQuery = async (uid, searchQuery) => {
  try {
    const user = await getUserById(uid);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User with uid not found");
    }

    let newSearchQueries = [];
    if (user.searchQueries && Array.isArray(user.searchQueries)) {
      newSearchQueries = [...user.searchQueries, searchQuery];
    } else {
      newSearchQueries = [searchQuery];
    }

    // Remove duplicate search queries
    newSearchQueries = [...new Set(newSearchQueries)];

    await admin.firestore().collection("users").doc(uid).update({
      searchQueries: newSearchQueries,
    });
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const changeUserToHost = async (uid, updateBody) => {
  try {
    const user = await getUserById(uid);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, "User with uid not found");
    }

    await admin.auth().setCustomUserClaims(uid, { role: "host" });

    updateBody.role = "host";
    updateBody.becameHostAt = Date.now();

    await admin.firestore().collection("users").doc(uid).update(updateBody);
    return updateBody;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  uploadUserProfilePhoto,
  saveUserSearchQuery,
  changeUserToHost,
};
