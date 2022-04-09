const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Welche Tour?'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Welcher User?'],
  },
  price: {
    type: Number,
    requird: [true, 'Booking must have a price'],
  },
  createAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

//   bookingSchema.pre(/^find/, function (next) {
//     this.populate({
//       path: 'user',
//       select: 'name',
//     });
//     next();
//   });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
