
function notFound(req, res, next) 
{
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

function errorHandler(err, req, res, next) 
{ 
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
}

module.exports = { notFound, errorHandler };
