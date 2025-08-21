const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
{
  firstName: { type: String, trim: true },
  lastName:  { type: String, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },   
  avatar:    { type: String, default: '' },
  loc:       { type: { lat: Number, lng: Number }, default: null },
  bio:       { type: String, default: '' },
  role:      { type: String, enum:['user','admin'], default: 'user' },
  banned:    { type: Boolean, default: false }
}, { timestamps: true });

UserSchema.methods.toJSON = function() 
{
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
