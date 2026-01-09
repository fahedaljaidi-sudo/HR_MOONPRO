/**
 * Middleware to check fine-grained permissions
 */

const canEditProfile = (req, res, next) => {
    // req.user is populated by tenantMiddleware
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const requesterId = req.user.id;
    // ensure targetId is an integer for comparison
    const targetId = parseInt(req.params.id);
    const userRole = (req.user.role || '').toLowerCase();

    // 1. Allow if Admin/Manager/Owner
    if (['admin', 'manager', 'owner'].includes(userRole)) {
        return next();
    }

    // 2. Allow if editing their own profile
    if (requesterId === targetId) {
        return next();
    }

    // Otherwise, deny
    return res.status(403).json({ message: 'Access denied. You can only edit your own profile.' });
};

const canViewProfile = canEditProfile; // Same logic: Self or Admin

module.exports = { canEditProfile, canViewProfile };
