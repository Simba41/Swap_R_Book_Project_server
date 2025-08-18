const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
{
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  author:  { type: String, required: true },
  review:  { type: String, default: '' },
  cover:   { type: String, default: '' },   
  genre:   { type: String, default: '' },
  tags:    { type: [String], default: [] },
  pickup:  { type: String, default: '' },
  loc:     { lat: Number, lng: Number }
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);
