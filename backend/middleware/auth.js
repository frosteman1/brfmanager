const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        console.log('Auth middleware - headers:', req.headers);
        
        const token = req.header('x-auth-token');
        
        if (!token) {
            console.error('No token provided');
            return res.status(401).json({ message: 'No authentication token, access denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully:', decoded);
            req.user = decoded;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ message: 'Token is not valid' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = auth; 