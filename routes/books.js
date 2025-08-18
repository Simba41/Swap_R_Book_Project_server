const express = require('express');
const Book    = require('../models/book');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/genres', async (req, res, next) =>
{
  try 
  {
    const items = (await Book.distinct('genre')).filter(Boolean).sort();
    res.json({ items });
  } catch (e) 
  { 
    next(e); 
  }
});

router.get('/', async (req, res, next) =>
{
  try 
  {
    const { q, genre, ownerId } = req.query;
    const filter = {};

    if (q) filter.$or = 
    [
      { title:  { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } }
    ];


    if (genre)   
      filter.genre   = genre;


    if (ownerId) 
      filter.ownerId = ownerId;


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
    // **ДОБАВЛЕНО**: populate владельца (минимально)
    const book = await Book.findById(req.params.id).populate('ownerId', 'firstName lastName avatar loc');

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
    

    const book = await Book.create({ ownerId: req.user.id, title, author, review, cover, genre, tags, pickup, loc });
    res.status(201).json(book);
  } catch (e) 
  { 
    next(e); 
  }
});


router.put('/:id', authRequired, async (req, res, next) =>
{
  try 
  {
    const book = await Book.findById(req.params.id);

    if (!book) 
      return res.status(404).json({ message: 'Book not found' });


    const isOwner = String(book.ownerId) === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) 
      return res.status(403).json({ message: 'Forbidden' });


    const fields = ['title','author','review','cover','genre','tags','pickup','loc'];
    fields.forEach(k => { if (k in req.body) book[k] = req.body[k]; });
    await book.save();

    res.json(book);
  } catch (e) 
  { 
    next(e); 
  }
});


router.delete('/:id', authRequired, async (req, res, next) =>
{
  try 
  {
    const book = await Book.findById(req.params.id);

    if (!book) 
      return res.status(404).json({ message: 'Book not found' });


    const isOwner = String(book.ownerId) === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) 
      return res.status(403).json({ message: 'Forbidden' });


    await book.deleteOne();
    res.json({ ok: true });
    
  } catch (e) 
  { 
    next(e); 
  }
});

module.exports = router;
