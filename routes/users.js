const express = require('express');
const {
    getUser,
    getUsers,
    updateUser,
    deleteUser,
    createUser
} = require('../controllers/users');

// User model
const Users = require('../models/Users');

const router = express.Router();


// Advnace middleware
const advanceResults = require('../middleware/advanceResult');


// Protect middleware
const {protect, authorize} = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router
    .route('/')
    .get(advanceResults(Users, ''), getUsers)
    .post(createUser);

router
    .route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser)
    
module.exports = router; 