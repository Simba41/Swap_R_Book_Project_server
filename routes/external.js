
const express = require('express');
const router  = express.Router();


const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));


function safeJsonParse(text)
{
  try 
  { 
    return JSON.parse(text); 
  } catch 
  { 
    return null; 
  }
}




router.get('/books', async (req, res, next) =>
{
  try
  {
    const q = (req.query.q || '').trim();

    if (!q) 
      return res.status(400).json({ error: 'Missing query param: q' });

    const url  = 'https://openlibrary.org/search.json?' + new URLSearchParams({ q, limit: '10' });

    const ctrl = new AbortController();
    const to   = setTimeout(() => ctrl.abort(), 8000);

    const r = await fetch(url, 
    {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Swap-R-Book/1.0 (+https://example.com)',
        'Accept': 'application/json'
      }
    });

    clearTimeout(to);

    const raw = await r.text();
    const json = safeJsonParse(raw);

    if (!json || !json.docs) 
      return res.json({ items: [] });

    const items = json.docs.slice(0, 10).map(d => (
    {
      title:  d.title,
      author: Array.isArray(d.author_name) ? (d.author_name[0] || '') : '',
      year:   d.first_publish_year || null,
      cover:  d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : ''
    }));

    res.json({ query: q, items });
  }
  catch (e)
  {
    next(e);
  }
});

module.exports = router;
