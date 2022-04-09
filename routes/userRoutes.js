const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.route('/eingabe').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);
router.route('/me').get(userController.getMe, userController.getUser);
router.route('/forgotPassword').post(authController.forgotPassword);

//protect all routes
router.use(authController.protect);

router.route('/updatePassword').patch(authController.updatePassword);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.route('/deleteMe').delete(userController.deleteMe);
router.route('/resetPassword/:token').patch(authController.resetPassword);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.allUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    userController.deleteUser
  );

module.exports = router;
