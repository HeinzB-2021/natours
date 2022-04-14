const express = require('express');
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

// router
//   .route('/')
//   .get(bookingController.createBookingCheckout, viewsController.getOverview);

router.route('/').get(viewsController.getOverview);

router
  .route('/tour/:slug')
  .get(authController.isLoggedIn, viewsController.getTour);
router
  .route('/login')
  .get(authController.isLoggedIn, viewsController.getLoginForm);
router.route('/me').get(authController.protect, viewsController.account);

router
  .route('/my-tours')
  .get(authController.protect, viewsController.getMyTours);

router
  .route('/submit-user-data')
  .post(authController.protect, viewsController.updateUserData);

module.exports = router;
