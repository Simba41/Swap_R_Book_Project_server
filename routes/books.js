const express = require('express');
const Book    = require('../models/book');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => 
{
  try 
  {
    const { q, genre } = req.query;
    const filter = {};

    if (q) 
    {
      filter.$or = 
      [
        { title:  { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } }
      ];
    }

    if (genre) 
      filter.genre = genre;


    const items = await Book.find(filter).sort({ createdAt: -1 }).limit(200);

    res.json({ items });

  } catch (e) 
  { 
    next(e); 
  }
});


router.get('/:id', async (req, res, next) => 
{
  try 
  {
    const book = await Book.findById(req.params.id);

    if (!book) 
      return res.status(404).json({ message: 'Book not found' });


    res.json(book);
  } catch (e) 
  { 
    next(e); 
  }
});


router.post('/', authRequired, async (req, res, next) => 
{
  try 
  {
    const { title, author, review, cover, genre, tags, pickup, loc } = req.body || {};

    if (!title || !author) 
      return res.status(400).json({ message: 'Title and author are required' });


    const book = await Book.create(
    {
      ownerId: req.user.id,
      title, author, review, cover, genre, tags, pickup, loc
    });

    res.status(201).json(book);
  } catch (e) 
  { 
    next(e); 
  }
});

module.exports = router;
