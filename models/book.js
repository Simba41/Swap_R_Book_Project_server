const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
{
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true, trim: true, maxlength: 300 },
  author:  { type: String, required: true, trim: true, maxlength: 200 },
  review:  { type: String, default: '', maxlength: 2000 },
  cover:   { type: String, default: '' },

  genre:   { type: String, default: '' },
  tags:    [{ type: String, trim: true }],

  pickup:  { type: String, default: '' },
  likes:   { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  loc: {    lat: { type: Number },  lng: { type: Number } }
}, { timestamps: true });


BookSchema.index({ ownerId: 1, createdAt: -1 });
BookSchema.index({ title: 'text', author: 'text', review: 'text' });
BookSchema.index({ tags: 1 });
BookSchema.index({ genre: 1 });


BookSchema.methods.toJSON = function() 
{
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Book', BookSchema);
