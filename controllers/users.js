const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require('../middleware/async');
const Users = require("../models/Users");


// @des     Get all users 
//@route    GET /api/v1/auth/users
//@access   Private/admin

exports.getUsers = asyncHandler(async (req, res, next) => {
    res.status(200).json(res.advanceResults);
})

//@des      Get single users 
//@route    GET /api/v1/users:/id
//@access   Private/admin

exports.getUser = asyncHandler(async (req, res, next) => {
    const user = await Users.findById(req.params.id);

    res.status(200).json({
        sucess: true, 
        data: user
    })
});

//@des      Create user 
//@route    POST /api/v1/users
//@access   Private/admin

exports.createUser = asyncHandler(async (req, res, next) => {
    const user = await Users.create(req.body);

    res.status(200).json({
        sucess: true, 
        data: user
    })
});

//@des      Update user 
//@route    PUT /api/v1/users:/id
//@access   Private/admin

exports.updateUser = asyncHandler(async (req, res, next) => {
    const user = await Users.findByIdAndUpdate(req.params.id, req.body, {
        new: true, 
        runValidators: false
    });

    res.status(201).json({
        sucess: true, 
        data: user
    })
});

//@des      Delete user
//@route    GET /api/v1/users/:id
//@access   Private/admin

exports.deleteUser = asyncHandler(async (req, res, next) => {
    const user = await Users.findByIdAndDelete(req.params.id);

    res.status(200).json({
        sucess: true, 
        data: user
    })
});