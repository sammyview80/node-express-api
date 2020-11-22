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
    let query;

    if(req.params.bootcampId){
        query = Course.find({
            bootcamp: req.params.bootcampId
        })
    }else {
        query = Course.find();
    }
    const courses = await query.populate({
        path: 'bootcamp',
        select: 'name description'
    });

    res.status(200).json({
        sucess: true,
        count: courses.length,
        data: courses
    })
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

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp cannot find of id ${req.params.bootcampId}'`));
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
    await course.remove();
    
    res.status(200).json({
        sucess: true,
        data: {}
    })
});