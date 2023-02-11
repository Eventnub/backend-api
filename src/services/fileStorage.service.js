const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} = require("firebase/storage");
const { admin } = require("./firebase.service");

const uploadFile = async (file, filename) => {
  const storage = getStorage();
  const storageRef = ref(storage, filename);
  const snapshot = await uploadBytes(storageRef, file.buffer);
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
};

const deleteFile = async (filename) => {
  const storage = getStorage();
  const desertRef = ref(storage, filename);
  await deleteObject(desertRef);
};

module.exports = {
  uploadFile,
  deleteFile,
};
