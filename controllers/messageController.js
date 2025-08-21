// controllers/messageController.js
const mongoose = require('mongoose');
const Message  = require('../models/message');
const Notification = require('../models/notification');
const User     = require('../models/user');
const { ApiError } = require('../config/errors');

const toId = (x) => new mongoose.Types.ObjectId(String(x));
const isId = (x) => mongoose.isValidObjectId(String(x));

exports.listConversations = async (req, res, next) => 
{
  try 
  {
    const { page='1', limit='50' } = req.query;
    const uid  = toId(req.user.id);
    const pg   = Math.max(1, parseInt(page,10) || 1);
    const lim  = Math.min(200, Math.max(1, parseInt(limit,10) || 50));
    const skip = (pg - 1) * lim;


    const baseMatch = { $or: [ { from: uid }, { to: uid } ] };

    const rows = await Message.aggregate(
    [
      { $match: baseMatch },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conv',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: { 
            $sum: { 
              $cond: [
                { $and: [ { $eq: ['$to', uid] }, { $eq: ['$read', false] } ] }, 1, 0
              ]
            }
          }
        }
      },
      {
        $project: {
          conv: '$_id',
          lastMessage: 1,
          lastText: '$lastMessage.text',
          lastAt: '$lastMessage.createdAt',
          book: '$lastMessage.book',
          peerId: { $cond: [ { $eq: ['$lastMessage.from', uid] }, '$lastMessage.to', '$lastMessage.from' ] },
          unreadCount: 1
        }
      },
      { $sort: { lastAt: -1 } },
      { $skip: skip },
      { $limit: lim }
    ]);

    const peerIds = rows.map(r => r.peerId).filter(Boolean);
    const peers = await User.find({ _id: { $in: peerIds } })
                            .select('_id firstName lastName email');

    const map = {};
    peers.forEach(u => { map[String(u._id)] = u; });

    const items = rows.map(r => (
    {
      conv: r.conv,
      with: String(r.peerId),
      peer: map[String(r.peerId)] || { _id: r.peerId },
      book: r.book || null,
      lastText: r.lastText || '',
      updatedAt: r.lastAt,
      unreadCount: r.unreadCount || 0,
      lastMessage: r.lastMessage
    }));



    const totalAgg = await Message.aggregate(
    [
      { $match: baseMatch },
      { $group: { _id: '$conv' } },
      { $count: 'cnt' }
    ]);
    const total = totalAgg.length ? totalAgg[0].cnt : 0;

    res.json({ items, total, page: pg, pages: Math.ceil(total/lim) });
  } catch (e) { next(e); }
};

exports.listThread = async (req, res, next) => 
{
  try 
  {
    const { with: peer, book = null, page='1', limit='50' } = req.query;

    if (!peer || !isId(peer)) 
      throw ApiError.badRequest('Invalid "with" id');
    if (book && !isId(book))  
      throw ApiError.badRequest('Invalid "book" id');


    const conv = Message.convKey(req.user.id, peer, book || null);

    const pg   = Math.max(1, parseInt(page,10) || 1);
    const lim  = Math.min(200, Math.max(1, parseInt(limit,10) || 50));
    const skip = (pg - 1) * lim;

    const [items, total] = await Promise.all(
    [
      Message.find({ conv }).sort({ createdAt: 1 }).skip(skip).limit(lim)
        .populate('from', '_id firstName lastName email')
        .populate('to',   '_id firstName lastName email'),
      Message.countDocuments({ conv })
    ]);


    await Message.updateMany(
      { conv, to: toId(req.user.id), read: false },
      { $set: { read: true } }
    );

    res.json(
    {
      conv,
      items: Array.isArray(items) ? items : [],
      total, page: pg, pages: Math.ceil(total/lim)
    });
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


    await Notification.create(
    {
      to: toId(to),
      type: 'message',
      title: 'New message',
      text: msg.text || '(no text)',
      meta: { from: String(req.user.id), to: String(to), book: book || null },
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
    if (!peer || !isId(peer)) throw ApiError.badRequest('Invalid "with" id');
    if (book && !isId(book))  throw ApiError.badRequest('Invalid "book" id');

    const conv = Message.convKey(req.user.id, peer, book || null);
    const r = await Message.markRead(conv, req.user.id);
    res.json({ ok: true, ...r });
  } catch (e) { next(e); }
};
