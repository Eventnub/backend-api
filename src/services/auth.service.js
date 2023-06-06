const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, firebase } = require("./firebase.service");
const { createUser, createUserFromProvider } = require("./user.service");
const emailService = require("./email.service");

const register = (userBody) => {
  return createUser(userBody);
};

const registerViaProvider = (provider, crdentials) => {
  return createUserFromProvider(provider, crdentials);
};

const login = async (email, password) => {
  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    const idToken = await firebase.auth().currentUser.getIdToken();
    await firebase.auth().signOut();
    return { idToken };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "User with credentials not found"
      );
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
  }
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

const resendEmailVerificationLink = async (email) => {
  try {
    await admin.auth().getUserByEmail(email);
    const verificationLink = await admin
      .auth()
      .generateEmailVerificationLink(email, {
        url: "https://eventnub.netlify.app/auth/login",
        handleCodeInApp: true,
      });
    await emailService.sendEmailVerificationLink(email, verificationLink);
  } catch (error) {
    throw new ApiError(httpStatus.NOT_FOUND, "User with email not found");
  }
};

module.exports = {
  register,
  registerViaProvider,
  login,
  sendPasswordResetEmail,
  resendEmailVerificationLink,
};
