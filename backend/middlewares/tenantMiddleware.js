const jwt = require('jsonwebtoken');

/**
 * Tenant Middleware
 * 
 * 1. Checks for a valid JWT in the Authorization header.
 * 2. Decodes the token to get `tenant_id` and `user_id`.
 * 3. Attaches these IDs to the `req` object for downstream controllers.
 * 
 * If no token is found, or it's invalid, it blocks the request (401/403).
 * NOTE: Some public routes (like login/register) should exclude this middleware.
 */
const tenantMiddleware = (req, res, next) => {
    // Allow public routes (logic can be handled in server.js or per-route)

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // THE CORE ISOLATION LOGIC
        req.user = {
            id: decoded.id,
            tenant_id: decoded.tenant_id,
            role: decoded.role // Optional, if we store role in token
        };

        console.log(`[Request] User: ${req.user.id}, Tenant: ${req.user.tenant_id}`);
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

module.exports = tenantMiddleware;
