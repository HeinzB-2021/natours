const Review = require('./../models/reviewModel');
const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.author) req.body.author = req.user.id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  console.log('set');
  next();
};
exports.allReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
