const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { admin } = require("../services/firebase.service");

const getAuthToken = (req, res, next) => {
  const { authorization } = req.headers;

  if (authorization && authorization.split(" ")[0] === "Bearer") {
    req.authToken = authorization.split(" ")[1];
  } else {
    req.authToken = null;
  }
  next();
};

const Authentication = (req, res, next) => {
  getAuthToken(req, res, async () => {
    try {
      const { authToken } = req;
      const user = await admin.auth().verifyIdToken(authToken);
      req.user = {
        ...req.user,
        uid: user.uid,
        role: user.role,
        email: user.email,
      };
      return next();
    } catch (e) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized"));
    }
  });
};

const Authorization = (roles) => {
  return (req, res, next) => {
    const { role } = req.user;

    if (!roles.includes(role)) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized"));
    }

    return next();
  };
};

module.exports = {
  Authentication,
  Authorization,
};
