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
    res.status(200).json(res.advanceResults);
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
    // Add user to body
    req.body.user = req.user.id;

    // Check for published bootcamp
    const publishedBootCamp = await Bootcamp.findOne( {user: req.user.id})

    // If the user is not an admin, they can only have one bootcamp
    if(publishedBootCamp && req.user.role !== 'admin'){
        return next(
            new ErrorResponse(`The user with ID ${req.user.id} has already published a bootcamp.`, 401)
        )
    }
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
    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(
            new ErrorResponse(`User id of ${req.params.id} is not authroized to update this bootcamp`, 401)
        );
    }
    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id,  req.body, {
        new: true,
        runValidators: true        
    })
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
        return next(
            new ErrorResponse(`Bootcamp cannot found of id ${req.params.id}`)
        )
    }
    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
    return next(
        new ErrorResponse(`User id of ${req.params.id} is not authroized to delete this bootcamp`, 401)
    );
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

    // Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin'){
        return next(
            new ErrorResponse(`User id of ${req.params.id} is not authroized to update this bootcamp`, 401)
        );
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