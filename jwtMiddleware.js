const jwt = require('jsonwebtoken');
const errorCodes = require('./errorCodes');
require('dotenv').config();

// Secret key for JWT

// JWT Verification Middleware
const verifyJWT = (req, res, next) => {
    const token = req.headers['authorization'];

    // Log the received token for debugging purposes
    console.log("Received token: ", token);

    // Check if the token is provided
    if (!token) {
        return res.status(errorCodes.UNAUTHORIZED.status).json({ message: errorCodes.UNAUTHORIZED.message });
    }

    // Remove 'Bearer ' from the token string if it is included
    const formattedToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

    // Verify the token
    jwt.verify(formattedToken, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            // Log the error for debugging purposes
            console.error("Token verification error: ", err);
            return res.status(errorCodes.FORBIDDEN.status).json({ message: errorCodes.FORBIDDEN.message });
        }

        // Attach decoded token data (e.g., userId, username) to the request object
        req.user = decoded;

        // Proceed to the next middleware or route handler
        next();
    });
};

module.exports = verifyJWT;
