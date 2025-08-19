const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName:  String,
  email:     { type: String, unique: true, index: true, required: true },
  password:  { type: String, required: true },
  avatar:    { type: String, default: '' },
  loc:       { type: Object, default: null }, 
  role:      { type: String, enum: ['user','admin'], default: 'user' },
  banned:    { type: Boolean, default: false }         
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
