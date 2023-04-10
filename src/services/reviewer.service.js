const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, generateFirebaseId } = require("./firebase.service");
const { generateCode } = require("../utils/generator");
const {
  sendEmailVerificatonCodeForReviewerSignup,
} = require("./email.service");

const getVerificationCodeByUserId = async (code, userId) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("verificationCodes")
      .where("userId", "==", userId)
      .where("code", "==", code)
      .where("type", "==", "Reviewer Signup")
      .get();
    const verificationCode = snapshot.empty ? null : snapshot.docs[0].data();
    return verificationCode;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const sendEmailVerificationCode = async (requester) => {
  try {
    const code = generateCode();
    const currentTime = Date.now();

    sendEmailVerificatonCodeForReviewerSignup({
      userEmail: requester.email,
      code,
    });

    const uid = generateFirebaseId("verificationCodes");
    const verificationCode = {
      uid,
      userId: requester.uid,
      code,
      type: "Reviewer Signup",
      createdAt: currentTime,
      expiresAt: currentTime + 5 * 60 * 1000,
    };
    await admin
      .firestore()
      .collection("verificationCodes")
      .doc(uid)
      .set(verificationCode);
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message);
  }
};

const verifyCode = async (code, requester) => {
  if (requester.role === "admin") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Admin already has review privilege"
    );
  } else if (requester.role === "host") {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Host cannot be a reviewer");
  }

  const verificationCode = await getVerificationCodeByUserId(
    code,
    requester.uid
  );

  if (!verificationCode) {
    throw new ApiError(httpStatus.NOT_FOUND, "Verification code not found");
  }

  if (verificationCode.expiresAt < Date.now()) {
    throw new ApiError(httpStatus.NOT_FOUND, "Verification code has expired");
  }

  await admin.auth().setCustomUserClaims(requester.uid, { role: "reviewer" });

  updateBody.role = "reviewer";
  updateBody.becameReviewerAt = Date.now();
  await admin
    .firestore()
    .collection("users")
    .doc(requester.uid)
    .update(updateBody);
};

module.exports = {
  sendEmailVerificationCode,
  verifyCode,
};
