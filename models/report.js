const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
{
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
  text: { type: String, required: true, trim: true, maxlength: 5000 },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
