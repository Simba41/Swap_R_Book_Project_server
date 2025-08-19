const mongoose = require('mongoose');

const ChangeSchema = new mongoose.Schema(
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  field:  { type: String, required: true },
  from:   { type: String, default: '' },
  to:     { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Change', ChangeSchema);
