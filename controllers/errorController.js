const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/"(.*?)"/)[1];
  const message = `Name: '${value}' schon vergeben`;
  // console.log(value);
  return new AppError(message, 400);
};

const handleValidateDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  console.log(errors);
  const message = `Ungültige Eingabe: ${errors.join('. ')}`;
  return new AppError(message, 404);
};

const handleJWT = () => new AppError('nicht angemeldet', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  console.error('ERROR 🧹 ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Etwas läuft hier falsch',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // Systemfehler wird zum client geschickt
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Programmierfehler oder  unknown error
    // Log in console für Entwickler
    console.error('ERROR ', err);
    //Allgemeine Nachricht an client
    return res.status(500).json({
      status: 'error',
      message: 'Hier läuft was schief!!',
    });
  }
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Etwas läuft hier falsch',
      msg: err.message,
    });
  }
  // Programmierfehler oder  unknown error
  // Log in console für Entwickler
  console.error('ERROR', err);
  //Allgemeine Nachricht an client
  res.status(err.statusCode).render('error', {
    title: 'Etwas läuft hier falsch',
    msg: 'Bitte später nochmal versuchen',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidateDB(error);
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    )
      error = handleJWT();

    sendErrorProd(error, req, res);
  }
};
