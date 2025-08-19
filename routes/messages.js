const express = require('express');
const { authRequired, adminRequired } = require('../middleware/auth');
const mongoose = require('mongoose');

const Message = require('../models/message');
const Notification = require('../models/notification');

const router = express.Router();

function convKey(u1, u2, bookId)
{
  return Message.convKey(u1, u2, bookId);
}


router.get('/', authRequired, async (req, res, next) =>
{
  try
  {
    const withId = req.query.with;
    const bookId = req.query.book || null;


    if (!withId)
    {
      const meId = new mongoose.Types.ObjectId(req.user.id);

      const convs = await Message.aggregate([
        { $match: { $or: [ { from: meId }, { to: meId } ] } },
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: '$conv',
            lastText:  { $first: '$text' },
            updatedAt: { $first: '$createdAt' },
            from:      { $first: '$from' },
            to:        { $first: '$to' }
        }}
      ]);


      const items = convs.map(c => ({
        conv: c._id,
        lastText: c.lastText,
        updatedAt: c.updatedAt,
        from: c.from,
        to:   c.to
      }));

      return res.json({ items });
    }


    const conv = convKey(String(req.user.id), String(withId), bookId);
    const items = await Message.find({ conv }).sort({ createdAt: 1 });
    res.json({ items });
  }
  catch (e) { next(e); }
});


router.post('/send', authRequired, async (req, res, next) =>
{
  try
  {
    const { to, book=null, text } = req.body || {};
    if (!to || !text)
      return res.status(400).json({ message: 'to and text required' });

    const meId = new mongoose.Types.ObjectId(req.user.id);
    const toId = new mongoose.Types.ObjectId(to);

    const conv = convKey(String(meId), String(toId), book);

    const msg = await Message.create({
      conv,
      book,
      from: meId,
      to:   toId,
      text,
      readBy: [meId]
    });

    await Notification.create({
      to: toId,
      type: 'message',
      title: 'New message',
      text,
      meta: { from: String(meId), book }
    });

    res.status(201).json(msg);
  }
  catch (e) { next(e); }
});


router.get('/admin', authRequired, adminRequired, async (req, res, next) =>
{
  try
  {
    const { conv } = req.query || {};
    if (!conv) return res.json({ items: [] });

    const items = await Message.find({ conv }).sort({ createdAt: 1 })
      .populate('from','email firstName lastName')
      .populate('to','email firstName lastName');

    res.json({ items });
  }
  catch (e) { next(e); }
});

module.exports = router;
