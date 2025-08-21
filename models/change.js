const mongoose = require('mongoose');

const ChangeSchema = new mongoose.Schema(
{
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  action: { type: String, required: true, trim: true }, 
  field:  { type: String },                         
  from:   { type: String, default: '' },
  to:     { type: String, default: '' },
  diff:   { type: Object },                           
}, { timestamps: true });

ChangeSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Change', ChangeSchema);
