const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  //get tour data from collection
  const tours = await Tour.find();
  //render the template use tour data
  res.status(200).render('overview', {
    title: 'Alle Touren',
    tours,
  });
});

exports.getTour = async (req, res, next) => {
  //get data including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'wertung',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('Diese Tour gibt es nicht', 404));
  }

  res.status(200).render('tour', {
    title: `${tour.name}`,
    tour,
  });
};

exports.getLoginForm = async (req, res) => {
  res.status(200).render('login', {
    title: 'einloggen',
  });
};

exports.account = async (req, res) => {
  res.status(200).render('account', {
    title: 'Mein Account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //alle bookings
  const bookings = await Booking.find({ user: req.user.id });

  //find tours mit den returned ID's
  const tourIds = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'Meine gebuchten Touren',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidator: true,
    }
  );

  res.status(200).render('account', {
    status: 'erfolgreich',
    title: 'Mein Account',
    user: updatedUser,
  });
});
