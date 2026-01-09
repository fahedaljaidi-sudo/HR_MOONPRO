/**
 * Middleware to check if the user has specific roles
 * Assumes req.user is already populated by tenantMiddleware
 */

const requireAdmin = (req, res, next) => {
    // Check if user object exists (populated by tenantMiddleware)
    if (!req.user || !req.user.role) {
        return res.status(403).json({ message: 'Access denied. Role information missing.' });
    }

    const { role } = req.user;

    // Allow 'Admin' or 'Manager' (adjust based on your roles)
    // Note: In a real system, you might check permissions array instead of role names
    const allowedRoles = ['admin', 'manager', 'owner']; // Normalized to lowercase

    if (allowedRoles.includes(role.toLowerCase())) {
        next();
    } else {
        return res.status(403).json({ message: `Access denied. Requires one of: ${allowedRoles.join(', ')}` });
    }
};

module.exports = { requireAdmin };
