const mongoose = require('mongoose');
const Message  = require('../models/message');
const Notification = require('../models/notification');
const User = require('../models/user');
const { ApiError } = require('../config/errors');

const isId = (x) => mongoose.isValidObjectId(x);

exports.listConversations = async (req, res, next) => 
{
  try 
  {
    const { page = '1', limit = '50' } = req.query;


    const data = await Message.listConversations(req.user.id, { page, limit });

    const peerIds = [...new Set((data.items || [])
      .map(i => i.peerId)
      .filter(Boolean)
      .map(String))];

    const users = peerIds.length
      ? await User.find({ _id: { $in: peerIds } }).select('_id firstName lastName email')
      : [];

    const uMap = {};
    users.forEach(u => { uMap[String(u._id)] = u; });

    const items = (data.items || []).map(c => {
      const peer = uMap[String(c.peerId)] || null;
      return {
        conv: c.conv,
     
        peer: peer ? {
          _id: peer._id,
          firstName: peer.firstName || '',
          lastName:  peer.lastName  || '',
          email:     peer.email     || ''
        } : null,
        with: c.peerId ? String(c.peerId) : '', 
        book: c.book || null,
        lastText: c.lastMessage?.text || '',
        updatedAt: c.lastAt,
        unreadCount: c.unreadCount || 0,
        lastMessage: c.lastMessage || null
      };
    });

    res.json(
    {
      items,
      total: data.total || items.length,
      page: data.page || Number(page),
      pages: data.pages || 1
    });
  } catch (e) { next(e); }
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



    if (data?.conv) 
    {
      await Message.markRead(data.conv, req.user.id);
    }



    const items = Array.isArray(data.items) ? data.items : [];

    res.json({ ...data, items });
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

    const msg = await Message.send(
    {
      from: req.user.id,
      to,
      text: String(text).trim(),
      book: book || null
    });



    const link = `#/chat?with=${encodeURIComponent(String(to))}${book ? `&book=${encodeURIComponent(String(book))}` : ''}`;
    await Notification.create(
    {
      to: new mongoose.Types.ObjectId(to),
      type: 'message',
      title: 'New message',
      text: msg.text || '(no text)',
      meta: { from: String(req.user.id), to: String(to), book: book || null, link },
      read: false
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
}