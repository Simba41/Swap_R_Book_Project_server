const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/user');
const { ApiError } = require('../config/errors');

function signToken(user) 
{
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

exports.register = async (req,res,next) => 
{
  try 
  {
    let { firstName, lastName, email, password } = req.body || {};

    if (!firstName || !lastName || !email || !password)
      throw ApiError.badRequest('Missing fields');

    email = email.toLowerCase();

    const exists = await User.findOne({ email });
    
    if (exists) 
      throw ApiError.badRequest('Email already registered');

    const user = await User.create({ firstName, lastName, email, password });

    const token = signToken(user);
    res.status(201).json({ 
      token, 
      user: { id:user._id, firstName, lastName, email, role:user.role } 
    });
  } catch(e) { next(e); }
};

exports.login = async (req,res,next) => 
{
  try 
  {
    let { email, password } = req.body || {};
    if (!email || !password) throw ApiError.badRequest('Missing fields');

    email = email.toLowerCase();

    const user = await User.findOne({ email });
    if (!user) 
      throw ApiError.unauthorized('Invalid credentials');
    if (user.banned) 
      throw ApiError.forbidden('Account banned');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) 
      throw ApiError.unauthorized('Invalid credentials');

    const token = signToken(user);
    res.json({ 
      token, 
      user: { id:user._id, firstName:user.firstName, lastName:user.lastName, email:user.email, role:user.role } 
    });
  } 
  catch(e) { next(e); }
};

exports.me = async (req,res,next) => 
{
  try 
  {
    const u = await User.findById(req.user.id)
      .select('_id firstName lastName email avatar loc role banned');

    if (!u) throw ApiError.notFound('User not found');
    
    res.json({ user: u });
  } 
  catch(e) { next(e); }
};
