import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import miniStoreModel from "../models/miniStoreModel.js";

/**
 * Middleware: Check if user is Main Admin
 */
export const isAdmin = async (req, res, next) => {
    try {
        let token = req.headers?.authorization || req.headers?.token;
        
        if (!token && req.cookies) {
            token = req.cookies.token || req.cookies.jwt || req.cookies.auth;
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Not Authorized - Admin access required" 
            });
        }

        // Remove Bearer prefix and quotes
        token = String(token).trim().replace(/^Bearer\s+/i, "").replace(/^['"]|['"]$/g, "");

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid or expired token" 
            });
        }

        // Check if admin
        const role = decoded?.role || (decoded?.admin ? "admin" : undefined);
        if (role !== "admin") {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden - Admin access required" 
            });
        }

        req.user = {
            ...decoded,
            role: "admin",
            isAdmin: true
        };
        req.isAdmin = true;

        next();
    } catch (error) {
        console.error("[isAdmin middleware error]:", error);
        return res.status(401).json({ 
            success: false, 
            message: "Authentication failed" 
        });
    }
};

/**
 * Middleware: Check if user is Sub-Admin
 */
export const isSubAdmin = async (req, res, next) => {
    try {
        let token = req.headers?.authorization || req.headers?.token;
        
        if (!token && req.cookies) {
            token = req.cookies.token || req.cookies.jwt || req.cookies.auth;
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Not Authorized - Sub-admin access required" 
            });
        }

        // Remove Bearer prefix and quotes
        token = String(token).trim().replace(/^Bearer\s+/i, "").replace(/^['"]|['"]$/g, "");

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[isSubAdmin] Token decoded:', decoded);
        } catch (e) {
            console.error('[isSubAdmin] Token verify failed:', e);
            return res.status(401).json({ 
                success: false, 
                message: "Invalid or expired token" 
            });
        }

        // Check if subadmin
        if (decoded?.role !== "subadmin") {
            console.error('[isSubAdmin] Forbidden - decoded role is not subadmin', { role: decoded?.role });
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden - Sub-admin access required" 
            });
        }

        // Fetch user from DB to get miniStoreId
        const user = await userModel.findById(decoded.id).select('-password');
        console.log('[isSubAdmin] User fetched from DB:', user ? { id: user._id, email: user.email, role: user.role, miniStoreId: user.miniStoreId } : null);
        
        if (!user) {
            console.error('[isSubAdmin] User record not found for decoded id:', decoded.id);
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        if (!user.miniStoreId) {
            console.error('[isSubAdmin] ERROR: User has no miniStoreId assigned!', { userId: user._id });
            return res.status(403).json({ 
                success: false, 
                message: "No mini store assigned to this sub-admin" 
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: "subadmin",
            miniStoreId: user.miniStoreId,
            isSubAdmin: true
        };

        console.log('[isSubAdmin] req.user set:', req.user);
        next();
    } catch (error) {
        console.error("[isSubAdmin middleware error]:", error);
        return res.status(401).json({ 
            success: false, 
            message: "Authentication failed" 
        });
    }
};

/**
 * Middleware: Check if user is Admin OR Sub-Admin
 */
export const isAdminOrSubAdmin = async (req, res, next) => {
    try {
        let token = req.headers?.authorization || req.headers?.token;
        
        if (!token && req.cookies) {
            token = req.cookies.token || req.cookies.jwt || req.cookies.auth;
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Not Authorized" 
            });
        }

        // Remove Bearer prefix and quotes
        token = String(token).trim().replace(/^Bearer\s+/i, "").replace(/^['"]|['"]$/g, "");

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid or expired token" 
            });
        }

        const role = decoded?.role || (decoded?.admin ? "admin" : undefined);
        
        if (role !== "admin" && role !== "subadmin") {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden - Admin or Sub-admin access required" 
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: role,
            isAdmin: role === "admin",
            isSubAdmin: role === "subadmin"
        };

        next();
    } catch (error) {
        console.error("[isAdminOrSubAdmin middleware error]:", error);
        return res.status(401).json({ 
            success: false, 
            message: "Authentication failed" 
        });
    }
};

/**
 * Middleware: Verify store ownership for sub-admin
 * Use this AFTER isSubAdmin middleware
 */
export const verifyStoreOwnership = async (req, res, next) => {
    try {
        const storeId = req.params.id || req.params.storeId;
        
        if (!storeId) {
            return res.status(400).json({ 
                success: false, 
                message: "Store ID required" 
            });
        }

        // If admin, allow access
        if (req.user?.isAdmin) {
            return next();
        }

        // If subadmin, verify ownership
        if (req.user?.isSubAdmin && req.user?.miniStoreId) {
            if (req.user.miniStoreId.toString() !== storeId) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Access denied - You can only manage your own store" 
                });
            }
            return next();
        }

        return res.status(403).json({ 
            success: false, 
            message: "Access denied" 
        });
    } catch (error) {
        console.error("[verifyStoreOwnership error]:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Server error" 
        });
    }
};