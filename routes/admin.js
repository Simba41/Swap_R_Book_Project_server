const express = require('express');
const { authRequired, adminRequired } = require('../middleware/auth');

const User = require('../models/user');
const Book = require('../models/book');
const Message = require('../models/message');
const Notification = require('../models/notification');
const Report = require('../models/report');
const Change = require('../models/change');

const router = express.Router();
router.use(authRequired, adminRequired);

router.get('/metrics', async (req,res,next)=>
{
  try 
  {
    const [users, books, messages, notifs] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Message.countDocuments(),
      Notification.countDocuments()
    ]);
    res.json({ users, books, messages, notifications: notifs });
  } catch(e) 
  { 
    next(e); 
  }
});




router.get('/users', async (req,res,next)=>
{
  try 
  {
    const { q='', page='1', limit='20' } = req.query;
    const rx = q ? new RegExp(q,'i') : null;
    const filter = rx ? { $or:[{ firstName:rx },{ lastName:rx },{ email:rx }] } : {};
    const pg=Math.max(1,parseInt(page,10)||1);
    const lim=Math.min(100,Math.max(1,parseInt(limit,10)||20));
    const skip=(pg-1)*lim;
    const [items,total] = await Promise.all([
      User.find(filter).select('_id firstName lastName email role banned createdAt').sort({createdAt:-1}).skip(skip).limit(lim),
      User.countDocuments(filter)
    ]);
    res.json({ items,total,page:pg,pages:Math.ceil(total/lim) });
  }catch(e) { next(e); }
});

router.put('/users/:id/ban',   async(req,res,next)=>
{ 
    try 
    { 
      await User.findByIdAndUpdate(req.params.id,{ banned:true });  
      res.json({ok:true}); 
    }catch(e)
    { 
      next(e); 
    }
});


router.put('/users/:id/unban', async(req,res,next)=>
{ 
  try 
  { 
    await User.findByIdAndUpdate(req.params.id,{ banned:false }); 
    res.json({ok:true}); 
  }catch(e)
  { 
    next(e); 
  }
});

router.get('/books', async (req,res,next)=>
{
  try 
  {
    const { q='', ownerId } = req.query;
    const filter={};
    if(ownerId) filter.ownerId=ownerId;

    if(q) filter.$or=[{title:{$regex:q,$options:'i'}},{author:{$regex:q,$options:'i'}}];

    const items=await Book.find(filter).sort({createdAt:-1}).limit(100);
    res.json({ items });
  }catch(e) 
  { 
    next(e); 
  }
});

router.get('/reports', async(req,res,next)=>
{
  try 
  {
    const { page='1', limit='50' } = req.query;
    const pg=Math.max(1,parseInt(page,10)||1);
    const lim=Math.min(200,Math.max(1,parseInt(limit,10)||50));
    const skip=(pg-1)*lim;
    const [items,total]=await Promise.all([
      Report.find({}).sort({createdAt:-1}).skip(skip).limit(lim),
      Report.countDocuments()
    ]);
    res.json({ items,total,page:pg,pages:Math.ceil(total/lim) });
  }catch(e) 
  { 
    next(e); 
  }
});

router.put('/reports/:id/resolve', async(req,res,next)=>
{ 
  try 
  { 
    await Report.findByIdAndUpdate(req.params.id,{ resolved:true }); 
    res.json({ok:true}); 
  }catch(e)
  { 
    next(e); 
  }
});

router.get('/changes', async(req,res,next)=>
{
  try 
  {
    const { page='1', limit='50', userId=null } = req.query;
    const filter=userId?{userId}:{}; 
    const pg=Math.max(1,parseInt(page,10)||1);
    const lim=Math.min(200,Math.max(1,parseInt(limit,10)||50));
    const skip=(pg-1)*lim;
    const [items,total]=await Promise.all([
      Change.find(filter).sort({createdAt:-1}).skip(skip).limit(lim),
      Change.countDocuments(filter)
    ]);
    res.json({ items,total,page:pg,pages:Math.ceil(total/lim) });
  }catch(e) 
  { 
    next(e); 
  }
});


router.get('/messages', async (req,res,next)=>
{
  try 
  {
    const { user, with:withId, book=null, page='1', limit='50', q='' } = req.query||{};


    if (!user || !withId)  
    {
      const pg  = Math.max(1, parseInt(page,10)||1);              
      const lim = Math.min(200, Math.max(1, parseInt(limit,10)||50)); 
      const skip= (pg - 1) * lim;                                 

      const filter = {};                                          
      if (q) filter.text = { $regex: q, $options: 'i' };           

      const base = Message
        .find(filter)
        .select('_id from to text book createdAt')                
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim)
        .populate('from', 'email firstName lastName')            
        .populate('to',   'email firstName lastName');       

      const [items, total] = await Promise.all(
      [
        base.exec(),                                         
        Message.countDocuments(filter)                        
      ]);

      return res.json({
        items,
        total,
        page: pg,
        pages: Math.ceil(total/lim)
      });                                                     
    }


    const conv = Message.convKey(user, withId, book);
    const items=await Message.find({ conv }).sort({createdAt:1});
    res.json({ items });
  }catch(e) 
  { 
    next(e); 
  }
});

module.exports = router;
