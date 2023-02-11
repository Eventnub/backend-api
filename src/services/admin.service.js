const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, firebase } = require("./firebase.service");

/*
 This method has no endpoint URL. 
 It was created to enable adding of admins programmatically
*/
const createAdmin = async (adminBody) => {
  const user = await admin.auth().createUser({
    email: adminBody.email,
    password: adminBody.password,
  });
  await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });

  adminBody.uid = user.uid;
  delete adminBody["password"];

  await admin
    .firestore()
    .collection("admins")
    .doc(user.uid)
    .set({ ...adminBody });

  return { ...adminBody };
};

const login = async (email, password) => {
  await firebase.auth().signInWithEmailAndPassword(email, password);
  const idToken = await firebase.auth().currentUser.getIdToken();
  const user = await admin.auth().verifyIdToken(idToken);
  await firebase.auth().signOut();
  if (user.role !== "admin") {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Not an admin");
  }
  return { idToken };
};

module.exports = {
  createAdmin,
  login,
};
