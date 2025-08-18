const express = require('express');
const User    = require('../models/user');

const router = express.Router();

router.get('/:id', async (req, res, next) =>
{
    try 
    { 
        const u = await User.findById(req.params.id).select('_id firstName lastName email avatar loc');

        if (!u) 
            return res.status(404).json({ message: 'User not found' });

        
        res.json({ id: u._id, name: `${u.firstName} ${u.lastName}`, email: u.email, avatar: u.avatar, loc: u.loc || null });
    } catch (e) 
    { 
        next(e); 
    }
});

module.exports = router;
