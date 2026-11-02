const logger = require("./logger");

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const isObjectId = (value) => typeof value === "string" && OBJECT_ID.test(value);

// `message` stays at the top level for older clients; `error` carries the machine-readable code.
const fail = (res, status, code, message, details) =>
  res.status(status).json({
    success: false,
    message,
    error: { code, message, ...(details ? { details } : {}) },
  });

// Log the real error server-side, but never leak internals (stack traces, DB messages) to clients.
const serverError = (res, error) => {
  logger.error(error && error.stack ? error.stack : String(error));
  return fail(res, 500, "SERVER_ERROR", "Something went wrong. Please try again.");
};

const notFound = (res, what = "Resource") => fail(res, 404, "NOT_FOUND", `${what} not found`);

module.exports = { isObjectId, fail, serverError, notFound };
