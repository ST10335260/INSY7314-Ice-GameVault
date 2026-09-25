const config = require('../config/env');
const logger = require('../utils/logger');

exports.notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

/** Central error handler: consistent JSON and no stack traces leaked to clients. */
exports.errorHandler = (err, req, res, _next) => {
  let status = err.statusCode || 500;
  let { message } = err;

  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyValue || {}).join(', ') || 'Value'} already exists`;
  }
  if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON body'; }
  if (err.type === 'entity.too.large') { status = 413; message = 'Request body too large'; }

  if (status >= 500) {
    logger.error(err);
    if (config.isProduction) message = 'Something went wrong';
  } else {
    logger.warn(`${status} ${req.method} ${req.originalUrl} - ${message}`);
  }

  res.status(status).json({ success: false, message: message || 'Server error' });
};
