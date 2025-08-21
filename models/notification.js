const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
{
  to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, trim: true }, 

  title: { type: String, default: '' },
  text:  { type: String, default: '' },

  meta:  { type: Object, default: {} },

  read:  { type: Boolean, default: false, index: true },
}, { timestamps: true });

NotificationSchema.index({ to: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
