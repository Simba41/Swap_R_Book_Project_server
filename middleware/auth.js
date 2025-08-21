
const jwt = require('jsonwebtoken');
const { ApiError } = require('../config/errors');

function parseToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

exports.authRequired = (req, _res, next) => 
{
  try 
  {
    const token = parseToken(req);

    if (!token) 
      throw ApiError.unauthorized();

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: String(payload.id), role: payload.role || 'user' };
    next();
  } catch (err) 
  {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
};

exports.adminRequired = (req, _res, next) => 
{
  if (!req.user) 
    return next(ApiError.unauthorized());
  if (req.user.role !== 'admin') 
    return next(ApiError.forbidden());
  next();
};
