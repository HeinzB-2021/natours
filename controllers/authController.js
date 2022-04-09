const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const { token } = require('morgan');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, statusMessage, res) => {
  const token = signToken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

  res.cookie('jwt', token, cookieOption);

  //passwort aus der Ausgabe entfernen
  user.password = undefined;

  res.status(statusCode).json({
    status: statusMessage,
    data: { user },
    token,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, 'success', res);

  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'sucess',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //Check ob Email und Passwort da ist
  if (!email || !password) {
    return next(new AppError('Bitte Email und Passwort angeben', 404));
  }

  //Check ob user existiert und das passwort korekt ist
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Falsche Email oder passwort', 401));
  }
  //Wenn alles ok ist token zum client senden
  createSendToken(user, 200, 'login erfolgreich', res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'erfolgreichst',
  //   token,
  // });
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'ausgeloggt', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //Token holen und testen
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log(token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token || token === null) {
    return next(new AppError('Bitte einloggen', 401));
  }
  //Token verifizieren
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //existiert user?
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User existiert nicht', 401));
  }
  //Hat der User das passwort geändert nachdem der token erstellt wurde
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('Bitte neu anmelden', 401));
  }
  req.user = currentUser;
  res.locals.user = currentUser;
  console.log('jo');
  next();
});

//Only for renderd pages no errors
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //existiert user?
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //Hat der User das passwort geändert nachdem der token erstellt wurde
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // there is an logged in user
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.log('no');
      return next(new AppError(' nicht berechtigt', 403));
    }
    console.log('restr');
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user from email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('Für diese Email gibt es keinen User', 404));
  }
  //generate token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //send token per mail

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    
    await new Email(user, resetURL).sendPasswordReset();
    // await sendMail({
    //   email: user.email,
    //   subject: 'your password reset token(valid 10min)',
    //   message,
    // });
    res.status(200).json({
      status: 'sucess',
      message: 'Token verschickt',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('10 min rum. Später probieren', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2 if token not expired, and there is user, set the password
  if (!user) {
    return next(new AppError('Token ist falsch oder abgelaufen', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3 Update changedpasswordAt property for the user
  //4 Log in the user, send JWT
  createSendToken(user, 200, 'erfolgreich passwort reset', res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1 get user from Collection

  const user = await User.findById(req.user._id).select('+password');
  //2 check if POSTed current password is correctPassword
  //console.log(req.body.orgPassword, user);
  if (!(await user.correctPassword(req.body.orgPassword, user.password))) {
    return next(new AppError('falsches Passwort', 400));
  }
  //3 if so update password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  // 4 log user in, send JWT
  createSendToken(user, 200, 'erfolgreiches Update', res);
});
