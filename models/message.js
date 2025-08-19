const mongoose = require('mongoose');

function convKey(u1, u2, bookId)
{
  const a = String(u1), b = String(u2);
  const [x, y] = a < b ? [a, b] : [b, a];
  return `${x}_${y}_${bookId || 'null'}`;
}

const MessageSchema = new mongoose.Schema(
{
  conv:   { type: String, required: true, index: true },
  book:   { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
  from:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true, trim: true, maxlength: 5000 },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
},
{ timestamps: true }
);

// ускоряет историю чатов
MessageSchema.index({ conv: 1, createdAt: 1 });

MessageSchema.statics.convKey = convKey;

module.exports = mongoose.model('Message', MessageSchema);
