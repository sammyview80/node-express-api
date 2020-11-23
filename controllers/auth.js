const crypto = require('crypto');

const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require('../middleware/async');
const Course = require('../models/Course');
const Bootcamp = require("../models/Bootcamp");
const Users = require("../models/Users");
const sendEmail = require("../utils/sendEmail");


// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  Public

exports.register = asyncHandler(async (req, res, next) => {
    const {name, email, password, role} = req.body;

    // Create user
    const user = await Users.create({
        name, 
        email, 
        password,
        role
    });

    sendTokenResponse(user, 200, res);

});

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public

exports.login = asyncHandler(async (req, res, next) => {
    const {email, password} = req.body;

    // Validate email and password
    if(!email || !password){
        return next(
            new ErrorResponse('Please provide an email and password.', 400)
        )
    }

    // Check for user
    const user = await Users.findOne({email}).select('+password'); //select for password because we don't sent password default or password is unselectd 

    if(!user) {
        return next(
            new ErrorResponse('Invalid credentials', 401)
        )
    }

    // Compare password 
    const isMatched = await user.matchPassword(password);

    if(!isMatched) {
        return next(
            new ErrorResponse('Invalid credentials', 401)
        )
    }
    sendTokenResponse(user, 200, res);

});


// @desc    Get current User
// @route   POST /api/v1/auth/me
// @access  Private

exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await Users.findById(req.user.id);
    
    res.status(200).json({
        sucess: true,
        data: user
    })
});


// @desc    Forget password
// @route   POST /api/v1/auth/forgetpassword
// @access  PUblic

exports.forgetPassword = asyncHandler(async (req, res, next) => {
    const user = await Users.findOne({email: req.body.email});

    if (!user) {
        return next(
            new ErrorResponse(`There is no user with email ${req.body.email}`, 404)
        );
    }

    // Geting the resettoken 
    const resetToken = user.getResetPasswordToken();

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `Click here to reset password: ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message
        })

        res.status(200).json({sucess: true, data: 'Email sent.'})
    } catch (err) {
        console.log(err)
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({validateBeforeSave: false});

        return next(
            new ErrorResponse('Email sending failed.', 500)
        )
    }

    await user.save({ validateBeforeSave: false});

    res.status(200).json({
        sucess: true,
        data: user
    })
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public

exports.resetPassword = asyncHandler(async (req, res, next) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await Users.findOne({
        resetPasswordToken: resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now()}
    });
    if(!user) {
        return next(
            new ErrorResponse('Invalid token', 400)
        )
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({validateBeforeSave: false});

    sendTokenResponse(user, 200, res);
});



// Get token from model, create cookiew and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }

    if(process.env.NODE_ENV === 'production'){
        options.secure = true
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            sucess: true,
            token
        })
};


// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private

exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    }
    
    const user = await Users.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true, 
        runValidators: true
    });
    
    res.status(200).json({
        sucess: true,
        data: user
    })
});


// @desc    Update user password
// @route   POST /api/v1/auth/updatepassword
// @access  Private

exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await Users.findById(req.user.id).select('+password');
    const isMatched = await user.matchPassword(req.body.currentPassword);

    if(!isMatched){
        return next(
            new ErrorResponse('Current Password wonnot matched.', 401)
        )
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
    
    res.status(200).json({
        sucess: true,
        data: user
    })
});