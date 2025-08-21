const mongoose = require('mongoose');

const SwapSchema = new mongoose.Schema(
{
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  confirmA: { type: Boolean, default: false },
  confirmB: { type: Boolean, default: false }
}, { timestamps: true });

SwapSchema.index({ book: 1, userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model('Swap', SwapSchema);
