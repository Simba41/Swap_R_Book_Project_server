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
      
      const convs = await Message.aggregate([
        { $match: { $or: [ { from:req.user.id }, { to:req.user.id } ] } },
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: { conv:'$conv' },
            lastText: { $first: '$text' },
            updatedAt: { $first: '$createdAt' }
        }}
      ]);

      const items = convs.map(c => (
      {
        conv: c._id.conv,
        lastText: c.lastText,
        updatedAt: c.updatedAt
      }));

      return res.json({ items });
    }


    const conv = convKey(req.user.id, withId, bookId);
    const items = await Message.find({ conv }).sort({ createdAt: 1 });
    res.json({ items });
  } catch (e) 
  { 
    next(e); 
  }
});


router.post('/send', authRequired, async (req, res, next) => 
{
  try 
  {
    const { to, book=null, text } = req.body || {};

    if (!to || !text) 
      return res.status(400).json({ message: 'to and text required' });

    const conv = convKey(req.user.id, to, book);
    const msg = await Message.create({
      conv,
      book,
      from: req.user.id,
      to,
      text,
      readBy: [req.user.id]
    });

    await Notification.create({
      to: new mongoose.Types.ObjectId(to),
      type: 'message',
      title: 'New message',
      text,
      meta: { from: req.user.id, book }
    });

    res.status(201).json(msg);
  } catch (e) 
  { 
    next(e); 
  }
});

router.get('/admin', authRequired, adminRequired, async (req, res, next) => 
{
  try 
  {
    const { user, with: withId, book=null } = req.query || {};
    
    if (!user || !withId) 
      return res.json({ items: [] });

    const conv = convKey(user, withId, book);
    const items = await Message.find({ conv }).sort({ createdAt: 1 });
    res.json({ items });
  } catch (e) { next(e); }
});

module.exports = router;
