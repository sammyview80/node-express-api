const express = require('express');
const router = express.Router();

// Advnace middleware
const advanceResults = require('../middleware/advanceResult');

// Bootcamp models
const Bootcamp = require('../models/Bootcamp');


// Include other resouece routers
const courseRouter = require('./courses');
const reviewsRouter = require('./reviews');

// Protect middleware
const {protect, authorize} = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:bootcampId/courses', courseRouter);
router.use('/:bootcampId/reviews', reviewsRouter);

const {getBootcamp, 
    getBootcamps, 
    updateBootcamp, 
    deleteBootcamp, 
    getBootcampsInRadius,
    bootcampPhotoUpload,
    createBootcamp} = require('../controllers/bootcamps');

router
    .route('/')
    .get(advanceResults(Bootcamp, 'courses'), getBootcamps)
    .post(protect, authorize('publisher', 'admin'), createBootcamp);

router
    .route('/:id')
    .get(getBootcamp)
    .put(protect, authorize('publisher', 'admin'), updateBootcamp)
    .delete(protect, authorize('publisher', 'admin'), deleteBootcamp)

router
    .route('/:id/photo')
    .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

router
    .route('/radius/:zipcode/:distance')
    .get(getBootcampsInRadius);
    
module.exports = router; 