class ApiError extends Error
{
  constructor(status, message, details = null)
  {
    super(message);
    this.status  = status;
    this.details = details;
  }

  static badRequest(msg = 'Bad Request', details)  { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'Unauthorized')        { return new ApiError(401, msg); }
  static forbidden(msg = 'Forbidden')              { return new ApiError(403, msg); }
  static notFound(msg = 'Not Found')               { return new ApiError(404, msg); }
  static server(msg = 'Internal Server Error')     { return new ApiError(500, msg); }
}


function notFound(req, res, next)
{
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}


function errorHandler(err, req, res, next)
{
  const status = err.status || 500;

  const payload = {
    error: err.message || 'Server error',
  };

  if (err.details) payload.details = err.details;


  if (process.env.NODE_ENV !== 'production' && err.stack)
    payload.stack = err.stack;

  res.status(status).json(payload);
}

module.exports = { ApiError, notFound, errorHandler };
