const express = require('express');
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/bookController');

const r = express.Router();
r.get('/genres', ctrl.genres);
r.get('/', ctrl.list);
r.get('/:id', ctrl.getOne);
r.post('/', authRequired, ctrl.create);
r.put('/:id', authRequired, ctrl.update);
r.delete('/:id', authRequired, ctrl.remove);
r.post('/:id/like', authRequired, ctrl.like);
r.delete('/:id/like', authRequired, ctrl.unlike);

module.exports = r;
