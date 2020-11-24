const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

// Load env vars 
dotenv.config({
    path: './config/config.env'
})

// Connect to database
connectDB();

// Route files
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const admin = require('./routes/users');
const reviews = require('./routes/reviews');



const app = express();

// Body parser
app.use(express.json());

// Dev loggin middleware
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// File upload
app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent xss atack
app.use(xss());


// Rate limiting 
const limiter = rateLimit({
    windowMs: 10 *60* 1000, // 10 minutes
    max: 100 // limit request 
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());


// Cors 
app.use(cors());

// Static file
app.use(express.static(path.join(__dirname, 'public')));

// Cookie Parser
app.use(cookieParser());

// Mount routes
app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', admin);
app.use('/api/v1/reviews', reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server Running in ${process.env.NODE_ENV} PORT ${PORT}`.yellow.bold)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Unhandled Rejection: ${err.message}`.red);
    // Close server and Exit process
    server.close(() => process.exit(1))
})