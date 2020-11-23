const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars 
dotenv.config({
    path: './config/config.env'
})

// Load models 
const Bootcamp = require('./models/Bootcamp');
const Course = require('./models/Course');
const Users = require('./models/Users');
const Reviews = require('./models/Review');

// Connect db
mongoose.connect(
    process.env.MONGO_URL,{
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true 
    }
);

// Read JSON files
const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`, 'utf-8'));
const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`, 'utf-8'))

// Import into DB
const importData = async () => {
    try {
        await Bootcamp.create(bootcamps);
        await Course.create(courses);
        await Users.create(users);
        await Reviews.create(reviews);
        console.log('Data Imported'.green.inverse);
        process.exit();
    } catch (err) {
        console.log(err)
    }
}

// Delete from DB
const deleteData = async () => {
    try {
        await Bootcamp.deleteMany();
        await Course.deleteMany();
        await Users.deleteMany();
        await Reviews.deleteMany();
        console.log('Data Destroyed.'.red.inverse);
        process.exit();
    } catch (err) {
        console.log(err);
    }
}

if(process.argv[2] === '-i'){
    importData();
}else if(process.argv[2] === '-d'){
    deleteData()
}