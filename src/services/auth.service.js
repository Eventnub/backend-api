const { firebase } = require("./firebase.service");
const { createUser } = require("./user.service");

const register = (userBody) => {
  return createUser(userBody);
};

const login = async (email, password) => {
  await firebase.auth().signInWithEmailAndPassword(email, password);
  const idToken = await firebase.auth().currentUser.getIdToken();
  await firebase.auth().signOut();
  return { idToken };
};

const sendPasswordResetEmail = (email) => {
  return firebase.auth().sendPasswordResetEmail(email);
};

module.exports = {
  register,
  login,
  sendPasswordResetEmail,
};
