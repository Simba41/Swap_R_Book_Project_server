const mongoose = require('mongoose');
const Message  = require('../models/message');
const Notification = require('../models/notification');
const { ApiError } = require('../config/errors');

const isId = (x) => mongoose.isValidObjectId(x);

exports.listConversations = async (req, res, next) => 
{
  try 
  {
    const { page = '1', limit = '50' } = req.query;
    const data = await Message.listConversations(req.user.id, { page, limit });
    res.json(data);
  } catch (e) 
  { 
    next(e); 
}
};

exports.listThread = async (req, res, next) => 
{
  try 
  {
    const { with: peer, book = null, page = '1', limit = '50' } = req.query;
    if (!peer || !isId(peer)) throw ApiError.badRequest('Invalid "with" id');
    if (book && !isId(book))  throw ApiError.badRequest('Invalid "book" id');

    const data = await Message.listThread(req.user.id, peer, book, { page, limit }); // mark as read
    await Message.markRead(data.conv, req.user.id);
    res.json(data);
  } catch (e) { next(e); }
};

exports.send = async (req, res, next) => 
{
  try 
  {
    const { to, text, book = null } = req.body || {};

    if (!to || !text) 
        throw ApiError.badRequest('to and text required');

    if (!isId(to))     
        throw ApiError.badRequest('Invalid "to" id');

    if (book && !isId(book)) 
        throw ApiError.badRequest('Invalid "book" id');


    const msg = await Message.send({ from: req.user.id, to, text: String(text).trim(), book: book || null });

    
    await Notification.create(
    {
      to,
      type: 'message',
      data: { title: 'New message', text: msg.text, from: String(req.user.id), book: book || null }
    });

    res.status(201).json({ message: msg });
  } catch (e) { next(e); }
};

exports.markRead = async (req, res, next) => 
{
  try 
  {
    const { with: peer, book = null } = req.query;

    if (!peer || !isId(peer)) 
        throw ApiError.badRequest('Invalid "with" id');

    if (book && !isId(book))  
        throw ApiError.badRequest('Invalid "book" id');

    const conv = Message.convKey(req.user.id, peer, book);
    const r = await Message.markRead(conv, req.user.id);
    res.json({ ok: true, ...r });
  } catch (e) { next(e); }
};
