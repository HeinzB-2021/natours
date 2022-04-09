const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    console.log('DB-Verbindung erfolgreich');
  });

// Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//import data to DB
const importData = async () => {
  try {
    //await Tour.create(tours);
    //await Review.create(reviews);
    await User.create(users, { validateBeforeSave: false });

    console.log('Erfolgreich !!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//Delete Data from DM
const deleteData = async () => {
  try {
    //await Tour.deleteMany();
    await User.deleteMany();
    //await Review.deleteMany();
    console.log('Erfolgreich weg!!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
