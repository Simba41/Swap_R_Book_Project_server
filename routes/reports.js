const express = require('express');
const Report = require('../models/report');
const router = express.Router();

router.post('/', async (req,res,next)=>
{
  try
  {
    const { to=null, book=null, text='' } = req.body || {};

    if (!text.trim()) 
        return res.status(400).json({ message: 'text required' });

    let from = null;
    try 
    {
      if (req.headers.authorization) 
    {
        const a = require('jsonwebtoken').verify(
          req.headers.authorization.replace('Bearer ',''), 
          process.env.JWT_SECRET
        );
        from = a.id;
      }
    } catch {}
    const r = await Report.create({ from, to, book, text });
    res.status(201).json({ ok:true, id:r._id });
  } catch(e)
  { 
    next(e); 
}
});

module.exports = router;
