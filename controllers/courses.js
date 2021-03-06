const ErrorResponse = require("../utils/errorResponse");

// const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Course = require('../models/Course');
const Bootcamp = require("../models/Bootcamp");


// @desc    Get courses
// @route   GET /api/v1/cources
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public

exports.getCourses = asyncHandler(async (req, res, next) => {
    if(req.params.bootcampId){
        const courses = await Course.find({bootcamp: req.params.bootcampId});

        return res.status(200).json({
            sucess: true,
            count: courses.length,
            data: courses
        })
    }else {
        res.status(200).json(res.advanceResults);
    }
});


// @desc    Get single courses
// @route   GET /api/v1/cources/:id
// @access  Public

exports.getCourse = asyncHandler(async (req, res, next) => {
    let query;
    query = Course.findById(req.params.id)
    const course = await query.populate({
        path: 'bootcamp',
        select: 'name description'
    });

    if(!course){
        return next(new ErrorResponse(`No course of id ${req.params.id}`), 404);
    }

    res.status(200).json({
        sucess: true,
        data: course
    })
});

// @desc    Add courses
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// @access  Public

exports.addCourse = asyncHandler(async (req, res, next) => {
    req.body.bootcamp = req.params.bootcampId;
    req.body.user = req.user.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp cannot find of id ${req.params.bootcampId}'`));
    }
    
    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(
            new ErrorResponse(`User id of ${req.user.id} is not authroized to add course to ${bootcamp._id}`, 401)
        );
    }

    const course = await Course.create(req.body);

    res.status(200).json({
        sucess: true,
        data: course
    })
});

// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Public

exports.updateCourse = asyncHandler(async (req, res, next) => {
    let course = await Course.findById(req.params.id);

    if (!course){
        return next(
            new ErrorResponse(`No course with the id of ${req.params.id}`)
        )
    }
    // Make sure user is course owner
    if(course.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(
            new ErrorResponse(`User id of ${req.user.id} is not authroized to update ${course._id}`, 401)
        );
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        sucess: true,
        data: course
    })
});

// @desc    Delete course
// @route   Delete /api/v1/courses/:id
// @access  Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course){
        return next(
            new ErrorResponse(`No course with the id of ${req.params.id}`)
        )
    }
    // Make sure user is course owner
    if(course.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(
            new ErrorResponse(`User id of ${req.user.id} is not authroized to delete ${course._id}`, 401)
        );
    }
    await course.remove();
    
    res.status(200).json({
        sucess: true,
        data: {}
    })
});