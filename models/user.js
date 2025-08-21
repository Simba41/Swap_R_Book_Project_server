const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

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

UserSchema.pre('save', async function(next) 
{
  if (!this.isModified('password')) 
    return next();
  try 
  {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) { next(err); }
});

UserSchema.methods.comparePassword = function(candidate) 
{
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.toJSON = function() 
{
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
