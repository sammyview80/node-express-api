const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const Users = require('../models/Users');
const colors = require('colors');


// Protect routes 
exports.protect = asyncHandler( async (req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        // Token from bearer authorization header
        token = req.headers.authorization.split(' ')[1];
    }else if (req.cookies.token){
        // Token from cookie
        console.log('cookie from token')
        token = req.cookies.token;
    }

    // Make sure token exist
    if(!token){
        return next(
            new ErrorResponse('Assess Denied.', 401)        
            )
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await Users.findById(decoded.id);
        next()
    } catch (err) {
        return next(
            new ErrorResponse('Assess Denied.', 401) 
        )   
    }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(`${req.user.role} role is unauthorized.`, 403)
            )
        }
        next();
    }
}