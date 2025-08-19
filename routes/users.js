const express = require('express');
const User    = require('../models/user');
const { authRequired } = require('../middleware/auth'); 
const Change  = require('../models/change'); 

const router = express.Router();

router.put('/me', authRequired, async (req, res, next) => 
{
  try
  {
    const allowed=['firstName','lastName','email','avatar','loc']; 
    const u=await User.findById(req.user.id);

    if(!u) 
        return res.status(404).json({message:'User not found'}); 

    for(const k of allowed)
    {
      if(k in req.body)
        {
        const before=(u[k]&&typeof u[k]==='object')? JSON.stringify(u[k]):String(u[k]||'');
        const after=(req.body[k]&&typeof req.body[k]==='object')? JSON.stringify(req.body[k]):String(req.body[k]||''); 
        if(before!==after)
        {
          u[k]=req.body[k]; 
          await Change.create({userId:u._id,field:k,from:before,to:after}); 
        }
      }
    }
    await u.save(); 
    res.json({ok:true});
  }catch(e)
  { 
    next(e); 
}
});

router.put('/me/password', authRequired, async (req,res,next)=>
{ 
  try
  {
    const { currentPassword='',newPassword='' }=req.body||{};
    const u=await User.findById(req.user.id); 
    if(!u) return res.status(404).json({message:'User not found'}); 
    const ok=await require('bcryptjs').compare(currentPassword,u.password); 
    if(!ok) return res.status(400).json({message:'Invalid current password'});
    if(!newPassword||newPassword.length<8) return res.status(400).json({message:'Weak password'}); 
    const hash=await require('bcryptjs').hash(newPassword,10); 
    u.password=hash; await u.save(); 
    await Change.create({userId:u._id,field:'password',from:'***',to:'***'});
    res.json({ok:true});
  }catch(e){ next(e); }
});

router.get('/:id', async (req,res,next)=>
{
  try
  {
    const u=await User.findById(req.params.id).select('_id firstName lastName email avatar loc');

    if(!u) 
        return res.status(404).json({message:'User not found'});

    res.json({ id:u._id, name:`${u.firstName} ${u.lastName}`, email:u.email, avatar:u.avatar, loc:u.loc||null });
  }catch(e)
  { 
    next(e); 
  }
});

module.exports = router;