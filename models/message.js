const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
  from:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  to:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  book:  { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null, index: true },
  conv:  { type: String, index: true },
  text:  { type: String, trim: true, default: '' },
  readBy:{ type: [mongoose.Schema.Types.ObjectId], default: [], index: true },
}, { timestamps: true });

MessageSchema.index({ conv: 1, createdAt: 1 });
MessageSchema.index({ from: 1, to: 1, createdAt: -1 });

function convKey(a, b, bookId = null) 
{
  const x = String(a), y = String(b);
  const min = x < y ? x : y;
  const max = x < y ? y : x;
  const bk  = bookId ? String(bookId) : '-';
  return `${min}_${max}_${bk}`;
}

MessageSchema.pre('save', function(next) 
{
  if (!this.conv) this.conv = convKey(this.from, this.to, this.book);
  next();
});

MessageSchema.statics.convKey = convKey;

MessageSchema.statics.listConversations = async function(userId, { page = 1, limit = 50 } = {}) 
{
  const uid  = new mongoose.Types.ObjectId(userId);
  const pg   = Math.max(1, parseInt(page, 10) || 1);
  const lim  = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pg - 1) * lim;

  const pipeline = 
  [
    { $match: { $or: [{ from: uid }, { to: uid }] } },
    { $sort: { createdAt: -1 } },
    { $group: 
      {
        _id: '$conv',
        lastMessage: { $first: '$$ROOT' },
        lastAt: { $first: '$createdAt' },
        unreadCount: 
        {
          $sum: 
          {
            $cond: 
            [
              { $and: 
                [
                { $eq: ['$to', uid] },
                { $not: { $in: [uid, '$readBy'] } }
              ]},
              1, 0
            ]
          }
        }
      }
    },
    { $addFields: 
      {
        peerId: 
        {
          $cond: 
          [
            { $eq: ['$lastMessage.from', uid] },
            '$lastMessage.to',
            '$lastMessage.from'
          ]
        }
      }
    },
    { $sort: { lastAt: -1 } },
    { $skip: skip },
    { $limit: lim }
  ];

  const items = await this.aggregate(pipeline);

  const ids = [];
  items.forEach(c => 
  {
    if (c.lastMessage.from) ids.push(c.lastMessage.from);
    if (c.lastMessage.to) ids.push(c.lastMessage.to);
    if (c.peerId) ids.push(c.peerId);
  });

  const users = await mongoose.model('User').find({ _id: { $in: ids } })
    .select('_id firstName lastName email');

  const map = {};
  users.forEach(u => { map[String(u._id)] = u; });

  const totalAgg = await this.aggregate(
  [
    { $match: { $or: [{ from: uid }, { to: uid }] } },
    { $group: { _id: '$conv' } },
    { $count: 'total' }
  ]);
  const total = totalAgg[0]?.total || 0;

  return {
    items: items.map(c => (
    {
      conv: c._id,
      peer: map[String(c.peerId)] || c.peerId,
      lastAt: c.lastAt,
      unreadCount: c.unreadCount,
      lastMessage: {
        _id: c.lastMessage._id,
        from: map[String(c.lastMessage.from)] || c.lastMessage.from,
        to:   map[String(c.lastMessage.to)] || c.lastMessage.to,
        text: c.lastMessage.text,
        createdAt: c.lastMessage.createdAt
      }
    })),
    total,
    page: pg,
    pages: Math.ceil(total / lim)
  };
};


MessageSchema.statics.listThread = async function(userId, peerId, bookId = null, { page = 1, limit = 50 } = {}) {
  const key = convKey(userId, peerId, bookId);
  const pg  = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip= (pg - 1) * lim;

  const [items, total] = await Promise.all([
    this.find({ conv: key })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(lim)
      .populate('from', '_id firstName lastName email')
      .populate('to', '_id firstName lastName email'),
    this.countDocuments({ conv: key })
  ]);

  return { items, total, page: pg, pages: Math.ceil(total / lim), conv: key };
};

MessageSchema.statics.send = function({ from, to, text, book = null }) 
{
  return this.create(
  {
    from, to, text,
    book: book || null,
    conv: convKey(from, to, book),
    readBy: [new mongoose.Types.ObjectId(from)]
  });
};

MessageSchema.statics.markRead = async function(conv, userId) 
{
  const uid = new mongoose.Types.ObjectId(userId);
  const res = await this.updateMany(
    { conv, to: uid, readBy: { $ne: uid } },
    { $addToSet: { readBy: uid } }
  );
  return { matched: res.matchedCount ?? res.n, modified: res.modifiedCount ?? res.nModified };
};

module.exports = mongoose.model('Message', MessageSchema);
