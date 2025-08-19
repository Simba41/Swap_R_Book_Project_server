const express = require('express');
const Book    = require('../models/book');
const User    = require('../models/user');

const router = express.Router();

router.get('/books-per-genre', async (req, res, next) => 
{
  try 
  {
    const agg = await Book.aggregate([
      { $match: { genre: { $ne: '' } } },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]);
    res.json({ items: agg.map(x => ({ genre: x._id, count: x.count })) });
  } catch (e) 
  { 
    next(e); 
  }
});

router.get('/top-owners', async (req, res, next) => 
{
  try 
  {
    const lim = Math.min(20, Math.max(1, parseInt(req.query.limit,10)||5));
    const agg = await Book.aggregate([
      { $group: { _id: '$ownerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: lim }
    ]);
    res.json({ items: agg });
  } catch (e) 
  { 
    next(e); 
  }
});


router.get('/counts', async (req, res, next) => 
{
  try 
  {
    const [users, books] = await Promise.all([
      User.countDocuments(), Book.countDocuments()
    ]);
    res.json({ users, books });
  } catch (e) 
  { 
    next(e); 
  }
});

module.exports = router;
