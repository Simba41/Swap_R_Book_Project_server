const mongoose = require('mongoose');
const Notification = require('../models/notification');
const { ApiError } = require('../config/errors');

exports.list = async (req, res, next) => 
{
  try 
  {
    const { unread, page = '1', limit = '50' } = req.query;
    const filter = { to: req.user.id };

    if (typeof unread !== 'undefined') 
    {
      if (unread==='true' || unread==='1') filter.read = false;
      if (unread==='false' || unread==='0') filter.read = true;
    }

    const pg   = Math.max(1, parseInt(page, 10) || 1);
    const lim  = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pg - 1) * lim;

    const [items,total] = await Promise.all(
    [
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Notification.countDocuments(filter),
    ]);

    res.json({ items,total,page:pg,pages:Math.ceil(total/lim) });
  } catch (e) { next(e); }
};

exports.markRead = async (req, res, next) => 
{
  try 
  {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) 
      throw ApiError.badRequest('Invalid notification id');

    const updated = await Notification.findOneAndUpdate
    (
      { _id: id, to: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!updated) 
      throw ApiError.notFound('Notification not found');
    
    res.json({ notification: updated });
  } catch (e) { next(e); }
};
