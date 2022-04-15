const express = require('express');
const path = require('path');
const morgan = require('morgan');
const compression = require('compression');
//const helmet = require('helmet');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const appError = require('./utils/appError');
const errorHandler = require('./controllers/errorController');
const bookingController = require('./controllers/bookingController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

//Start Express App
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1. Global Middleware

// serving staic files
app.use(express.static(path.join(__dirname, 'public')));

//set security HTTP Header
//app.use(helmet());

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       'script-src': [
//         "'self'",
//         'https://api.mapbox.com/',
//         'https://js.stripe.com',
//         'http://localhost:8000/1084c1c4-06bc-417b-9b6c-1bf1be28e773',
//         'blob:',
//       ],
//       'default-src': [
//         "'self'",
//         'https://api.mapbox.com/',
//         'https://js.stripe.com',
//         ' ws://localhost:56957/',
//         'https://events.mapbox.com/',
//       ],
//       'font-src': [
//         "'self'",
//         'https://fonts.googleapis.com/',
//         'https://fonts.gstatic.com/',
//       ],
//       'style-src': [
//         "'self'",
//         'https://api.mapbox.com/',
//         'https://fonts.googleapis.com',
//       ],
//     },
//   })
// );

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       /* ... */
//     },
//     reportOnly: true,
//   })
// );

//development login
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limitiere Abfragen von einer IP/ h
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'zu viele Anfragen von Ihrer IP, versuchen Sie es später',
});

app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  bookingController.webhooksCheckout
);

// body parser, reading data from body into req.body und check die größe
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Data santizitation against NOSQL query injection
app.use(mongoSanitize());

//Data santizitation against XSS
app.use(xss());

//prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration', 'ratingAverage', 'ratingQuality', 'price'],
  })
);

//test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(compression());
//routes

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);
app.use('/', viewRouter);

app.all('*', (req, res, next) => {
  next(new appError(`Can't find '${req.originalUrl}' on this server.`, 404));
});

app.use(errorHandler);

module.exports = app;
