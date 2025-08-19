const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
{
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true, trim: true },
  author:  { type: String, required: true, trim: true },
  review:  { type: String, default: '' },
  cover:   { type: String, default: '' },

  genre:   { type: String, default: '' },     
  tags:    [{ type: String, trim: true }],    

  pickup:  { type: String, default: '' },
  loc: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);
