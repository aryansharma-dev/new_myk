import jwt from "jsonwebtoken";

/**
 * Auth middleware for normal users (and admins when present).
 *
 * ✅ Accepts token from:
 *    - headers.authorization: "Bearer <token>"
 *    - headers.token: "<token>"
 *    - cookies: token / jwt / auth   (needs cookie-parser in server.js)
 *
 * ✅ Sets BOTH:
 *    - req.user = { id: "<userId>" }   // controllers read req.user.id
 *    - req.userId = "<userId>"         // legacy/back-compat
 *    - req.isAdmin = true/false        // if admin token
 *
 * ❌ Returns 401 with clear message when missing/invalid.
 */
const authUser = (req, res, next) => {
  try {
    let token =
      req.headers?.authorization ||
      req.headers?.token ||
      (req.cookies ? (req.cookies.token || req.cookies.jwt || req.cookies.auth) : "");

    if (!token) {
      return res.status(401).json({ success: false, message: "Not Authorized (token missing)" });
    }

    // Normalize: if we got "Bearer <token>", strip the prefix; also strip quotes
    token = String(token).trim().replace(/^Bearer\s+/i, "").replace(/^['"]|['"]$/g, "");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    // Admin token payload can be: { admin: true, role: "admin", id?: <userId> }
    if (decoded?.admin || decoded?.role === "admin") {
      req.isAdmin = true;
       req.user = {
        id: decoded.id,
        role: "admin",
        email: decoded.email,
      };
      if (decoded.id) {
        req.userId = decoded.id;
      }
      return next();
    }

    // Normal user token payload: { id: "<userId>" }
    if (decoded?.id) {
      req.isAdmin = false;
      req.user = { id: decoded.id }; // <-- primary (controllers use req.user.id)
      req.userId = decoded.id;       // <-- secondary (back-compat)
      return next();
    }

    return res.status(401).json({ success: false, message: "Invalid token payload" });
  } catch (err) {
    console.error("auth middleware error:", err);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authUser;
