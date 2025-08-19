const jwt = require('jsonwebtoken');

function parseToken(req) 
{
  const h = req.headers.authorization || '';

  if (!h.startsWith('Bearer ')) 
    return null;

  return h.slice(7);
}

exports.authRequired = (req, res, next) => 
  {
  try 
  {
    const token = parseToken(req);

    if (!token) 
      return res.status(401).json({ message: 'Unauthorized' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: String(payload.id), role: payload.role || 'user' };

    return next();
  } catch 
  {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

exports.adminRequired = (req, res, next) => 
  {
  if (!req.user) 
    return res.status(401).json({ message: 'Unauthorized' });

  if (req.user.role !== 'admin') 
    return res.status(403).json({ message: 'Forbidden' });
  
  next();
};
