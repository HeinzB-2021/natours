const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
//const slugify = require('slugify');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name angeben'],
    // trim: true,
    // maxlength: [50, 'Name zu lang'],
    // minlength: [10, 'Name zu kurz'],
    //validate: [validator.isAlpha, 'Nur Buchstaben'],
  },
  email: {
    type: String,
    required: [true, 'email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, ' Bitte eine gültige Emailadresse eingeben'],
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'password is required'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'password confirm is required'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: ' Nicht das gleiche',
    },
  },
  passwordChangedAt: { type: Date },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //nur bei password änderungen
  if (!this.isModified('password')) return next();
  //hash password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  //nur bei password änderungen
  if (!this.isModified('password') || this.isNew) return next();
  //hash password
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
});

userSchema.methods.correctPassword = async function (
  canditatPassword,
  userPassword
) {
  return await bcrypt.compare(canditatPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestand) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestand < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
