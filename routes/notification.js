const express = require('express');
const { authRequired } = require('../middleware/auth');
const Notification = require('../models/notification');
const mongoose = require('mongoose');

const router = express.Router();
router.use(authRequired);



router.get('/', async (req, res, next) =>
{
  try
  {
    const unreadOnly = String(req.query.unread || '0') === '1';
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const q = { to: userId };
    if (unreadOnly) q.read = false;

    const items = await Notification.find(q).sort({ createdAt: -1 });
    res.json({ items });
  }
  catch (e) { next(e); }
});




router.post('/:id/read', async (req, res, next) =>
{
  try
  {
    if (!mongoose.isValidObjectId(req.params.id))
      return res.status(400).json({ message: 'Invalid notification id' });

    const notifId = new mongoose.Types.ObjectId(req.params.id);
    const userId  = new mongoose.Types.ObjectId(req.user.id);

    await Notification.findOneAndUpdate(
      { _id: notifId, to: userId },
      { read: true }
    );

    res.json({ ok: true });
  }
  catch (e) { next(e); }
});

module.exports = router;
