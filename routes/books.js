const express = require('express');
const Book    = require('../models/book');
const jwt     = require('jsonwebtoken');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/genres', async (req, res, next) => 
  {
  try 
  {
    const items = (await Book.distinct('tags')).filter(Boolean).sort();
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
    const { q, genre, owner, ownerId, sort='new', page='1', limit='20' } = req.query;
    const filter = {};

    if (q) filter.$or = [
      { title:  { $regex: q, $options: 'i' } },
      { author: { $regex: q, $options: 'i' } }
    ];

    if (genre)   filter.genre   = genre;
    if (ownerId) filter.ownerId = ownerId;

    if (owner === 'me' && req.headers.authorization) 
    {
      try 
      {
        const payload = jwt.verify((req.headers.authorization||'').replace('Bearer ',''), process.env.JWT_SECRET);
        filter.ownerId = payload.id;
      } catch {}
    }

    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pg - 1) * lim;
    const sortObj = sort === 'old' ? { createdAt: 1 } : { createdAt: -1 };

    const [items, total] = await Promise.all([
      Book.find(filter).sort(sortObj).skip(skip).limit(lim),
      Book.countDocuments(filter)
    ]);

    res.json({ items, total, page: pg, pages: Math.ceil(total/lim) });
  } catch (e) 
  { 
    next(e); 
  }
});

router.get('/:id', async (req, res, next) => 
  {
  try 
  {
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
    const 
    { 
      title,
      author,
      review='',
      cover='',
      genre='',
      tags=[],
      pickup='',
      loc=null 
    } = req.body || {};

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
    fields.forEach(k => 
    { 
      if (k in req.body) book[k] = req.body[k];
    });
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
