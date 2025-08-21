const mongoose = require('mongoose');
const jwt      = require('jsonwebtoken');
const Book     = require('../models/book');
const { ApiError } = require('../config/errors');

exports.genres = async (_req,res,next) => 
{
  try 
  {
    const items = (await Book.distinct('tags')).filter(Boolean).sort();
    res.json({ items });
    
  } catch(e) { next(e); }
};

exports.list = async (req,res,next) => 
{
  try 
  {
    const { q, genre, owner, ownerId, sort='new', page='1', limit='20' } = req.query;
    const filter = {};

    if (q) filter.$or = [{ title:{ $regex:q,$options:'i' } }, { author:{ $regex:q,$options:'i' } }];
    if (genre) filter.genre = genre;
    if (ownerId) filter.ownerId = ownerId;

    if (owner === 'me' && req.headers.authorization) 
    {
      try 
      {
        const payload = jwt.verify((req.headers.authorization||'').replace('Bearer ',''), process.env.JWT_SECRET);
        filter.ownerId = payload.id;
      } catch {}
    }

    const pg = Math.max(1, parseInt(page,10)||1);
    const lim= Math.min(50, Math.max(1, parseInt(limit,10)||20));
    const skip=(pg-1)*lim;
    const sortObj = sort==='old'?{createdAt:1}:{createdAt:-1};

    const [items,total] = await Promise.all([
      Book.find(filter).sort(sortObj).skip(skip).limit(lim),
      Book.countDocuments(filter)
    ]);

    res.json({ items,total,page:pg,pages:Math.ceil(total/lim) });
  } catch(e) { next(e); }
};

exports.getOne = async (req,res,next) => 
{
  try 
  {
    const book = await Book.findById(req.params.id).populate('ownerId','firstName lastName avatar loc');
    if (!book) throw ApiError.notFound('Book not found');
    res.json(book);
  } catch(e) { next(e); }
};

exports.create = async (req,res,next) => 
{
  try 
  {
    const { title,author,review='',cover='',genre='',tags=[],pickup='',loc=null } = req.body||{};
    if (!title || !author) throw ApiError.badRequest('Title and author required');
    const book = await Book.create({ ownerId:req.user.id,title,author,review,cover,genre,tags,pickup,loc });
    res.status(201).json(book);
  } catch(e) { next(e); }
};

exports.update = async (req,res,next) => 
{
  try 
  {
    const book = await Book.findById(req.params.id);

    if (!book) 
        throw ApiError.notFound('Book not found');

    const isOwner = String(book.ownerId)===req.user.id;
    const isAdmin = req.user.role==='admin';

    if (!isOwner && !isAdmin) 
        throw ApiError.forbidden();

    const fields=['title','author','review','cover','genre','tags','pickup','loc'];
    fields.forEach(k=>{ if (k in req.body) book[k]=req.body[k]; });
    await book.save();
    res.json(book);

  } catch(e) { next(e); }
};

exports.remove = async (req,res,next) => 
{
  try 
  {
    const book = await Book.findById(req.params.id);

    if (!book) 
        throw ApiError.notFound('Book not found');

    const isOwner = String(book.ownerId)===req.user.id;
    const isAdmin = req.user.role==='admin';

    if (!isOwner && !isAdmin) 
        throw ApiError.forbidden();
    
    await book.deleteOne();
    res.json({ ok:true });
  } catch(e) { next(e); }
};


exports.like = async (req,res,next) => 
{
  try 
  {
    const { id } = req.params;
    const book = await Book.findById(id);

    if (!book) 
      throw ApiError.notFound('Book not found');

    const uid = req.user.id;

    if (book.likedBy.includes(uid)) 
      return res.json({ liked:true, likes:book.likes });

    book.likedBy.push(uid);
    book.likes = book.likedBy.length;
    await book.save();
    res.json({ liked:true, likes:book.likes });
  } catch(e){ next(e); }
};

exports.unlike = async (req,res,next) => 
{
  try 
  {
    const { id } = req.params;
    const book = await Book.findById(id);

    if (!book) 
      throw ApiError.notFound('Book not found');

    const uid = req.user.id;
    book.likedBy = book.likedBy.filter(u => String(u) !== String(uid));
    book.likes = book.likedBy.length;
    await book.save();
    res.json({ liked:false, likes:book.likes });
  } catch(e){ next(e); }
};