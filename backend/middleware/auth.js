const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');
    console.log('Auth Middleware - Headers:', req.headers);  // Logga alla headers
    console.log('Auth Middleware - Token:', token);  // Logga token

    // Check if no token
    if (!token) {
        console.log('Auth Middleware - No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth Middleware - Decoded token:', decoded);  // Logga decoded token

        // Set user data from token
        req.user = decoded;
        console.log('Auth Middleware - User set:', req.user);  // Logga user data

        next();
    } catch (err) {
        console.error('Auth Middleware - Token verification error:', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
}; 