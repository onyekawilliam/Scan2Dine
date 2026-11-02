const jwt = require("jsonwebtoken");
const Restaurant = require("../Models/restaurantmodel");
const { fail, isObjectId } = require("../utils/http");

const JWT_OPTIONS = { algorithms: ["HS256"] };
const secret = () => process.env.JWT_SECRET || "fallback_secret";

const signToken = (id) => jwt.sign({ id }, secret(), { expiresIn: "7d" });

// Verifies the bearer token AND that the account still exists and is active,
// so a deleted or disabled restaurant cannot keep using an old token.
const protect = async (req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return fail(res, 401, "UNAUTHORIZED", "Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(header.slice(7), secret(), JWT_OPTIONS);
    if (!isObjectId(String(decoded.id))) throw new Error("bad token payload");

    const active = await Restaurant.exists({ _id: decoded.id, is_active: true });
    if (!active) throw new Error("account missing or disabled");

    req.restaurant = { id: String(decoded.id) };
    return next();
  } catch (error) {
    return fail(res, 401, "UNAUTHORIZED", "Not authorized, token failed");
  }
};

// Used by the Socket.IO handshake. Returns the restaurant id or null.
const verifySocketToken = async (token) => {
  try {
    const decoded = jwt.verify(String(token || ""), secret(), JWT_OPTIONS);
    if (!isObjectId(String(decoded.id))) return null;
    const active = await Restaurant.exists({ _id: decoded.id, is_active: true });
    return active ? String(decoded.id) : null;
  } catch {
    return null;
  }
};

module.exports = { protect, signToken, verifySocketToken };
