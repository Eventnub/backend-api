const axios = require("axios");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin, generateFirebaseId } = require("./firebase.service");
const { uploadFile, deleteFile } = require("./fileStorage.service");
const { generateCode } = require("../utils/generator");
const { sendReviewerVerificationCode } = require("./email.service");
const { getUserById, updateUserById } = require("./user.service");

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

const getVerificationCodeById = async (uid) => {
  const verificationCode = await admin
    .firestore()
    .collection("verificationCodes")
    .doc(uid)
    .get();
  return verificationCode.data();
};

const sendEmailVerificationCode = async (requester) => {
  try {
    if (requester.role === "admin") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Admin already has review privilege"
      );
    } else if (requester.role === "host") {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Host cannot be a reviewer");
    }

    const code = generateCode();
    const currentTime = Date.now();

    sendReviewerVerificationCode({
      userEmail: requester.email,
      code,
    });

    const uid = generateFirebaseId("verificationCodes");
    const verificationCode = {
      uid,
      userId: requester.uid,
      code: parseInt(code, 10),
      type: "Reviewer Signup",
      isVerified: false,
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

  await admin
    .firestore()
    .collection("verificationCodes")
    .doc(verificationCode.uid)
    .update({ isVerified: true });

  verificationCode.isVerified = true;
  return verificationCode;
};

const submitIdDocument = async (
  frontImageFile,
  backImageFile,
  verificationCodeId,
  submitter
) => {
  const verificationCode = await getVerificationCodeById(verificationCodeId);
  if (!verificationCode) {
    throw new ApiError(httpStatus.NOT_FOUND, "Verification code not found");
  }

  if (verificationCode.userId !== submitter.uid) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Invalid verification detected"
    );
  }

  const user = await getUserById(submitter.uid);
  if (user?.idDocument?.frontImageUrl) {
    await deleteFile(user.idDocument.frontImageUrl);
  }
  if (user?.idDocument?.backImageUrl) {
    await deleteFile(user.idDocument.backImageUrl);
  }

  const frontImageFilename = `idDocuments/${submitter.uid}-front.jpg`;
  const frontImageUrl = await uploadFile(frontImageFile, frontImageFilename);

  const backImageFilename = `idDocuments/${submitter.uid}-back.jpg`;
  const backImageUrl = await uploadFile(backImageFile, backImageFilename);

  const updateBody = {
    idDocument: {
      frontImageUrl,
      backImageUrl,
    },
    role: "reviewer",
    becameReviewerAt: Date.now(),
  };

  await admin.auth().setCustomUserClaims(submitter.uid, { role: "reviewer" });
  await updateUserById(submitter.uid, updateBody);
};

module.exports = {
  sendEmailVerificationCode,
  verifyCode,
  submitIdDocument,
};
