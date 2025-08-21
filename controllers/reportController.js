const mongoose = require('mongoose');
const Report = require('../models/report');
const { ApiError } = require('../config/errors');



exports.create = async (req,res,next) => 
{
  try 
  {
    const { to=null, book=null, text='' } = req.body || {};

    if (!text.trim()) 
        throw ApiError.badRequest('Text required');

    if (to && !mongoose.isValidObjectId(to)) 
        throw ApiError.badRequest('Invalid "to" id');

    if (book && !mongoose.isValidObjectId(book)) 
        throw ApiError.badRequest('Invalid "book" id');

    const r = await Report.create(
    {
      from: req.user?.id || null,
      to, book, text
    });

    res.status(201).json({ report: r });
  } catch(e) { next(e); }
};




exports.list = async (req,res,next) => 
{
  try 
  {
    const { status, page='1', limit='50' } = req.query;
    const filter = {};

    if (status) filter.status = status;

    const pg  = Math.max(1, parseInt(page,10) || 1);
    const lim = Math.min(200, Math.max(1, parseInt(limit,10) || 50));
    const skip= (pg-1)*lim;

    const [items,total] = await Promise.all(
        [
      Report.find(filter).sort({ createdAt:-1 }).skip(skip).limit(lim),
      Report.countDocuments(filter),
    ]);

    res.json({ items,total,page:pg,pages:Math.ceil(total/lim) });
  } catch(e) { next(e); }
};

exports.updateStatus = async (req,res,next) => 
{
  try 
  {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) 
        throw ApiError.badRequest('Invalid id');

    if (!['open','resolved','rejected'].includes(status)) 
        throw ApiError.badRequest('Invalid status');

    const updated = await Report.findByIdAndUpdate(id, { status }, { new:true });
    if (!updated) 
        throw ApiError.notFound('Report not found');
    
    res.json({ report: updated });
  } catch(e) { next(e); }
};
