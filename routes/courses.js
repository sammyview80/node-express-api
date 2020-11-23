const express = require('express');
const router = express.Router({ mergeParams: true});

// Course Models
const Course = require('../models/Course');

// Protect middleware
const {protect, authorize} = require('../middleware/auth');


// AdvanceResults Middleware
const advanceResults = require('../middleware/advanceResult');

const {
    getCourses,
    getCourse,
    addCourse,
    updateCourse,
    deleteCourse
} = require('../controllers/courses');

router
    .route('/')
    .get(advanceResults(Course, {
        path: 'bootcamp',
        select: 'name, description'
    }), getCourses)
    .post(protect,  authorize('publisher', 'admin'), addCourse);
    
router.route('/:id')
    .get(getCourse)
    .put(protect, authorize('publisher', 'admin'), updateCourse)
    .delete(protect, authorize('publisher', 'admin'), deleteCourse)

module.exports = router; 