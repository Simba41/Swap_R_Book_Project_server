const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
{
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true, index: true },
  password:  { type: String, required: true },
  avatar:    { type: String, default: '' }, 
  loc:       { lat: Number, lng: Number }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
