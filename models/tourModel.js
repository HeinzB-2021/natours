const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
//const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name angeben'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name zu lang'],
      minlength: [10, 'Name zu kurz'],
      //validate: [validator.isAlpha, 'Nur Buchstaben'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration fehlt'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Gruppengröße fehlt'],
    },
    difficulty: {
      type: String,
      required: [true, 'Schwierigkeit fehlt'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'darf nur:easy, medium, difficult',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.0,
      min: [1, 'Muss zwischen 1 und 5'],
      max: [5, 'Muss zwischen 1 und 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Preis angeben'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this. nur bei neuerstellung
          return val < this.price;
        },
        message:
          'Discount price({VALUE}) sollte höher als der regulare Preis sein',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

    slug: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
//virtuelle Eigenschaften
tourSchema.virtual('durationWeeks').get(function () {
  const week = this.duration / 7;
  return week.toFixed(2);
});

//virtual populate
tourSchema.virtual('wertung', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT Middleware: runs before save() or create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

//QUERY Middleware
///^find/ regular expression für find() findById() etc
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: { $ne: true },
  });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-passwordChangedAt -__v',
  });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} ms`);
  next();
});

//Aggregations middleware

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
