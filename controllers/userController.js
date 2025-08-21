const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/user');
const Change   = require('../models/change'); 
const { ApiError } = require('../config/errors');


exports.getMe = async (req, res, next) => 
{
  try 
  {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) 
        throw ApiError.notFound('User not found');

    res.json({ user });

  } catch (e) { next(e); }
};



exports.updateMe = async (req, res, next) =>
{
  try
  {
    const { firstName, lastName, avatar, bio } = req.body;
    const before = await User.findById(req.user.id).select('firstName lastName avatar bio');
    const after  = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, avatar, bio },
      { new: true, runValidators: true }
    ).select('-password');

    if (Change) 
    {
      await Change.create({ userId: req.user.id, action: 'profile.update', diff: { before, after } });
    }

    res.json({ user: after });
  } catch (e) { next(e); }
};

exports.changePassword = async (req, res, next) => 
{
  try 
  {
    const { oldPassword, newPassword } = req.body;
    const me = await User.findById(req.user.id);
    const ok = await bcrypt.compare(oldPassword || '', me.password || '');

    if (!ok) 
        throw ApiError.badRequest('Wrong current password');

    me.password = newPassword; 
    await me.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
};


exports.list = async (req, res, next) => 
{
  try 
  {
    const { q='', page='1', limit='50', role, banned } = req.query;
    const filter = {};

    if (q) filter.$or = [{ firstName: { $regex:q,$options:'i' } }, { lastName: { $regex:q,$options:'i' } }, { email: { $regex:q,$options:'i' } }];
    if (role) filter.role = role;
    if (typeof banned !== 'undefined') filter.banned = banned === 'true';

    const pg  = Math.max(1, parseInt(page,10) || 1);
    const lim = Math.min(200, Math.max(1, parseInt(limit,10) || 50));
    const skip= (pg-1)*lim;

    const [items,total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).select('-password'),
      User.countDocuments(filter),
    ]);

    res.json({ items,total,page:pg,pages:Math.ceil(total/lim) });
  } catch (e) { next(e); }
};



exports.getById = async (req,res,next) => 
{
  try 
  {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) 
        throw ApiError.badRequest('Invalid user id');

    const user = await User.findById(id).select('-password');

    if (!user) 
        throw ApiError.notFound('User not found');
    
    res.json({ user });
  } catch (e) { next(e); }
};
