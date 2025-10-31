import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    const headerAuth = req.headers.authorization || req.headers.Authorization || "";
    if (headerAuth && typeof headerAuth === "string" && !/^Bearer\s+/i.test(headerAuth)) {
      console.warn("[adminAuth] Authorization header missing Bearer prefix");
    }

    let token = headerAuth;
    if (typeof token === "string") {
      token = token.replace(/^Bearer\s+/i, "").trim();
    }

    if (!token && req.headers.token) {
      token = String(req.headers.token).trim();
    }

    if (!token && req.cookies) {
      token = String(req.cookies.token || req.cookies.jwt || req.cookies.auth || "").trim(); 
    }

    if (!token) {
      console.error("[adminAuth] No token provided");
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      const reason =
        error.name === "TokenExpiredError"
          ? "token expired"
          : error.name === "JsonWebTokenError"
          ? "invalid signature/secret"
          : error.message;
      console.error(`[adminAuth] JWT verification failed: ${reason}`);
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const role = decoded?.role || (decoded?.admin ? "admin" : undefined);
    if (role !== "admin") {
      console.error("[adminAuth] Token payload missing admin role");
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.user = {
      ...decoded,
      role: "admin",
    };
    req.userRole = "admin";
    req.isAdmin = true;

    next();
  } catch (error) {
    console.error("[adminAuth] Unexpected error:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export default adminAuth;
