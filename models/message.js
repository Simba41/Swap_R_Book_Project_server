// server/models/message.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema(
{
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  to:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, trim: true },
  book: { type: Schema.Types.ObjectId, ref: 'Book', default: null, index: true },

  conv: { type: String, required: true, index: true },


  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

MessageSchema.index({ conv: 1, createdAt: -1 });
MessageSchema.index({ from: 1, to: 1, createdAt: -1 });


MessageSchema.statics.convKey = function(u1, u2, bookId = null) 
{
  const a = String(u1);
  const b = String(u2);
  const [x, y] = a < b ? [a, b] : [b, a];
  return bookId ? `${x}_${y}_${String(bookId)}` : `${x}_${y}`;
};

MessageSchema.pre('validate', function(next) 
{
  if (!this.conv) 
  {
    this.conv = mongoose.model('Message').convKey(this.from, this.to, this.book || null);
  }

  if (!Array.isArray(this.readBy)) this.readBy = [];
  next();
});

MessageSchema.statics.send = async function({ from, to, text, book = null }) 
{
  const Message = this;
  const conv = Message.convKey(from, to, book || null);
  const doc = await Message.create({ from, to, text: String(text).trim(), book: book || null, conv });
  return doc;
};


MessageSchema.statics.markRead = async function(conv, userId) 
{
  const Message = this;
  const uid = new mongoose.Types.ObjectId(userId);
  const res = await Message.updateMany(
    { conv, to: uid, readBy: { $ne: uid } },
    { $addToSet: { readBy: uid } }
  );
  return { modified: res.modifiedCount ?? res.nModified ?? 0 };
};


MessageSchema.statics.listThread = async function(me, peer, book = null, { page='1', limit='50' } = {}) {
  const Message = this;
  const meId   = new mongoose.Types.ObjectId(me);
  const peerId = new mongoose.Types.ObjectId(peer);
  const conv   = Message.convKey(meId, peerId, book || null);

  const pg   = Math.max(1, parseInt(page,10) || 1);
  const lim  = Math.min(200, Math.max(1, parseInt(limit,10) || 50));
  const skip = (pg - 1) * lim;

  const [items, total] = await Promise.all(
  [
    Message.find({ conv }).sort({ createdAt: 1 })
      .populate('from', 'firstName lastName email')
      .populate('to',   'firstName lastName email')
      .skip(skip).limit(lim),
    Message.countDocuments({ conv })
  ]);

  return {
    conv,
    items,
    total,
    page: pg,
    pages: Math.ceil(total / lim)
  };
};




MessageSchema.statics.listConversations = async function(me, { page='1', limit='50' } = {}) 
{
  const Message = this;
  const meId = new mongoose.Types.ObjectId(me);

  const pg   = Math.max(1, parseInt(page,10) || 1);
  const lim  = Math.min(200, Math.max(1, parseInt(limit,10) || 50));
  const skip = (pg - 1) * lim;


  const totalAgg = await Message.aggregate(
  [
    { $match: { $or: [ { from: meId }, { to: meId } ] } },
    { $group: { _id: '$conv' } },
    { $count: 'n' }
  ]);
  const totalConvs = (totalAgg[0]?.n) || 0;

  const pipeline = 
  [
    { $match: { $or: [ { from: meId }, { to: meId } ] } },
    { $sort: { createdAt: -1 } },
    { $addFields: { peerCandidate: { $cond: [ { $eq: ['$from', meId] }, '$to', '$from' ] } } },
    { $group: 
      {
        _id: '$conv',
        lastMessage: { $first: '$$ROOT' },
        lastAt:      { $first: '$createdAt' },
        peerId:      { $first: '$peerCandidate' },
        book:        { $first: '$book' },
        unreadCount: { $sum: 
        {
          $cond: 
          [
            { $and: 
              [
              { $eq: ['$to', meId] },
              { $not: [ { $in: [ meId, '$readBy' ] } ] }
            ] },
            1, 0
          ]
        } }
    } },
    { $lookup: { from: 'users', localField: 'peerId', foreignField: '_id', as: 'peer' } },
    { $unwind: { path: '$peer', preserveNullAndEmptyArrays: true } },
    { $project: 
      {
        conv: '$_id',
        with: '$peerId',         
        peer: 
        {
          _id: '$peer._id',
          firstName: '$peer.firstName',
          lastName:  '$peer.lastName',
          email:     '$peer.email',
        },
        book: 1,
        lastAt: 1,
        unreadCount: 1,
        lastMessage: 
        {
          _id: '$lastMessage._id',
          text: '$lastMessage.text',
          from: '$lastMessage.from',
          to:   '$lastMessage.to',
          createdAt: '$lastMessage.createdAt'
        }
    } },
    { $sort: { lastAt: -1, conv: 1 } },
    { $skip: skip },
    { $limit: lim }
  ];

  const items = await Message.aggregate(pipeline);
  return {
    items,
    total: totalConvs,
    page: pg,
    pages: Math.ceil(totalConvs / lim)
  };
};

module.exports = mongoose.model('Message', MessageSchema);
