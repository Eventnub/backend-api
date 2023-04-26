const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, firebase } = require("./firebase.service");
const { createUser } = require("./user.service");
const emailService = require("./email.service");

const register = (userBody) => {
  return createUser(userBody);
};

const login = async (email, password) => {
  await firebase.auth().signInWithEmailAndPassword(email, password);
  const idToken = await firebase.auth().currentUser.getIdToken();
  await firebase.auth().signOut();
  return { idToken };
};

const sendPasswordResetEmail = async (email) => {
  try {
    await admin.auth().getUserByEmail(email);
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: "https://eventnub.netlify.app/auth/login",
      handleCodeInApp: true,
    });
    await emailService.sendPasswordResetLink(email, resetLink);
  } catch (error) {
    throw new ApiError(httpStatus.NOT_FOUND, "User with email not found");
  }
};

module.exports = {
  register,
  login,
  sendPasswordResetEmail,
};
