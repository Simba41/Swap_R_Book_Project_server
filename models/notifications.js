const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
{
  to:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: '' },
  text:  { type: String, default: '' },
  type:  { type: String, default: 'info' }, 
  read:  { type: Boolean, default: false },
  meta:  { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
