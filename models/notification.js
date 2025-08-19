const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
{
  to:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:  { type: String, enum: ['message','system','report','other'], default: 'system' },
  title: { type: String, default: '', trim: true },
  text:  { type: String, default: '', trim: true },
  meta:  { type: mongoose.Schema.Types.Mixed, default: {} },
  read:  { type: Boolean, default: false, index: true }
},
{ timestamps: true } // createdAt / updatedAt
);

module.exports = mongoose.model('Notification', NotificationSchema);
