const mongoose = require('mongoose');
const Message  = require('../models/message');
const User     = require('../models/user');
const Notification = require('../models/notification');
const { ApiError } = require('../config/errors');

const isId = (x) => mongoose.isValidObjectId(x);

exports.listConversations = async (req, res, next) => 
{
  try 
  {
    const { page = '1', limit = '50' } = req.query;
    const data = await Message.listConversations(req.user.id, { page, limit });


    const peerIds = [...new Set((data.items || []).map(c => String(c.peerId)).filter(Boolean))];
    const users   = peerIds.length
      ? await User.find({ _id: { $in: peerIds } }).select('_id firstName lastName email')
      : [];
    const mapUser = new Map(users.map(u => [String(u._id), u]));

    const items = (data.items || []).map(c => {
      const pid  = String(c.peerId || '');
      const peer = mapUser.get(pid) || null;
      return {
        conv: c.conv,
        with: pid,            
        peerId: pid,         
        peer,               
        book: c.book || null,
        lastText: c.lastMessage?.text || '',
        lastMessage: c.lastMessage || null,
        updatedAt: c.lastAt,
        unreadCount: c.unreadCount || 0
      };
    });

    res.json({ items, total: data.total, page: data.page, pages: data.pages });
  } catch (e) {
    next(e);
  }
};

exports.listThread = async (req, res, next) => 
{
  try 
  {
    const { with: peer, book = null, page = '1', limit = '50' } = req.query;

    if (!peer || !mongoose.isValidObjectId(peer))
      throw ApiError.badRequest('Invalid "with" id');

    if (book && !mongoose.isValidObjectId(book))
      throw ApiError.badRequest('Invalid "book" id');

    const data = await Message.listThread(req.user.id, peer, book, { page, limit });
    await Message.markRead(data.conv, req.user.id);

    res.json({ ...data, items: Array.isArray(data.items) ? data.items : [] });
  } catch (e) 
  {
    next(e);
  }
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

    const msg = await Message.send(
    {
      from: req.user.id,
      to,
      text: String(text).trim(),
      book: book || null
    });

    
    await Notification.create(
    {
      to: new mongoose.Types.ObjectId(to),
      type: 'message',
      title: 'New message',
      text: msg.text || '(no text)',
      meta: { from: String(req.user.id), to: String(to), book: book || null },
      read: false
    });

    res.status(201).json({ message: msg });
  } catch (e) 
  {
    next(e);
  }
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
  } catch (e) 
  {
    next(e);
  }
};
