const User = require('../models/user');
const Book = require('../models/book');
const Message = require('../models/message');
const Notification = require('../models/notification');
const Report = require('../models/report');
const Change = require('../models/change');

exports.metrics = async (_req, res, next) => 
{
  try 
  {
    const [users, books, messages, notifs] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Message.countDocuments(),
      Notification.countDocuments()
    ]);
    res.json({ users, books, messages, notifications: notifs });
  } catch (e) { next(e); }
};

exports.listUsers = async (req, res, next) => 
{
  try 
  {
    const { q = '', page = '1', limit = '20' } = req.query;
    const rx = q ? new RegExp(q, 'i') : null;
    const filter = rx ? { $or: [{ firstName: rx }, { lastName: rx }, { email: rx }] } : {};
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pg - 1) * lim;
    const [items, total] = await Promise.all([
      User.find(filter).select('_id firstName lastName email role banned createdAt').sort({ createdAt: -1 }).skip(skip).limit(lim),
      User.countDocuments(filter)
    ]);
    res.json({ items, total, page: pg, pages: Math.ceil(total / lim) });
  } catch (e) { next(e); }
};

exports.banUser = async (req, res, next) => 
{
  try 
  {
    await User.findByIdAndUpdate(req.params.id, { banned: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.unbanUser = async (req, res, next) => 
{
  try 
  {
    await User.findByIdAndUpdate(req.params.id, { banned: false });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.listBooks = async (req, res, next) => 
{
  try 
  {
    const { q = '', ownerId } = req.query;
    const filter = {};
    if (ownerId) filter.ownerId = ownerId;
    if (q) filter.$or = [{ title: { $regex: q, $options: 'i' } }, { author: { $regex: q, $options: 'i' } }];
    const items = await Book.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ items });
  } catch (e) { next(e); }
};

exports.listReports = async (req, res, next) => 
{
  try 
  {
    const { page = '1', limit = '50' } = req.query;
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pg - 1) * lim;

    const [items, total] = await Promise.all([
      Report.find({}).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Report.countDocuments()
    ]);

    const mapped = items.map(r => (
    {
      _id: r._id,
      text: r.text,
      status: r.status || (r.resolved ? 'resolved' : 'open')
    }));

    res.json({ items: mapped, total, page: pg, pages: Math.ceil(total / lim) });
  } catch (e) { next(e); }
};

exports.resolveReport = async (req, res, next) => 
{
  try 
  {
    await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.listChanges = async (req, res, next) => 
{
  try 
  {
    const { page = '1', limit = '50', userId = null } = req.query;
    const filter = userId ? { userId } : {};
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pg - 1) * lim;

    const [items, total] = await Promise.all([
      Change.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Change.countDocuments(filter)
    ]);

    const mapped = items.map(c => (
    {
      _id: c._id,
      userId: c.userId,
      field: c.field || '',
      from: c.from || '',
      to: c.to || '',
      createdAt: c.createdAt
    }));

    res.json({ items: mapped, total, page: pg, pages: Math.ceil(total / lim) });
  } catch (e) { next(e); }
};

exports.listMessages = async (req, res, next) => {
  try {
    const { conv, page='1', limit='200' } = req.query;

    if (conv) {
      const items = await Message.find({ conv })
        .sort({ createdAt: 1 })
        .populate('from','_id firstName lastName email')
        .populate('to','_id firstName lastName email');
      return res.json({ items });
    }

    const pg   = Math.max(1, parseInt(page,10) || 1);
    const lim  = Math.min(500, Math.max(1, parseInt(limit,10) || 200));
    const skip = (pg-1)*lim;

    const [items, total] = await Promise.all([
      Message.find({})
        .sort({ createdAt:-1 })
        .skip(skip).limit(lim)
        .populate('from','_id firstName lastName email')
        .populate('to','_id firstName lastName email'),
      Message.countDocuments({})
    ]);

    res.json({ items, total, page:pg, pages:Math.ceil(total/lim) });
  } catch (e) { next(e); }
};

exports.listConversations = async (_req, res, next) => 
{
  try 
  {
    const convs = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$conv', lastText: { $first: '$text' }, from: { $first: '$from' }, to: { $first: '$to' }, updatedAt: { $first: '$createdAt' } } }
    ]);

    const ids = [];
    convs.forEach(c => { if (c.from) ids.push(c.from); if (c.to) ids.push(c.to); });
    const users = await User.find({ _id: { $in: ids } }).select('_id firstName lastName email');
    const map = {}; users.forEach(u => { map[u._id] = u; });

    const items = convs.map(c => (
    {
      conv: c._id,
      lastText: c.lastText,
      updatedAt: c.updatedAt,
      from: map[c.from] || c.from,
      to: map[c.to] || c.to
    }));

    res.json({ items });
  } catch (e) { next(e); }
};

exports.listMessages = async (req, res, next) => 
{
  try 
  {
    const { conv } = req.query;

    if (!conv) 
      return res.json({ items: [] });

    const items = await Message.find({ conv }).sort({ createdAt: 1 })
      .populate('from', 'email firstName lastName')
      .populate('to', 'email firstName lastName');

    res.json({ items });
  } catch (e) { next(e); }
};
