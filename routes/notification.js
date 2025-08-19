const express = require('express');
const { authRequired } = require('../middleware/auth');
const Notification = require('../models/notification');

const router = express.Router();
router.use(authRequired);


router.get('/', async (req, res, next) => 
{
  try 
  {
    const unreadOnly = String(req.query.unread || '0') === '1';
    const q = { to: req.user.id };

    if (unreadOnly) q.read = false;

    const items = await Notification.find(q).sort({ createdAt: -1 });
    res.json(items); 
  } catch (e) 
  {
    next(e);
  }
});


router.post('/:id/read', async (req, res, next) => 
{
  try 
  {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, to: req.user.id },
      { read: true }
    );
    res.json({ ok: true });
  } catch (e) 
  {
    next(e);
  }
});

module.exports = router;
