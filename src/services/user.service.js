const { admin, firebase } = require("./firebase.service");

const createUser = async (userBody) => {
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
  userBody.createdAt = Date.now();
  userBody.disabled = false;
  delete userBody["password"];

  await admin
    .firestore()
    .collection("users")
    .doc(user.uid)
    .set({ ...userBody });

  return { ...userBody };
};

const getUsers = async () => {
  const snapshot = await admin.firestore().collection("users").get();
  const users = snapshot.docs.map((doc) => doc.data());
  return users;
};

const getUserById = async (uid) => {
  const user = await admin.firestore().collection("users").doc(uid).get();
  return user.data();
};

const getUserByEmail = async (email) => {
  const snapshot = await admin
    .firestore()
    .collection("users")
    .where("email", "==", email)
    .get();
  const user = snapshot.empty ? null : snapshot.docs[0].data();
  return user;
};

const updateUserById = async (uid, updateBody) => {
  await admin
    .firestore()
    .collection("users")
    .doc(uid)
    .update({ ...updateBody });
  return updateBody;
};

const deleteUserById = async (uid) => {
  await admin.auth().deleteUser(uid);
  await admin.firestore().collection("users").doc(uid).delete();
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};
