const express = require('express');
const fetch   = require('node-fetch'); 

const router = express.Router();

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
        return res.json({ items: [] });

    const url = 'https://openlibrary.org/search.json?' + new URLSearchParams({ q, limit: '10' });

    const ctrl = new AbortController();
    const to   = setTimeout(() => ctrl.abort(), 8000); 

    const r = await fetch(url, 
    {
      signal: ctrl.signal,
      headers: 
      {
        'User-Agent': 'Swap-R-Book/1.0 (+https://example.com)',
        'Accept': 'application/json'
      }
    }).catch(err => 
    { 
        throw new Error('FETCH_FAILED: ' + err.message); 
    });

    clearTimeout(to);

    const ct = (r.headers.get('content-type') || '').toLowerCase();
    const raw = await r.text();

    const json = ct.includes('application/json') ? safeJsonParse(raw) : safeJsonParse(raw);

    if (!json || !json.docs) 
    {
      return res.json({ items: [] });
    }

    const items = (json.docs || []).slice(0, 10).map(d => (
    {
      title:  d.title,
      author: (d.author_name && d.author_name[0]) || '',
      year:   d.first_publish_year || null,
      cover:  d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : ''
    }));

    res.json({ items });
  } catch (e) 
  {
    res.json({ items: [] });
  }
});

module.exports = router;
