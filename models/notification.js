const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
{
  to:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:  { type: String, default: 'system' }, 
  title: { type: String, default: '' },
  text:  { type: String, default: '' },
  meta:  { type: Object, default: {} },
  read:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
