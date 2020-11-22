const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');
const geocoder = require('../utils/geoCoder');
const { remove } = require('../models/Bootcamp');

// @des     Get all bootcamps
//@route    GET /api/v1/bootcamps
//@access   Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query }

    
    // Field to exclude
    const removeFields = ['select', 'sort', 'limit', 'page'];
    
    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte) 
    queryStr = queryStr.replace(/\b(gt|gte|lte|lt|in)\b/g, match => `$${match}`);
    
    console.log(queryStr)
    // Finding resources
    query = Bootcamp.find(JSON.parse(queryStr)).populate({
        path: 'courses',
        select: 'title'
    });

    // Select Fields
    if(req.query.select){
        const fields = req.query.select.split(',').join(' ');
        query.select(fields);
    }

    // Sort
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query.sort(sortBy);
    }else {
        query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page-1)*limit;
    const endIndex = page*limit;
    const total = await Bootcamp.countDocuments();

    query = query.skip(startIndex).limit(limit);
    
    // Executing query
    const bootcamps = await query;

    // Pagination Result
    const pagination = {};
    if(endIndex < total){
        pagination.next = {
            page: page + 1,
            limit
        }
    }
    if(startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    res.status(200).json({
        sucess:true, 
        count: bootcamps.length,
        pagination,
        data: bootcamps
    });
})
// @des     Get single bootcamps
//@route    GET /api/v1/bootcamps/:id
//@access   Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404))
    }
    res.status(200).json({
        sucess:true, 
        data: bootcamp
    });
})

// @des     Create new bootcamps
//@route    POST /api/v1/bootcamps
//@access   Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body);
    res.status(201).json({
        sucess: true,
        data: bootcamp
    })
})

// @des     Update bootcamps
//@route    PUT /api/v1/bootcamps/:id
//@access   Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
        const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true        
        });
        res.status(200).json({
            sucess:true, 
            data: bootcamp
        });
})

// @des     Delete bootcamps
//@route    DELETE /api/v1/bootcamps/:id
//@access   Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if(!bootcamp) {
        return res.status(400).json({
            sucess: false
        })
    }
    bootcamp.remove();
    res.status(200).json({
        sucesss: true, 
        data: []
    })
});


// @des     Get bootcamps with radius
//@route    GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access   Public
exports.getBootcampsInRadius= asyncHandler(async (req, res, next) => {
    const {zipcode, distance } = req.params;

    // Get the latitude and longitude from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lng = loc[0].longitude;
    const lat = loc[0].latitude;

    // Calc radius using radians
    // Divide dist by radius of Earth
    // Earch Radius = 3,963mi /6378 km
    const radius = distance / 6378;

    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: { $centerSphere: [ [lng, lat], radius]}
        }
    })
    res.status(200).json({
        sucess: true, 
        count: bootcamps.length,
        data: bootcamps

    })
})

// @des     Upload photo for bootcamp
//@route    PUT /api/v1/bootcamps/:id/photo
//@access   Private
exports.bootcampPhotoUpload= asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if(!bootcamp){
        return next(
            new ErrorResponse(`No bootcamp of id ${req.params.id}`, 400)
        )
    }

    if(!req.files){
        return next(
            new ErrorResponse('Please upload a file', 400)
        )
    }
    const file = req.files.file;

    // Make sure the image is a photo;
    if(!file.mimetype.startsWith('image')){
        return next(
            new ErrorResponse('Please upload a valid image', 400)
        )
    }
    
    // Check file size
    if(file.size > process.env.MAX_FILE_UPLOAD){
        return next(
            new ErrorResponse(`Please upload a image less than ${process.env.MAX_FILE_UPLOAD}`, 400)
        )
    }

    // Create custom filename
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if(err) {
            console.error(err);
            return next(
                new ErrorResponse('Server Error', 500)
            )
        };

        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name});

        res.status(200).json({
            sucess: true,
            data: file.name
        })
    })
})