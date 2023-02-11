const admin = require("firebase-admin");
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
const { firebaseConfig, serviceAccount } = require("../config/config");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

firebase.initializeApp(firebaseConfig);

const generateFirebaseId = (name) => {
  return admin.firestore().collection(name).doc().id.toString();
};

module.exports = {
  admin,
  firebase,
  generateFirebaseId,
};
