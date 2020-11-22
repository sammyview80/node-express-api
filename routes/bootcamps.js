const express = require('express');
const router = express.Router();


// Include other resouece routers
const courseRouter = require('./courses');

// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRouter);

const {getBootcamp, 
    getBootcamps, 
    updateBootcamp, 
    deleteBootcamp, 
    getBootcampsInRadius,
    bootcampPhotoUpload,
    createBootcamp} = require('../controllers/bootcamps');

router
    .route('/')
    .get(getBootcamps)
    .post(createBootcamp);

router
    .route('/:id')
    .get(getBootcamp)
    .put(updateBootcamp)
    .delete(deleteBootcamp)

router
    .route('/:id/photo')
    .put(bootcampPhotoUpload);

router
    .route('/radius/:zipcode/:distance')
    .get(getBootcampsInRadius);
    
module.exports = router; 