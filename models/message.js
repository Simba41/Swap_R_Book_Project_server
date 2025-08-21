const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  to:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  book:  { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null, index: true },
  conv:  { type: String, index: true },
  text:  { type: String, trim: true, default: '' },

  readBy:{ type: [mongoose.Schema.Types.ObjectId], default: [], index: true },
}, { timestamps: true });

MessageSchema.index({ conv: 1, createdAt: 1 });
MessageSchema.index({ from: 1, to: 1, createdAt: -1 });

function convKey(a, b, bookId = null) {
  const x = String(a), y = String(b);
  const min = x < y ? x : y;
  const max = x < y ? y : x;
  const bk  = bookId ? String(bookId) : '-';
  return `${min}_${max}_${bk}`;
}

MessageSchema.pre('save', function(next) {
  if (!this.conv) this.conv = convKey(this.from, this.to, this.book);
  next();
});

MessageSchema.statics.convKey = convKey;

MessageSchema.statics.listConversations = async function(userId, { page = 1, limit = 50 } = {}) {
  const uid  = new mongoose.Types.ObjectId(userId);
  const pg   = Math.max(1, parseInt(page, 10) || 1);
  const lim  = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pg - 1) * lim;

  const pipeline = [
    { $match: { $or: [{ from: uid }, { to: uid }] } },
    { $sort: { createdAt: -1 } },
    { $group: {
        _id: '$conv',
        lastMessage: { $first: '$$ROOT' },
        lastAt: { $first: '$createdAt' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$to', uid] },
                { $not: { $in: [uid, '$readBy'] } }
              ]},
              1, 0
            ]
          }
        }
      }
    },
    { $addFields: {
        peerId: {
          $cond: [
            { $eq: ['$lastMessage.from', uid] },
            '$lastMessage.to',
            '$lastMessage.from'
          ]
        }
      }
    },
    { $sort: { lastAt: -1 } },
    { $skip: skip },
    { $limit: lim },
    { $project: {
        _id: 0,
        conv: '$_id',
        peerId: 1,
        lastAt: 1,
        unreadCount: 1,
        book: '$lastMessage.book',
        lastMessage: {
          _id: '$lastMessage._id',
          from: '$lastMessage.from',
          to:   '$lastMessage.to',
          text: '$lastMessage.text',
          readBy: '$lastMessage.readBy',
          createdAt: '$lastMessage.createdAt'
        }
      }
    }
  ];

  const items = await this.aggregate(pipeline);
  const totalAgg = await this.aggregate([
    { $match: { $or: [{ from: uid }, { to: uid }] } },
    { $group: { _id: '$conv' } },
    { $count: 'total' }
  ]);
  const total = totalAgg[0]?.total || 0;
  return { items, total, page: pg, pages: Math.ceil(total / lim) };
};


MessageSchema.statics.listThread = async function(userId, peerId, bookId = null, { page = 1, limit = 50 } = {}) {
  const key = convKey(userId, peerId, bookId);
  const pg  = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
  const skip= (pg - 1) * lim;

  const [items, total] = await Promise.all([
    this.find({ conv: key }).sort({ createdAt: 1 }).skip(skip).limit(lim),
    this.countDocuments({ conv: key })
  ]);

  return { items, total, page: pg, pages: Math.ceil(total / lim), conv: key };
};


MessageSchema.statics.send = function({ from, to, text, book = null }) 
{
  return this.create({
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
