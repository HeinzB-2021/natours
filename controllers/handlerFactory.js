const catchAsync = require('./../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('Keine Document mit dieser ID gefunden', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError('Keine Document mit dieser ID zum Updaten gefunden', 404)
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'sucess',
      data: {
        data: newDoc,
      },
    });
  });
exports.getOne = (Model, popOption) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOption) query = query.populate(popOption);

    const docs = await query;

    if (!docs) {
      return next(new AppError('Kein Document mit dieser ID gefunden', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: docs,
      },
    });
  });
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //nested Get reviews on tour
    let filter;
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;

    //SEND QUERY
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
