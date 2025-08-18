const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const User    = require('../models/user');
const { authRequired } = require('../middleware/auth'); 

const router = express.Router();

router.post('/register', async (req, res, next) =>
{
  try 
  {
    const { firstName, lastName, email, password } = req.body || {};
    if (!firstName || !lastName || !email || !password) 
      return res.status(400).json({ message: 'Missing fields' });


    const exists = await User.findOne({ email });
    if (exists) 
      return res.status(409).json({ message: 'Email already registered' });


    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, password: hash });

    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, firstName, lastName, email, role: user.role } });
  } catch (e) 
  { 
    next(e);
  }
});

router.post('/login', async (req, res, next) =>
{
  try 
  {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });

    if (!user) 
      return res.status(401).json({ message: 'Invalid credentials' });


    const ok = await bcrypt.compare(password, user.password);

    if (!ok) 
      return res.status(401).json({ message: 'Invalid credentials' });


    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } });
  } catch (e) 
  { 
    next(e); 
  }
});


router.get('/me', authRequired, async (req, res, next) =>
{
  try 
  {
    const u = await User.findById(req.user.id).select('_id firstName lastName email avatar loc role');

    if (!u) 
      return res.status(404).json({ message: 'User not found' });


    res.json(
    { 
        user: 
        { 
          id: u._id, 
          firstName: u.firstName, 
          lastName: u.lastName, 
          email: u.email, 
          avatar: u.avatar, 
          loc: u.loc, 
          role: u.role 
        } 
    });
  } catch (e) 
  { 
    next(e); 
  }
});

module.exports = router;
