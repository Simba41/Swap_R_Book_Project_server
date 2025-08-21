const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
{
  firstName: { type: String, trim: true, default: '' },
  lastName:  { type: String, trim: true, default: '' },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true },
  avatar:    { type: String, default: '' },

  loc: { lat: { type: Number }, lng: { type: Number } },

  bio:    { type: String, default: '' },
  role:   { type: String, enum: ['user','admin'], default: 'user' }, 
  banned: { type: Boolean, default: false }
}, { timestamps: true });

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

UserSchema.pre('save', async function(next) 
{
  if (!this.isModified('password')) return next();

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
