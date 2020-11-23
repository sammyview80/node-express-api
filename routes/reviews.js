const express = require('express');
const router = express.Router({ mergeParams: true});

// Reviews Models
const Review = require('../models/Review');

// Protect middleware
const {protect, authorize} = require('../middleware/auth');


// AdvanceResults Middleware
const advanceResults = require('../middleware/advanceResult');

const {
    getReviews,
    getReview,
    addReview,
    updateReview,
    deleteReview
} = require('../controllers/reviews');

router
    .route('/')
    .get(advanceResults(Review, {
        path: 'bootcamp',
        select: 'name, description'
    }), getReviews)
    .post(protect, authorize('user' , ' admin'), addReview)
    

router
    .route('/:id')
    .get(getReview)
    .put(protect,authorize('user', 'admin'), updateReview)
    .delete(protect, authorize('user', 'admin'), deleteReview);
module.exports = router; 